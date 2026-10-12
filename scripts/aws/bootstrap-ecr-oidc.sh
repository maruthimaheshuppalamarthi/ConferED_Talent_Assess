#!/usr/bin/env bash
# One-time AWS setup for GitHub Actions → ECR → EC2.
# Needs AWS CLI + an identity that can manage IAM, ECR, and (optional) EC2 instance profiles.
#
#   export AWS_REGION=ap-south-1
#   export GITHUB_REPO=maruthimaheshuppalamarthi/ConferED_Talent_Assess
#   export INSTANCE_ID=i-0ab3c97cd6c5a1266   # optional: attach the pull role to the box
#   bash scripts/aws/bootstrap-ecr-oidc.sh
set -euo pipefail

AWS_REGION="${AWS_REGION:-ap-south-1}"
GITHUB_REPO="${GITHUB_REPO:-maruthimaheshuppalamarthi/ConferED_Talent_Assess}"
# GitHub immutable OIDC sub: repo:owner@id/name@id — not repo:owner/name
GITHUB_OIDC_SUB="${GITHUB_OIDC_SUB:-repo:maruthimaheshuppalamarthi@120779125/ConferED_Talent_Assess@1410502235:*}"
ECR_NAME="${ECR_NAME:-confered-api}"
GHA_ROLE_NAME="${GHA_ROLE_NAME:-ConferedGitHubActionsECR}"
EC2_ROLE_NAME="${EC2_ROLE_NAME:-ConferedEC2ECRPull}"
INSTANCE_PROFILE_NAME="${INSTANCE_PROFILE_NAME:-ConferedEC2ECRPull}"
OIDC_URL="https://token.actions.githubusercontent.com"
# GitHub Actions OIDC; IAM verifies the cert chain so this thumbprint is the documented placeholder.
OIDC_THUMBPRINT="ffffffffffffffffffffffffffffffffffffffff"

ACCOUNT_ID="$(aws sts get-caller-identity --query Account --output text)"
ECR_URI="${ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${ECR_NAME}"
OIDC_ARN="arn:aws:iam::${ACCOUNT_ID}:oidc-provider/token.actions.githubusercontent.com"

echo "Account ${ACCOUNT_ID}  region ${AWS_REGION}  repo ${GITHUB_REPO}"

if ! aws ecr describe-repositories --repository-names "${ECR_NAME}" --region "${AWS_REGION}" >/dev/null 2>&1; then
  aws ecr create-repository \
    --repository-name "${ECR_NAME}" \
    --region "${AWS_REGION}" \
    --image-scanning-configuration scanOnPush=true \
    --encryption-configuration encryptionType=AES256 \
    >/dev/null
  echo "Created ECR ${ECR_URI}"
else
  echo "ECR ${ECR_URI} already exists"
fi

aws ecr put-lifecycle-policy --repository-name "${ECR_NAME}" --region "${AWS_REGION}" --lifecycle-policy-text '{
  "rules": [
    {
      "rulePriority": 1,
      "description": "Keep the most recent 20 images",
      "selection": {
        "tagStatus": "any",
        "countType": "imageCountMoreThan",
        "countNumber": 20
      },
      "action": { "type": "expire" }
    }
  ]
}' >/dev/null

if ! aws iam get-open-id-connect-provider --open-id-connect-provider-arn "${OIDC_ARN}" >/dev/null 2>&1; then
  aws iam create-open-id-connect-provider \
    --url "${OIDC_URL}" \
    --client-id-list sts.amazonaws.com \
    --thumbprint-list "${OIDC_THUMBPRINT}" \
    >/dev/null
  echo "Created GitHub OIDC provider"
else
  echo "GitHub OIDC provider already exists"
fi

TRUST_GHA="$(mktemp)"
cat > "${TRUST_GHA}" <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": { "Federated": "${OIDC_ARN}" },
      "Action": ["sts:AssumeRoleWithWebIdentity", "sts:TagSession"],
      "Condition": {
        "StringEquals": {
          "token.actions.githubusercontent.com:aud": "sts.amazonaws.com"
        },
        "StringLike": {
          "token.actions.githubusercontent.com:sub": "${GITHUB_OIDC_SUB}"
        }
      }
    }
  ]
}
EOF

GHA_POLICY="$(mktemp)"
cat > "${GHA_POLICY}" <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AuthToken",
      "Effect": "Allow",
      "Action": "ecr:GetAuthorizationToken",
      "Resource": "*"
    },
    {
      "Sid": "PushPull",
      "Effect": "Allow",
      "Action": [
        "ecr:BatchCheckLayerAvailability",
        "ecr:GetDownloadUrlForLayer",
        "ecr:BatchGetImage",
        "ecr:DescribeRepositories",
        "ecr:DescribeImages",
        "ecr:ListImages",
        "ecr:InitiateLayerUpload",
        "ecr:UploadLayerPart",
        "ecr:CompleteLayerUpload",
        "ecr:PutImage"
      ],
      "Resource": "arn:aws:ecr:${AWS_REGION}:${ACCOUNT_ID}:repository/${ECR_NAME}"
    }
  ]
}
EOF

if ! aws iam get-role --role-name "${GHA_ROLE_NAME}" >/dev/null 2>&1; then
  aws iam create-role \
    --role-name "${GHA_ROLE_NAME}" \
    --assume-role-policy-document "file://${TRUST_GHA}" \
    >/dev/null
  echo "Created IAM role ${GHA_ROLE_NAME}"
else
  aws iam update-assume-role-policy \
    --role-name "${GHA_ROLE_NAME}" \
    --policy-document "file://${TRUST_GHA}"
  echo "Updated trust policy on ${GHA_ROLE_NAME}"
fi
aws iam put-role-policy \
  --role-name "${GHA_ROLE_NAME}" \
  --policy-name ConferedECRPush \
  --policy-document "file://${GHA_POLICY}"

TRUST_EC2="$(mktemp)"
cat > "${TRUST_EC2}" <<'EOF'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": { "Service": "ec2.amazonaws.com" },
      "Action": "sts:AssumeRole"
    }
  ]
}
EOF

PULL_POLICY="$(mktemp)"
cat > "${PULL_POLICY}" <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AuthToken",
      "Effect": "Allow",
      "Action": "ecr:GetAuthorizationToken",
      "Resource": "*"
    },
    {
      "Sid": "Pull",
      "Effect": "Allow",
      "Action": [
        "ecr:BatchCheckLayerAvailability",
        "ecr:GetDownloadUrlForLayer",
        "ecr:BatchGetImage",
        "ecr:DescribeRepositories"
      ],
      "Resource": "arn:aws:ecr:${AWS_REGION}:${ACCOUNT_ID}:repository/${ECR_NAME}"
    }
  ]
}
EOF

if ! aws iam get-role --role-name "${EC2_ROLE_NAME}" >/dev/null 2>&1; then
  aws iam create-role \
    --role-name "${EC2_ROLE_NAME}" \
    --assume-role-policy-document "file://${TRUST_EC2}" \
    >/dev/null
  echo "Created IAM role ${EC2_ROLE_NAME}"
fi
aws iam put-role-policy \
  --role-name "${EC2_ROLE_NAME}" \
  --policy-name ConferedECRPull \
  --policy-document "file://${PULL_POLICY}"

if ! aws iam get-instance-profile --instance-profile-name "${INSTANCE_PROFILE_NAME}" >/dev/null 2>&1; then
  aws iam create-instance-profile --instance-profile-name "${INSTANCE_PROFILE_NAME}" >/dev/null
fi
if ! aws iam get-instance-profile --instance-profile-name "${INSTANCE_PROFILE_NAME}" \
  --query "InstanceProfile.Roles[?RoleName=='${EC2_ROLE_NAME}']" --output text | grep -q "${EC2_ROLE_NAME}"; then
  aws iam add-role-to-instance-profile \
    --instance-profile-name "${INSTANCE_PROFILE_NAME}" \
    --role-name "${EC2_ROLE_NAME}" || true
fi

if [[ -n "${INSTANCE_ID:-}" ]]; then
  if aws ec2 describe-iam-instance-profile-associations \
    --filters "Name=instance-id,Values=${INSTANCE_ID}" \
    --query "IamInstanceProfileAssociations[0].AssociationId" \
    --output text --region "${AWS_REGION}" 2>/dev/null | grep -q '^iip-assoc-'; then
    echo "Instance ${INSTANCE_ID} already has an instance profile"
  else
    aws ec2 associate-iam-instance-profile \
      --instance-id "${INSTANCE_ID}" \
      --iam-instance-profile "Name=${INSTANCE_PROFILE_NAME}" \
      --region "${AWS_REGION}" \
      >/dev/null
    echo "Attached ${INSTANCE_PROFILE_NAME} to ${INSTANCE_ID}"
  fi
fi

rm -f "${TRUST_GHA}" "${GHA_POLICY}" "${TRUST_EC2}" "${PULL_POLICY}"

ROLE_ARN="arn:aws:iam::${ACCOUNT_ID}:role/${GHA_ROLE_NAME}"
cat <<EOF

AWS bootstrap finished.

Add this GitHub Actions secret (Settings → Secrets and variables → Actions → Secrets):
  AWS_ROLE_TO_ASSUME   ${ROLE_ARN}

Add this GitHub Actions variable (Settings → Secrets and variables → Actions → Variables):
  ECR_REPOSITORY       ${ECR_URI}

Optional repository variable:
  AWS_REGION           ${AWS_REGION}
  EC2_INSTANCE_ID      i-0ab3c97cd6c5a1266

On the EC2 box, once:
  bash scripts/aws/bootstrap-ec2-docker.sh

Then re-run "Deploy production" (or merge to main). Images are tagged with the
git SHA always; VERSION and latest are extra labels. A new commit always builds.
EOF
