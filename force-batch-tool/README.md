# Force batch tool
This tool provides simple script to send force batches

## Requirements
- node version: >= 14.x
- npm version: >= 7.x

## Tool configuration
All commands are executed in project root

### install dependencies
```
npm i
```

### setup .env
```
cp .env.example .env
```
Fill `.env` with your parameteres:
- `PVTKEY_L1`
- `PROVIDER_TESTNET`
- `PROVIDER_MAINNET`

### Pre-requisites
- sending forces bacthes requires to pay an amount of MATIC (approval is required as well)
- MATIC amount needed could be check in:
  - testnet: https://goerli.etherscan.io/address/0xa997cfd539e703921fd1e3cf25b4c241a27a4c7a#readProxyContract#F11
  - mainnet: https://etherscan.io/address/0x5132A183E9F3CB7C848b0AAC5Ae0c4f0491B7aB2#readProxyContract#F11
- MATIC in `PVTKEY_L1` would be needed in order to perform the forced batch contract call
  - testnet
    - MATIC can be minted in: https://goerli.etherscan.io/address/0x1319d23c2f7034f52eb07399702b040ba278ca49#writeContract#F6
    - Approve MATIC to `0xa997cfd539e703921fd1e3cf25b4c241a27a4c7a` in: https://goerli.etherscan.io/address/0x1319d23c2f7034f52eb07399702b040ba278ca49#writeContract#F1
  - mainnet
    - buy MATIC in any DEX
    - Approve MATIC to `0x5132A183E9F3CB7C848b0AAC5Ae0c4f0491B7aB2` in: https://etherscan.io/token/0x7d1afa7b718fb893db30a3abc0cfc608aacfebb0#writeContract#F1

### Fill forced data
```
cp forced-batch-data.example.json forced-batch-data.json
```
Fill it with the force batch data that you want to send

> Note that examples to generate forced batch data has been done in `src/generate-force-batch` folder
> Please, read `src/generate-force-batch/README.md` on how to use it

## Usage
- Force batch on zkEVM testnet:
```
node src/send-force-batch.js --network testnet
```

- Force batch on zkEVM mainnet:
```
node src/send-force-batch.js --network mainnet
```