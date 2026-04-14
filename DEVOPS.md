# JandJ Infra — DevOps Guide

Complete guide for Docker, Kubernetes (EKS), and Jenkins CI/CD deployment.

---

## Table of Contents

1. [Project Structure](#project-structure)
2. [Docker — Local Development](#docker--local-development)
3. [AWS ECR — Container Registry](#aws-ecr--container-registry)
4. [AWS EKS — Kubernetes Cluster](#aws-eks--kubernetes-cluster)
5. [Deploying to EKS](#deploying-to-eks)
6. [Jenkins CI/CD](#jenkins-cicd)
7. [IAM Roles & Permissions](#iam-roles--permissions)
8. [Production Best Practices](#production-best-practices)
9. [Troubleshooting](#troubleshooting)

---

## Project Structure

```
JandJInfra/
├── backend/
│   ├── Dockerfile              # Optimized multi-stage Node.js image
│   ├── .dockerignore
│   ├── .env.example
│   └── src/
├── frontend/
│   ├── Dockerfile              # Multi-stage Vite build → nginx
│   ├── .dockerignore
│   ├── nginx.conf              # Reverse proxy + SPA config
│   └── src/
├── k8s/
│   ├── 00-namespace.yaml       # jandj-infra namespace
│   ├── 01-configmap.yaml       # Non-sensitive backend config
│   ├── 02-secrets.yaml         # Sensitive values (base64)
│   ├── 03-mongo.yaml           # MongoDB Deployment + PVC + Service
│   ├── 04-backend.yaml         # Backend Deployment + Service + HPA
│   ├── 05-frontend.yaml        # Frontend Deployment + Service + HPA
│   └── 06-ingress.yaml         # ALB/NGINX Ingress
├── jenkins/
│   └── README.md               # Jenkins setup instructions
├── docker-compose.yaml         # Local dev environment
├── Jenkinsfile                 # CI/CD pipeline
└── DEVOPS.md                   # ← This file
```

---

## Docker — Local Development

### Prerequisites

- Docker Desktop installed and running
- Docker Compose v2+

### Build and Run Locally

```bash
# Build and start all services
docker compose up --build -d

# View logs
docker compose logs -f

# Access the application
#   Frontend:  http://localhost:3000
#   Backend:   http://localhost:5000/api/health
#   MongoDB:   localhost:27017

# Stop everything
docker compose down

# Stop and remove volumes (full reset)
docker compose down -v
```

### Build Images Individually

```bash
# Backend
docker build -t jandj-backend:latest ./backend

# Frontend (with API URL baked in)
docker build --build-arg VITE_API_BASE_URL="/api" -t jandj-frontend:latest ./frontend
```

---

## AWS ECR — Container Registry

### Step 1: Create ECR Repositories

```bash
AWS_REGION=ap-south-1  # Change to your region

aws ecr create-repository --repository-name jandj-backend  --region $AWS_REGION
aws ecr create-repository --repository-name jandj-frontend --region $AWS_REGION
```

### Step 2: Authenticate Docker with ECR

```bash
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
ECR_REGISTRY="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"

aws ecr get-login-password --region $AWS_REGION \
  | docker login --username AWS --password-stdin $ECR_REGISTRY
```

### Step 3: Tag and Push Images

```bash
# Tag
docker tag jandj-backend:latest  $ECR_REGISTRY/jandj-backend:latest
docker tag jandj-frontend:latest $ECR_REGISTRY/jandj-frontend:latest

# Push
docker push $ECR_REGISTRY/jandj-backend:latest
docker push $ECR_REGISTRY/jandj-frontend:latest
```

---

## AWS EKS — Kubernetes Cluster

### Prerequisites

```bash
# Install AWS CLI v2
# https://docs.aws.amazon.com/cli/latest/userguide/install-cliv2.html

# Install eksctl
# https://eksctl.io/installation/

# Install kubectl
# https://kubernetes.io/docs/tasks/tools/

# Verify installations
aws --version
eksctl version
kubectl version --client
```

### Step 1: Create the EKS Cluster

```bash
eksctl create cluster \
  --name jandj-infra-cluster \
  --region ap-south-1 \
  --version 1.29 \
  --nodegroup-name jandj-workers \
  --node-type t3.medium \
  --nodes 2 \
  --nodes-min 2 \
  --nodes-max 4 \
  --managed \
  --with-oidc \
  --ssh-access \
  --ssh-public-key your-key-pair-name
```

> **Note:** This takes 15-20 minutes. For cost-conscious setups, use `t3.small` with 2 nodes.

### Step 2: Verify and Configure kubectl

```bash
# eksctl automatically updates kubeconfig, but you can do it manually:
aws eks update-kubeconfig --name jandj-infra-cluster --region ap-south-1

# Verify connection
kubectl cluster-info
kubectl get nodes
```

### Step 3: Install AWS Load Balancer Controller (for ALB Ingress)

```bash
# Create IAM OIDC provider (if not done by eksctl)
eksctl utils associate-iam-oidc-provider \
  --cluster jandj-infra-cluster \
  --region ap-south-1 \
  --approve

# Create IAM policy
curl -o iam_policy.json https://raw.githubusercontent.com/kubernetes-sigs/aws-load-balancer-controller/v2.7.1/docs/install/iam_policy.json

aws iam create-policy \
  --policy-name AWSLoadBalancerControllerIAMPolicy \
  --policy-document file://iam_policy.json

# Create service account
eksctl create iamserviceaccount \
  --cluster=jandj-infra-cluster \
  --namespace=kube-system \
  --name=aws-load-balancer-controller \
  --role-name AmazonEKSLoadBalancerControllerRole \
  --attach-policy-arn=arn:aws:iam::${AWS_ACCOUNT_ID}:policy/AWSLoadBalancerControllerIAMPolicy \
  --approve

# Install via Helm
helm repo add eks https://aws.github.io/eks-charts
helm repo update

helm install aws-load-balancer-controller eks/aws-load-balancer-controller \
  -n kube-system \
  --set clusterName=jandj-infra-cluster \
  --set serviceAccount.create=false \
  --set serviceAccount.name=aws-load-balancer-controller
```

---

## Deploying to EKS

### Step 1: Update K8s Manifests

Before applying, update these placeholders:

| File | Placeholder | Replace With |
|------|-------------|--------------|
| `k8s/02-secrets.yaml` | base64 values | Your real secrets (base64-encoded) |
| `k8s/04-backend.yaml` | `<AWS_ACCOUNT_ID>`, `<REGION>` | Your AWS account ID and region |
| `k8s/05-frontend.yaml` | `<AWS_ACCOUNT_ID>`, `<REGION>` | Your AWS account ID and region |
| `k8s/06-ingress.yaml` | `jandj.yourdomain.com` | Your actual domain |
| `k8s/06-ingress.yaml` | ACM certificate ARN | Your SSL certificate ARN |

### Step 2: Apply All Manifests

```bash
# Apply everything in order
kubectl apply -f k8s/

# Or apply individually
kubectl apply -f k8s/00-namespace.yaml
kubectl apply -f k8s/01-configmap.yaml
kubectl apply -f k8s/02-secrets.yaml
kubectl apply -f k8s/03-mongo.yaml
kubectl apply -f k8s/04-backend.yaml
kubectl apply -f k8s/05-frontend.yaml
kubectl apply -f k8s/06-ingress.yaml
```

### Step 3: Verify Deployment

```bash
# Check pod status
kubectl get pods -n jandj-infra -w

# Check services
kubectl get svc -n jandj-infra

# Check ingress (get ALB URL)
kubectl get ingress -n jandj-infra

# View logs
kubectl logs -f deployment/backend  -n jandj-infra
kubectl logs -f deployment/frontend -n jandj-infra

# Describe pod for debugging
kubectl describe pod <pod-name> -n jandj-infra
```

### Step 4: Quick Access (Port Forwarding)

```bash
# Access backend locally
kubectl port-forward svc/backend-svc 5000:5000 -n jandj-infra

# Access frontend locally
kubectl port-forward svc/frontend-svc 3000:80 -n jandj-infra
```

---

## Jenkins CI/CD

See [`jenkins/README.md`](jenkins/README.md) for detailed Jenkins setup.

### Quick Setup

1. Install Jenkins with required plugins (Pipeline, AWS Steps, Docker Pipeline)
2. Add credentials in Jenkins:
   - `aws-credentials` — IAM Access Key + Secret
   - `aws-account-id` — 12-digit AWS Account ID
3. Create a **Pipeline** job pointing to the `Jenkinsfile` in this repo
4. The pipeline automatically: Checkout → Install → Test → Build → Push → Deploy

### Pipeline Stages

```
Checkout → Install Dependencies → Run Tests → Build Docker Images → Push to ECR → Deploy to EKS → Smoke Test
```

---

## IAM Roles & Permissions

### Jenkins IAM User Policy

Create an IAM user (or role for EC2-based Jenkins) with this policy:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "ECRAccess",
      "Effect": "Allow",
      "Action": [
        "ecr:GetAuthorizationToken",
        "ecr:BatchCheckLayerAvailability",
        "ecr:GetDownloadUrlForLayer",
        "ecr:BatchGetImage",
        "ecr:PutImage",
        "ecr:InitiateLayerUpload",
        "ecr:UploadLayerPart",
        "ecr:CompleteLayerUpload",
        "ecr:CreateRepository",
        "ecr:DescribeRepositories"
      ],
      "Resource": "*"
    },
    {
      "Sid": "EKSAccess",
      "Effect": "Allow",
      "Action": [
        "eks:DescribeCluster",
        "eks:ListClusters",
        "eks:UpdateKubeconfig"
      ],
      "Resource": "arn:aws:eks:*:*:cluster/jandj-infra-cluster"
    },
    {
      "Sid": "STSIdentity",
      "Effect": "Allow",
      "Action": "sts:GetCallerIdentity",
      "Resource": "*"
    }
  ]
}
```

### EKS RBAC — Grant Jenkins kubectl Access

After creating the cluster, map the Jenkins IAM user to a Kubernetes role:

```bash
# Edit the aws-auth ConfigMap
kubectl edit configmap aws-auth -n kube-system
```

Add under `mapUsers`:

```yaml
- userarn: arn:aws:iam::ACCOUNT_ID:user/jenkins-user
  username: jenkins
  groups:
    - system:masters
```

### EKS Node Group IAM Role

The managed node group needs these AWS-managed policies:
- `AmazonEKSWorkerNodePolicy`
- `AmazonEKS_CNI_Policy`
- `AmazonEC2ContainerRegistryReadOnly`

> `eksctl` attaches these automatically when using `--managed`.

---

## Production Best Practices

### Security
- [ ] Use **AWS Secrets Manager** + **External Secrets Operator** instead of K8s Secrets
- [ ] Enable **Pod Security Standards** (restricted)
- [ ] Use **Network Policies** to restrict inter-pod traffic
- [ ] Scan Docker images with **Trivy** or **ECR image scanning**
- [ ] Rotate all secrets regularly (JWT, DB, SMTP, Cloudinary)

### High Availability
- [ ] Use **MongoDB Atlas** or **AWS DocumentDB** instead of in-cluster MongoDB
- [ ] Configure **Pod Disruption Budgets** for zero-downtime node upgrades
- [ ] Use **multi-AZ** node groups
- [ ] Enable **cluster autoscaler** for dynamic node scaling

### Monitoring & Observability
- [ ] Install **Prometheus + Grafana** via Helm for metrics
- [ ] Install **Fluent Bit** for centralized logging to CloudWatch
- [ ] Set up **CloudWatch Container Insights**
- [ ] Add **alerting** for pod restarts, high CPU/memory, 5xx errors

### Cost Optimization
- [ ] Use **Spot Instances** for non-critical workloads
- [ ] Right-size resource requests/limits based on actual usage
- [ ] Set up **Karpenter** for efficient node provisioning

---

## Troubleshooting

### Pod stuck in CrashLoopBackOff
```bash
kubectl logs <pod-name> -n jandj-infra --previous
kubectl describe pod <pod-name> -n jandj-infra
```

### ImagePullBackOff
```bash
# Verify ECR login
aws ecr get-login-password --region ap-south-1 | docker login --username AWS --password-stdin $ECR_REGISTRY

# Verify image exists
aws ecr describe-images --repository-name jandj-backend --region ap-south-1
```

### MongoDB Connection Refused
```bash
# Check if mongo pod is running
kubectl get pods -n jandj-infra -l app=mongo

# Verify the service DNS
kubectl run debug --rm -it --image=busybox -n jandj-infra -- nslookup mongo-svc
```

### Ingress Not Getting ALB
```bash
# Check ALB controller logs
kubectl logs -n kube-system deployment/aws-load-balancer-controller

# Verify ingress annotations
kubectl describe ingress jandj-ingress -n jandj-infra
```

### Scale Deployments Manually
```bash
kubectl scale deployment/backend  --replicas=3 -n jandj-infra
kubectl scale deployment/frontend --replicas=3 -n jandj-infra
```

### Rolling Restart (pick up new secrets/config)
```bash
kubectl rollout restart deployment/backend  -n jandj-infra
kubectl rollout restart deployment/frontend -n jandj-infra
```

---

## Quick Command Reference

| Action | Command |
|--------|---------|
| Build all locally | `docker compose up --build -d` |
| Stop local env | `docker compose down` |
| Build backend image | `docker build -t jandj-backend ./backend` |
| Build frontend image | `docker build --build-arg VITE_API_BASE_URL="/api" -t jandj-frontend ./frontend` |
| Push to ECR | `docker push $ECR_REGISTRY/jandj-backend:latest` |
| Apply K8s manifests | `kubectl apply -f k8s/` |
| Check pods | `kubectl get pods -n jandj-infra` |
| View backend logs | `kubectl logs -f deploy/backend -n jandj-infra` |
| Port-forward backend | `kubectl port-forward svc/backend-svc 5000:5000 -n jandj-infra` |
| Rollout status | `kubectl rollout status deploy/backend -n jandj-infra` |
| Delete everything | `kubectl delete -f k8s/` |
| Delete EKS cluster | `eksctl delete cluster --name jandj-infra-cluster --region ap-south-1` |
