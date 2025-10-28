# Deployment Guide

This guide walks you through deploying the Hall of Shame application.

## Step 1: Deploy Smart Contract

### Prerequisites
- Sui CLI installed
- Sui wallet configured with testnet SUI tokens

### Deploy Steps

```bash
# Navigate to move directory
cd move

# Build the contract
sui move build

# Run tests (optional but recommended)
sui move test

# Deploy to testnet
sui client publish --gas-budget 100000000
```

### After Deployment

The output will contain several important IDs. Look for:

1. **Package ID**: Look for the line with `Published Objects` → This is your package ID
2. **HallOfShame Object ID**: Look for the created object with type `hall_of_shame::HallOfShame`

Example output:
```
----- Transaction Effects ----
...
Created Objects:
  ┌──
  │ ObjectID: 0x1234... ← This is your HallOfShame ID
  │ Sender: 0x...
  │ Owner: Shared
  │ ObjectType: 0xabcd::hall_of_shame::HallOfShame ← Package ID is 0xabcd
```

Save these IDs for the next step!

## Step 2: Configure Frontend

### Create Environment File

```bash
cd frontend

# Create .env file
cat > .env << EOF
# Sui Network Configuration
VITE_SUI_NETWORK=testnet
VITE_SUI_RPC_URL=https://fullnode.testnet.sui.io:443

# Walrus Configuration
VITE_WALRUS_PUBLISHER_URL=https://publisher.walrus-testnet.walrus.space
VITE_WALRUS_AGGREGATOR_URL=https://aggregator.walrus-testnet.walrus.space

# Contract Configuration (REPLACE WITH YOUR DEPLOYED IDs)
VITE_PACKAGE_ID=0x... # Your package ID from deployment
VITE_HALL_OF_SHAME_ID=0x... # HallOfShame shared object ID
EOF
```

### Install Dependencies

```bash
npm install
```

## Step 3: Run the Application

### Development Mode

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

### Production Build

```bash
# Build
npm run build

# Preview
npm run preview

# Or deploy the dist/ folder to your hosting service
```

## Step 4: Test the Application

1. Open the application in your browser
2. Install Sui Wallet extension if not already installed
3. Connect your wallet (make sure you have testnet SUI)
4. Try publishing a revelation
5. Try upvoting a revelation

## Troubleshooting

### "Configuration Required" Warning

This means the package ID or Hall of Shame ID is not set in `.env`. Double-check your environment variables.

### Transaction Fails

- Ensure you have enough SUI in your wallet (at least 2 SUI for testing)
- Check that you're connected to testnet
- Verify the contract addresses in `.env` are correct

### Walrus Upload Fails

- Check Walrus testnet status
- Try with smaller images
- Ensure you have network connectivity

### Cannot Find Module Errors

```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

## Mainnet Deployment (Future)

When ready for mainnet:

1. Deploy contract to mainnet:
   ```bash
   sui client switch --env mainnet
   sui client publish --gas-budget 100000000
   ```

2. Update `.env`:
   ```env
   VITE_SUI_NETWORK=mainnet
   VITE_SUI_RPC_URL=https://fullnode.mainnet.sui.io:443
   VITE_WALRUS_PUBLISHER_URL=https://publisher.walrus.space
   VITE_WALRUS_AGGREGATOR_URL=https://aggregator.walrus.space
   VITE_PACKAGE_ID=0x... # mainnet package ID
   VITE_HALL_OF_SHAME_ID=0x... # mainnet hall ID
   ```

3. Rebuild and deploy frontend

## Hosting Options

### Vercel
```bash
npm run build
# Deploy dist/ folder to Vercel
```

### Netlify
```bash
npm run build
# Deploy dist/ folder to Netlify
```

### IPFS (Decentralized)
```bash
npm run build
ipfs add -r dist/
```

## Support

For issues or questions:
- Check the main [README.md](./README.md)
- Review Sui documentation: https://docs.sui.io
- Review Walrus documentation: https://docs.walrus.site


