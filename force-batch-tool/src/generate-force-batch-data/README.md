# Generate force batch data
These are just some examples of how to create forced batch data

## Requirements
- node version: >= 14.x
- npm version: >= 7.x

## Tool configuration
All commands are executed in `src/generate-force-batch-data`

### install dependencies
```
npm i
```

### setup .env
```
cp .env.example .env
```
Fill `.env` with your parameteres:
- `PVTKEY_L2_ZKEVM`

### modify script internal parameters
Each script has its own parameters that needs to be filled by the user
All of them has a comment: `FILL IN BY THE USER`

## Script examples
- `eth-transfer.js`: ethereum transfer

## Usage
- Generate Force batch data on zkEVM testnet:
```
node ${name-script}.js --network testnet
```

- Generate Force batch data on zkEVM mainnet:
```
node ${name-script}.js --network mainnet
```