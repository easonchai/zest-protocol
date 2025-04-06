# ZEST Protocol: Bitcoin-Native Stablecoin Ecosystem 🚀

## Overview

ZEST Protocol is a groundbreaking Bitcoin-native stablecoin ecosystem built on the Citrea network. By leveraging Bitcoin's unparalleled security and Citrea's EVM-compatible scalability, ZEST creates a robust financial layer that bridges traditional finance with decentralized innovation.

The protocol uses cBTC as its core collateral to mint ZEST, a USD-pegged stablecoin, ensuring enhanced financial stability and liquidity. Our ecosystem features overcollateralized debt positions (CDPs), a Stability Pool for liquidations, and a staking protocol that issues yield-bearing sZEST tokens.

## Technical Architecture

### Core Components

1. **Smart Contract System**

   - Solidity-based contracts deployed on Citrea L2
   - Modular design for easy upgrades and maintenance
   - Gas-optimized for efficient transaction processing

2. **Collateral Management**

   - cBTC as primary collateral asset
   - Dynamic collateral ratios based on market conditions
   - Automated liquidation mechanisms for risk management

3. **Stability Mechanisms**

   - Overcollateralization requirements (minimum 110%)
   - Stability Pool for absorbing liquidated positions
   - Redemption mechanism for maintaining peg stability

4. **Yield Generation**
   - Borrower interest distribution
   - Liquidation rewards
   - Staking rewards through sZEST tokens

## Repository Structure

```
zest-protocol/
├── backend/           # Core API and smart contract interactions
│   ├── src/           # REST API endpoints
│   ├── prisma/        # DB Models
├── frontend/         # User interface components
│   ├── src/
│   │   ├── components/ # React components
│   │   ├── utils/     # Helper functions and API clients
│   │   └── pages/     # Web pages
└── dapp/              # Smart contracts
    ├── src/           # Core contract implementation
    ├── script/        # Deployment scripts
    └── test/          # Tests
```

## Smart Contract Deployment

### Citrea Testnet Contracts

| Contract       | Address                                                                                                                              | Description                                                         |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------- |
| ZEST Token     | [0xF1Ba8F20dfFf02a14DAfd142BdD06F109363e991](https://explorer.testnet.citrea.xyz/address/0xF1Ba8F20dfFf02a14DAfd142BdD06F109363e991) | ERC20 implementation of ZEST stablecoin with mint/burn capabilities |
| CDP Manager    | [0xFF9Ca882332846e0c3F037cc4B25Ef9f581295b1](https://explorer.testnet.citrea.xyz/address/0xFF9Ca882332846e0c3F037cc4B25Ef9f581295b1) | Manages collateral positions, debt issuance, and liquidations       |
| Stability Pool | [0x1560f6fF20b79F04F99864f91DA9df8842FA6c99](https://explorer.testnet.citrea.xyz/address/0x1560f6fF20b79F04F99864f91DA9df8842FA6c99) | Handles liquidation processing and reward distribution              |
| Swap Module    | [0x79198aD7c074021eAaD7dCcAEF45F230108b91a1](https://explorer.testnet.citrea.xyz/address/0x79198aD7c074021eAaD7dCcAEF45F230108b91a1) | Facilitates 1:1 USDT to ZEST swaps                                  |
| Mock USDT      | [0xAe3DB17Ffeb5B1AA4aA3Ff7bE8304aDb98feEE71](https://explorer.testnet.citrea.xyz/address/0xAe3DB17Ffeb5B1AA4aA3Ff7bE8304aDb98feEE71) | For test swaps                                                      |

### ENS Integration

| Contract    | Address                                                                                                                       | Description                                          |
| ----------- | ----------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| L2Registry  | [0x4f339a1f489d42f4e5da00398e6ecea38c2f687e](https://sepolia.basescan.org/address/0x4f339a1f489d42f4e5da00398e6ecea38c2f687e) | ENS registry implementation for subdomain management |
| L2Registrar | [0x4B0c4367AbE91C577Fe99e3EDafC553132718363](https://sepolia.basescan.org/address/0x4B0c4367AbE91C577Fe99e3EDafC553132718363) | Contract for minting and managing ENS subdomains     |

## Key Features

### 1. Overcollateralized Debt Positions (CDPs)

- Minimum collateral ratio: 110%
- Dynamic interest rates based on market conditions
- Automated liquidation triggers
- Partial liquidation support

### 2. Stability Pool

- Absorbs liquidated positions
- Distributes collateral bonuses to depositors
- Real-time reward calculations
- Emergency shutdown mechanism

### 3. Staking & Yield Generation

- sZEST token issuance
- Yield sources:
  - Borrower interest (70%)
  - Liquidation rewards (20%)
  - Protocol fees (10%)
- Compound interest mechanism

### 4. Seamless Swaps

- Fixed 1:1 USDT to ZEST conversion
- Zero slippage implementation
- Instant settlement
- Gas optimization for cost efficiency

## Development Setup

1. **Prerequisites**

   ```bash
   Node.js >= 18.x
   pnpm >= 8.x
   ```

2. **Installation**

   ```bash
   git clone https://github.com/easonchai/zest-protocol.git
   cd zest-protocol
   pnpm install
   ```

3. **Environment Configuration**

   ```bash
   cp .env.example .env
   # Update environment variables
   ```

4. **Running the Stack**

   ```bash
   # Start backend
   pnpm run dev:backend

   # Start frontend
   pnpm run dev:frontend
   ```

## API Integration

The ZEST Protocol provides a comprehensive API for developers. Currently you can access it by spinning up the backend. But in the future, it would be as easy as doing something like this:

```typescript
import { ZestClient } from "@zest-protocol/sdk";

const client = new ZestClient({
  network: "testnet",
  apiKey: "your-api-key",
});

// Example: Create a CDP
const cdp = await client.cdp.create({
  collateral: "1.5", // cBTC
  debt: "1000", // ZEST
});
```

## Security Considerations

- All contracts are un-audited. This is a hackathon project.
