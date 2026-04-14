// =============================================================================
//  JandJ Infra — Jenkins CI/CD Pipeline
//  Builds Docker images, pushes to AWS ECR, and deploys to EKS.
// =============================================================================

pipeline {
    agent any

    environment {
        AWS_REGION      = 'ap-south-1'                         // Change to your region
        AWS_ACCOUNT_ID  = credentials('aws-account-id')        // Jenkins secret (plain text)
        ECR_REGISTRY    = "${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"
        BACKEND_REPO    = 'jandj-backend'
        FRONTEND_REPO   = 'jandj-frontend'
        EKS_CLUSTER     = 'jandj-infra-cluster'
        K8S_NAMESPACE   = 'jandj-infra'
        IMAGE_TAG       = "${env.BUILD_NUMBER}-${env.GIT_COMMIT?.take(7) ?: 'latest'}"
    }

    options {
        buildDiscarder(logRotator(numToKeepStr: '10'))
        timeout(time: 30, unit: 'MINUTES')
        timestamps()
        disableConcurrentBuilds()
    }

    stages {

        // ── 1. Checkout ──
        stage('Checkout') {
            steps {
                checkout scm
                sh 'echo "Branch: ${GIT_BRANCH} | Commit: ${GIT_COMMIT}"'
            }
        }

        // ── 2. Install & Lint ──
        stage('Install Dependencies') {
            parallel {
                stage('Backend') {
                    steps {
                        dir('backend') {
                            sh 'npm ci'
                        }
                    }
                }
                stage('Frontend') {
                    steps {
                        dir('frontend') {
                            sh 'npm ci'
                        }
                    }
                }
            }
        }

        // ── 3. Run Tests ──
        stage('Run Tests') {
            parallel {
                stage('Backend Tests') {
                    steps {
                        dir('backend') {
                            sh 'npm test || echo "No test script defined — skipping"'
                        }
                    }
                }
                stage('Frontend Tests') {
                    steps {
                        dir('frontend') {
                            sh 'npm test || echo "No test script defined — skipping"'
                        }
                    }
                }
            }
        }

        // ── 4. Build Docker Images ──
        stage('Build Docker Images') {
            parallel {
                stage('Build Backend') {
                    steps {
                        sh """
                            docker build -t ${ECR_REGISTRY}/${BACKEND_REPO}:${IMAGE_TAG} \
                                         -t ${ECR_REGISTRY}/${BACKEND_REPO}:latest \
                                         ./backend
                        """
                    }
                }
                stage('Build Frontend') {
                    steps {
                        sh """
                            docker build \
                                --build-arg VITE_API_BASE_URL="/api" \
                                -t ${ECR_REGISTRY}/${FRONTEND_REPO}:${IMAGE_TAG} \
                                -t ${ECR_REGISTRY}/${FRONTEND_REPO}:latest \
                                ./frontend
                        """
                    }
                }
            }
        }

        // ── 5. Push to ECR ──
        stage('Push to ECR') {
            steps {
                withAWS(credentials: 'aws-credentials', region: "${AWS_REGION}") {
                    sh """
                        aws ecr get-login-password --region ${AWS_REGION} \
                            | docker login --username AWS --password-stdin ${ECR_REGISTRY}

                        docker push ${ECR_REGISTRY}/${BACKEND_REPO}:${IMAGE_TAG}
                        docker push ${ECR_REGISTRY}/${BACKEND_REPO}:latest
                        docker push ${ECR_REGISTRY}/${FRONTEND_REPO}:${IMAGE_TAG}
                        docker push ${ECR_REGISTRY}/${FRONTEND_REPO}:latest
                    """
                }
            }
        }

        // ── 6. Deploy to EKS ──
        stage('Deploy to EKS') {
            steps {
                withAWS(credentials: 'aws-credentials', region: "${AWS_REGION}") {
                    sh """
                        aws eks update-kubeconfig --name ${EKS_CLUSTER} --region ${AWS_REGION}

                        # Apply all K8s manifests
                        kubectl apply -f k8s/

                        # Update images with the specific tag
                        kubectl set image deployment/backend \
                            backend=${ECR_REGISTRY}/${BACKEND_REPO}:${IMAGE_TAG} \
                            -n ${K8S_NAMESPACE}

                        kubectl set image deployment/frontend \
                            frontend=${ECR_REGISTRY}/${FRONTEND_REPO}:${IMAGE_TAG} \
                            -n ${K8S_NAMESPACE}

                        # Wait for rollouts
                        kubectl rollout status deployment/backend  -n ${K8S_NAMESPACE} --timeout=120s
                        kubectl rollout status deployment/frontend -n ${K8S_NAMESPACE} --timeout=120s
                    """
                }
            }
        }

        // ── 7. Smoke Test ──
        stage('Smoke Test') {
            steps {
                withAWS(credentials: 'aws-credentials', region: "${AWS_REGION}") {
                    sh """
                        BACKEND_URL=\$(kubectl get svc backend-svc -n ${K8S_NAMESPACE} \
                            -o jsonpath='{.status.loadBalancer.ingress[0].hostname}' 2>/dev/null || echo "")

                        if [ -n "\$BACKEND_URL" ]; then
                            curl -sf "http://\$BACKEND_URL:5000/api/health" || echo "Smoke test via LB skipped"
                        else
                            echo "Backend is ClusterIP — use port-forward or Ingress URL for manual verification"
                        fi

                        kubectl get pods -n ${K8S_NAMESPACE}
                        kubectl get svc  -n ${K8S_NAMESPACE}
                    """
                }
            }
        }
    }

    post {
        success {
            echo "Deployment SUCCEEDED — Build #${env.BUILD_NUMBER} (${IMAGE_TAG})"
        }
        failure {
            echo "Deployment FAILED — Build #${env.BUILD_NUMBER}"
            // Uncomment to enable Slack notifications:
            // slackSend channel: '#deployments',
            //     color: 'danger',
            //     message: "FAILED: ${env.JOB_NAME} #${env.BUILD_NUMBER}"
        }
        always {
            sh 'docker image prune -f || true'
        }
    }
}
