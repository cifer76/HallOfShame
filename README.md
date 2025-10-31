# Hall of Shame

A decentralized bulletin board built on Sui blockchain and Walrus distributed storage. Anyone can publish revelations by paying WAL/SUI tokens, and others can upvote to enhance credibility.

## Architecture

- **Smart Contract**: Sui Move contract handling payments and revelation metadata
- **Storage**: Walrus for distributed, resilient content storage
- **Frontend**: React + TypeScript with Sui Wallet integration

## Features

- 🔐 Wallet-based authentication (Sui Wallet)
- 📝 Publish revelations with title, text content, and images
- ⬆️ Upvote revelations to boost their credibility
- 💰 Token-based publishing and voting system
- 🌐 Decentralized storage via Walrus
- 📱 Responsive, modern UI

## Project Structure

```
├── move/                    # Sui Move smart contract
│   ├── sources/
│   │   └── hall_of_shame.move
│   ├── tests/
│   │   └── hall_of_shame_tests.move
│   └── Move.toml
│
└── frontend/               # React TypeScript frontend
    ├── src/
    │   ├── components/     # React components
    │   │   ├── WalletConnect.tsx
    │   │   ├── RevelationCard.tsx
    │   │   └── PublishForm.tsx
    │   ├── utils/          # Utility functions
    │   │   ├── walrus.ts   # Walrus integration
    │   │   └── suiClient.ts # Sui client
    │   ├── types/          # TypeScript types
    │   ├── App.tsx
    │   └── main.tsx
    ├── package.json
    └── vite.config.ts
```

## Setup Instructions

### Prerequisites

- Node.js 18+ and npm
- Sui CLI (`cargo install --locked --git https://github.com/MystenLabs/sui.git --branch testnet sui`)
- Sui Wallet browser extension

### 1. Deploy Smart Contract

```bash
cd move

# Build the contract
sui move build

# Test the contract
sui move test

# Deploy to testnet
sui client publish --gas-budget 100000000
```

After deployment, note down:
- Package ID
- HallOfShame shared object ID

### 2. Configure Frontend

```bash
cd frontend

# Install dependencies
npm install

# Create environment file
cp .env.example .env
```

Edit `.env` with your deployed contract addresses:

```env
VITE_SUI_NETWORK=testnet
VITE_SUI_RPC_URL=https://fullnode.testnet.sui.io:443

VITE_WALRUS_PUBLISHER_URL=https://publisher.walrus-testnet.walrus.space
VITE_WALRUS_AGGREGATOR_URL=https://aggregator.walrus-testnet.walrus.space

VITE_PACKAGE_ID=0x... # Your deployed package ID
VITE_HALL_OF_SHAME_ID=0x... # HallOfShame shared object ID
```

### 3. Run the Application

```bash
# Development mode
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

Visit `http://localhost:5173` in your browser.

## Usage

1. **Connect Wallet**: Click the wallet button to connect your Sui Wallet
2. **Publish Revelation**: 
   - Click "Publish Revelation"
   - Enter title, content, and optional images
   - Pay 1 SUI to publish
3. **Upvote**: Click upvote button on any revelation (costs 0.1 SUI)

## Smart Contract Details

### Main Functions

- `publish_revelation()`: Publish a new revelation with Walrus blob ID
  - Requires payment of at least 1 SUI
  - Stores metadata on-chain, content on Walrus

- `upvote_revelation()`: Upvote an existing revelation
  - Requires payment of at least 0.1 SUI
  - Increments upvote count and total value locked

### Data Structures

- `Revelation`: On-chain metadata (blob_id, author, timestamp, upvotes, TVL)
- `HallOfShame`: Shared object maintaining all revelations

## Development

### Testing Smart Contract

```bash
cd move
sui move test
```

### Frontend Development

```bash
cd frontend
npm run dev
```

### Building for Production

```bash
cd frontend
npm run build
```

## Technical Considerations

- **Payments**: Currently uses SUI tokens (can be modified for WAL)
- **Walrus Storage**: Content stored permanently with blob IDs
- **Image Handling**: Images compressed and base64-encoded before upload
- **Network**: Configured for Sui testnet and Walrus testnet

## Troubleshooting

### "Configuration Required" warning
- Ensure you've deployed the contract and updated `.env` with correct IDs

### Walrus upload fails
- Check Walrus testnet status
- Ensure proper network configuration

### Transaction fails
- Verify sufficient SUI balance in wallet
- Check minimum payment amounts

## Future Enhancements

- [ ] WAL token integration (instead of SUI)
- [ ] Sorting/filtering options (by votes, date, author)
- [ ] Comment/reply system
- [ ] Revelation categories/tags
- [ ] Search functionality
- [ ] User profiles and reputation
- [ ] Governance/moderation features

## License

MIT

## Contributing

Contributions welcome! Please open an issue or submit a pull request.


