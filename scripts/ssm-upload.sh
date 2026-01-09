#!/bin/bash
# ===========================================
# AWS SSM Parameter Store - Upload Secrets
# ===========================================
# Uploads environment variables from .env file to AWS Parameter Store
#
# Usage:
#   ./scripts/ssm-upload.sh --env .env --prefix /atlasp2p/prod
#   ./scripts/ssm-upload.sh --env .env --prefix /atlasp2p/staging --region us-west-2
#
# Requirements:
#   - AWS CLI installed and configured
#   - IAM permissions for ssm:PutParameter
#   - KMS key for SecureString parameters (optional)

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Defaults
ENV_FILE=".env"
PREFIX="/atlasp2p/prod"
REGION="${AWS_REGION:-us-east-1}"
KMS_KEY="${KMS_KEY_ID:-alias/aws/ssm}"  # Default AWS managed key
DRY_RUN=false

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --env)
      ENV_FILE="$2"
      shift 2
      ;;
    --prefix)
      PREFIX="$2"
      shift 2
      ;;
    --region)
      REGION="$2"
      shift 2
      ;;
    --kms-key)
      KMS_KEY="$2"
      shift 2
      ;;
    --dry-run)
      DRY_RUN=true
      shift
      ;;
    *)
      echo "Unknown option: $1"
      exit 1
      ;;
  esac
done

# Validate
if [ ! -f "$ENV_FILE" ]; then
  echo -e "${RED}Error: $ENV_FILE not found${NC}"
  exit 1
fi

# Check AWS CLI
if ! command -v aws &> /dev/null; then
  echo -e "${RED}Error: AWS CLI not installed${NC}"
  echo "Install: https://aws.amazon.com/cli/"
  exit 1
fi

# Check AWS credentials
if ! aws sts get-caller-identity --region "$REGION" &> /dev/null; then
  echo -e "${RED}Error: AWS credentials not configured${NC}"
  echo "Run: aws configure"
  exit 1
fi

echo -e "${GREEN}=== AWS SSM Parameter Upload ===${NC}"
echo "Source file: $ENV_FILE"
echo "Prefix: $PREFIX"
echo "Region: $REGION"
echo "KMS Key: $KMS_KEY"
echo ""

# Determine which parameters should be SecureString
SECURE_PARAMS=(
  "PASSWORD"
  "SECRET"
  "KEY"
  "TOKEN"
  "PASS"
  "ANON_KEY"
  "SERVICE_ROLE_KEY"
  "JWT_SECRET"
  "SMTP_PASS"
  "RPC_PASSWORD"
)

# Function to check if parameter should be secure
is_secure() {
  local key="$1"
  for pattern in "${SECURE_PARAMS[@]}"; do
    if [[ "$key" == *"$pattern"* ]]; then
      return 0
    fi
  done
  return 1
}

# Upload parameters
COUNT=0
FAILED=0

while IFS='=' read -r key value || [ -n "$key" ]; do
  # Skip empty lines and comments
  [[ -z "$key" || "$key" =~ ^[[:space:]]*# ]] && continue

  # Trim whitespace
  key=$(echo "$key" | xargs)
  value=$(echo "$value" | xargs)

  # Skip if no value
  [ -z "$value" ] && continue

  # Determine parameter type
  if is_secure "$key"; then
    TYPE="SecureString"
    KMS_ARG="--key-id $KMS_KEY"
  else
    TYPE="String"
    KMS_ARG=""
  fi

  PARAM_NAME="$PREFIX/$key"

  if [ "$DRY_RUN" = true ]; then
    echo -e "${YELLOW}[DRY RUN]${NC} Would upload: $PARAM_NAME ($TYPE)"
  else
    echo -n "Uploading: $PARAM_NAME ($TYPE)... "

    if aws ssm put-parameter \
      --name "$PARAM_NAME" \
      --value "$value" \
      --type "$TYPE" \
      $KMS_ARG \
      --region "$REGION" \
      --overwrite \
      --no-cli-pager \
      &> /dev/null; then
      echo -e "${GREEN}✓${NC}"
      ((COUNT++))
    else
      echo -e "${RED}✗${NC}"
      ((FAILED++))
    fi
  fi

done < "$ENV_FILE"

echo ""
if [ "$DRY_RUN" = true ]; then
  echo -e "${YELLOW}Dry run completed. Would upload $COUNT parameters.${NC}"
  echo "Run without --dry-run to actually upload."
else
  echo -e "${GREEN}✓ Uploaded $COUNT parameters${NC}"
  [ $FAILED -gt 0 ] && echo -e "${RED}✗ Failed: $FAILED parameters${NC}"
fi

echo ""
echo "To fetch parameters:"
echo "  ./scripts/ssm-fetch.sh --prefix $PREFIX --region $REGION"
