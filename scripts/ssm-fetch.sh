#!/bin/bash
# ===========================================
# AWS SSM Parameter Store - Fetch Secrets
# ===========================================
# Fetches environment variables from AWS Parameter Store and creates .env file
#
# Usage:
#   ./scripts/ssm-fetch.sh --prefix /atlasp2p/prod
#   ./scripts/ssm-fetch.sh --prefix /atlasp2p/staging --region us-west-2 --output .env.staging

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Defaults
PREFIX="/atlasp2p/prod"
REGION="${AWS_REGION:-us-east-1}"
OUTPUT_FILE=".env"

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --prefix)
      PREFIX="$2"
      shift 2
      ;;
    --region)
      REGION="$2"
      shift 2
      ;;
    --output)
      OUTPUT_FILE="$2"
      shift 2
      ;;
    *)
      echo "Unknown option: $1"
      exit 1
      ;;
  esac
done

# Check AWS CLI
if ! command -v aws &> /dev/null; then
  echo -e "${RED}Error: AWS CLI not installed${NC}"
  exit 1
fi

# Check AWS credentials
if ! aws sts get-caller-identity --region "$REGION" &> /dev/null; then
  echo -e "${RED}Error: AWS credentials not configured${NC}"
  exit 1
fi

echo -e "${GREEN}=== AWS SSM Parameter Fetch ===${NC}"
echo "Prefix: $PREFIX"
echo "Region: $REGION"
echo "Output: $OUTPUT_FILE"
echo ""

# Backup existing .env if it exists
if [ -f "$OUTPUT_FILE" ]; then
  BACKUP="$OUTPUT_FILE.backup.$(date +%Y%m%d_%H%M%S)"
  echo -e "${YELLOW}Backing up existing $OUTPUT_FILE to $BACKUP${NC}"
  cp "$OUTPUT_FILE" "$BACKUP"
fi

# Fetch parameters
echo -n "Fetching parameters from AWS SSM... "

PARAMS=$(aws ssm get-parameters-by-path \
  --path "$PREFIX" \
  --with-decryption \
  --region "$REGION" \
  --query 'Parameters[*].[Name,Value]' \
  --output text 2>/dev/null)

if [ $? -ne 0 ]; then
  echo -e "${RED}✗${NC}"
  echo "Failed to fetch parameters. Check your AWS permissions."
  exit 1
fi

echo -e "${GREEN}✓${NC}"

# Create .env file
> "$OUTPUT_FILE"

COUNT=0
while IFS=$'\t' read -r name value; do
  # Strip prefix from parameter name to get the key
  key="${name#$PREFIX/}"
  echo "$key=$value" >> "$OUTPUT_FILE"
  ((COUNT++))
done <<< "$PARAMS"

echo ""
echo -e "${GREEN}✓ Fetched $COUNT parameters${NC}"
echo "Environment file created: $OUTPUT_FILE"
echo ""
echo "Next steps:"
echo "  1. Review $OUTPUT_FILE"
echo "  2. Deploy: make prod-docker"
