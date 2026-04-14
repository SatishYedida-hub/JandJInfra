# Jenkins Setup for JandJ Infra

## Required Jenkins Plugins

1. **Pipeline** — core pipeline support
2. **Pipeline: AWS Steps** — `withAWS()` step
3. **Docker Pipeline** — Docker build/push support
4. **Git** — SCM checkout
5. **Credentials Binding** — secret management
6. **Timestamper** — timestamps in console output

## Required Jenkins Credentials

Create these in **Jenkins → Manage Jenkins → Credentials → Global**:

| Credential ID     | Type           | Description                          |
|-------------------|----------------|--------------------------------------|
| `aws-credentials` | AWS Credentials | IAM Access Key + Secret Key for ECR/EKS |
| `aws-account-id`  | Secret Text    | Your 12-digit AWS Account ID         |

## Jenkins Server Prerequisites

The Jenkins agent must have:

- **Docker** installed and the `jenkins` user added to the `docker` group
- **AWS CLI v2** installed (`aws --version`)
- **kubectl** installed (`kubectl version --client`)
- **Node.js 18+** installed (for `npm ci` / `npm test`)

## Pipeline Location

The `Jenkinsfile` is in the project root. When creating the Jenkins job:

1. Select **Pipeline** project type
2. Under Pipeline → Definition, choose **Pipeline script from SCM**
3. Set SCM to Git with your repository URL
4. Script Path: `Jenkinsfile`
