# Deployment Scripts

AWS Parameter Store integration for secure secrets management.

## Quick Start

### 1. Upload Secrets (One-Time)
```bash
./scripts/ssm-upload.sh --env .env --prefix /atlasp2p/prod
```

### 2. Deploy with SSM
```bash
./scripts/deploy-with-ssm.sh
```

See each script's header for detailed usage.
