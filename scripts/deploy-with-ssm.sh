#!/bin/bash
# ===========================================
# Deploy with AWS SSM Parameter Store
# ===========================================
# Fetches secrets from AWS Parameter Store and deploys application
#
# Usage:
#   ./scripts/deploy-with-ssm.sh
#   ./scripts/deploy-with-ssm.sh --prefix /atlasp2p/staging --target cloud
#   AWS_REGION=us-west-2 ./scripts/deploy-with-ssm.sh

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Defaults
PREFIX="${SSM_PREFIX:-/atlasp2p/prod}"
REGION="${AWS_REGION:-us-east-1}"
TARGET="${DEPLOY_TARGET:-docker}"  # docker or cloud

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
    --target)
      TARGET="$2"
      shift 2
      ;;
    *)
      echo "Unknown option: $1"
      exit 1
      ;;
  esac
done

echo -e "${CYAN}╔═══════════════════════════════════════╗${NC}"
echo -e "${CYAN}║   AtlasP2P - Deploy with AWS SSM     ║${NC}"
echo -e "${CYAN}╚═══════════════════════════════════════╝${NC}"
echo ""
echo "Environment: $PREFIX"
echo "Region: $REGION"
echo "Target: prod-$TARGET"
echo ""

# Check if we're in the right directory
if [ ! -f "Makefile" ]; then
  echo -e "${RED}Error: Must run from AtlasP2P root directory${NC}"
  exit 1
fi

# Fetch parameters
echo -e "${YELLOW}→ Fetching secrets from AWS SSM...${NC}"
./scripts/ssm-fetch.sh --prefix "$PREFIX" --region "$REGION"

echo ""
echo -e "${YELLOW}→ Building and deploying containers...${NC}"

# Deploy based on target
case $TARGET in
  docker)
    make prod-docker
    ;;
  cloud)
    make prod-cloud
    ;;
  *)
    echo -e "${RED}Error: Invalid target '$TARGET'. Use 'docker' or 'cloud'${NC}"
    exit 1
    ;;
esac

echo ""
echo -e "${GREEN}╔═══════════════════════════════════════╗${NC}"
echo -e "${GREEN}║      DEPLOYMENT SUCCESSFUL            ║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════╝${NC}"
echo ""

# Extract domain from .env for display
if [ -f ".env" ]; then
  DOMAIN=$(grep "^DOMAIN=" .env | cut -d= -f2 || echo "localhost")
  echo -e "${CYAN}Website: https://$DOMAIN${NC}"
fi
