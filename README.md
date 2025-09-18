# NFT Rental Marketplace (ERC-4907 + Marketplace)

Contracts for an NFT rental marketplace using ERC-4907 (temporary user + expiry) and a secure marketplace supporting native coin and ERC-20 (USDC). Target network: Base Sepolia.

## Stack
- Hardhat + Toolbox
- OpenZeppelin v5
- Solidity 0.8.24

## Setup
1) Install deps
```
pnpm i   # or npm i
```

2) Create `.env`
```
BASE_SEPOLIA_RPC_URL=YOUR_RPC
PRIVATE_KEY=0x...
ETHERSCAN_API_KEY=YOUR_BASESCAN_OR_ETHERSCAN_KEY
PLATFORM_FEE_BPS=500
FEE_RECEIVER=0xYourFeeRecipient
```

3) Compile
```
npx hardhat compile
```

## Test
```
npx hardhat test
```
The tests cover:
- Native rent flow: list -> rent -> ERC-4907 user set
- USDC rent flow with refundable deposit after expiry

## Deploy (Base Sepolia)
Ensure `.env` has `BASE_SEPOLIA_RPC_URL` and `PRIVATE_KEY`.
```
npm run deploy:baseSepolia
```
This deploys:
- `RentalNFT` (name: RentNFT, symbol: rNFT)
- `RentalMarketplace` (fee bps and recipient from env)

## USDC (Base Sepolia)
- Circle testnet USDC: `0x036CbD53842c5426634e7929541eC2318f3dCF7e`
- You can list with USDC by setting `paymentToken` to the address above.

## Key Contracts
- `contracts/IERC4907.sol`: interface
- `contracts/ERC4907.sol`: ERC-4907 extension over OZ ERC721
- `contracts/RentalNFT.sol`: simple mintable ERC-4907 collection
- `contracts/RentalMarketplace.sol`: listings, renting, payments, deposits

### Marketplace Highlights
- Functions:
  - `listForRent(address nft, uint256 tokenId, uint256 pricePerHour, address paymentToken, bool requireDeposit, uint16 depositBps, uint16 depositCapBps)`
  - `rentWithNative(address nft, uint256 tokenId, uint64 hoursToRent)`
  - `rentWithToken(address nft, uint256 tokenId, uint64 hoursToRent, uint256 amount, address erc20)`
  - `refundDeposit(address nft, uint256 tokenId)` / `claimDeposit(address nft, uint256 tokenId)` after expiry
  - Admin: `setFeeParams`, `setHourLimits`, `pause/unpause`
- Events: `Listed`, `Rented`, `DepositRefunded`, `DepositClaimed`, `Delisted`
- Security: `ReentrancyGuard`, `Pausable`, ownership checks, approval checks

## Frontend
- Next.js + Wagmi + RainbowKit
- Expose ABI + addresses and call: `listForRent`, `rentWithNative`, `rentWithToken`

## Notes
- Default deposit is 50% of total rent, capped at 200%
- Min duration 1 hour, max 720 hours (30 days), both adjustable by owner
