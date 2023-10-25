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

Fill `.env` with your `MNEMONIC` OR `PVTKEY`.

To deploy use:`deploy:pingPong`, currently is supported `sepolia` and `zKatana`.
This script will deploy a contract on 2 networks, a message sender and a message receiver:

- `PingSender` on `sepolia`
- `PingReceiver` on `zKatana`

As example for sepolia testnet:

```
npm run deploy:pingPong
```

In the deployment we will find the results on `pingPong_output.json`


## Using the bridge

In order to use the bridge, there are already provided some scripts:

- Send a message using:

```
npm run bridge:bridgePing
```

- Now we have to wait until the message is forwarded to L2, there's the final script that will check it and if it's ready will actually claim the NFT in the other layer:

```
npm run claim:claimPong

```

- You can check that the value `pingValue` on the `PingReceiver` had change
