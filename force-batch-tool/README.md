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