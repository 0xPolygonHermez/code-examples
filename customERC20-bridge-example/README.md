# zkEVM ERC20 bridge example

This folder provides an example on how to **bridge ERC20** using the message layer the Native `polygonZKEVMBridge`

## Requirements

- node version: >= 14.x
- npm version: >= 7.x

## Deployment NFT ERC20

### Deployment

In project root execute:

```
npm i
cp .env.example .env
```

Fill `.env` with your `MNEMONIC` or `PVTKEY`

To deploy use:`deploy:erc20Bridge}`

As example for `sepolia`/`zKatana` testnets:
This script will deploy on both networks the same contract using the deterministic deployment:

```
deploy:erc20Bridge
```

Once the deployment is finished, we will find the results on `ERC20Bridge_output.json`

## Using the erc20 bridge

In order to use the bridge, some scripts are provided:

```
npm run bridge:MockERC20
```

- Now we have to wait until the message is forwarded to L2, there is a final script that will check it if the claim is ready. If it is ready, it will actually claim the erc20 in the other layer:

```
npm run claim:MockERC20
```

## Example erc20 bridge transaction

bridge: https://sepolia.etherscan.io/tx/0xc14e8cbb12b231126b4b18e8dbc48c87c52060647c4073dbb08b87539068f295
claim: https://zkatana.blockscout.com/tx/0x7cb793a476a93ed228720c7c007247cb9d0003ce99031b2067b753353a644751
