# Simple ping pong bridge example

This repo provides a simple example on how bridge messages between networks

## Requirements

- node version: >= 14.x
- npm version: >= 7.x

## Deployment

In project root execute:

```
npm i
cp .env.example .env
```

Fill `.env` with your `MNEMONIC` or `PVTKEY` and `INFURA_PROJECT_ID`
If you want to verify the contracts also fill the `ETHERSCAN_API_KEY` and `ETHERSCAN_ZKEVM_API_KEY`

To deploy use:`deploy:pingPong:${network}`, currently is supported `goerli` and `mainnet`.
This script will deploy a contract on 2 networks, a message sender and a message receiver:

- `PingSender` on `mainnet`/`goerli`
- `PingReceiver` on `polygonZKEVMTestnet`/`polygonZKEVMMainnet`

As example for goerli testnet:

```
npm run deploy:pingPong:goerli
```

In the deployment we will find the results on `pingPong_output.json`

To verify contracts use `npm run verify:sender:${network}` and `npm run verify:receiver:${network}`

```
npm run verify:sender:goerli
npm run verify:receiver:polygonZKEVMTestnet

```

## Using the bridge

In order to use the bridge, there are already provided some scripts:

- Send a message using:

```
npm run bridge:bridgePing:goerli
```

- Now we have to wait until the message is forwarded to L2, there's the final script that will check it and if it's ready will actually claim the NFT in the other layer:

```
npm run claim:claimPong:polygonZKEVMTestnet

```

- You can check that the value `pingValue` on the `PingReceiver` had change
