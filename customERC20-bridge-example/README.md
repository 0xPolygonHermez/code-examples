# zkEVM ERC20 bridge example

This folder provides an example on how to **bridge ERC20** using the message layer that `polygonZKEVMBridge` implements

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

Fill `.env` with your `MNEMONIC` or `PVTKEY` and `INFURA_PROJECT_ID`
If you want to verify the contracts also fill in the `ETHERSCAN_API_KEY` and `ETHERSCAN_ZKEVM_API_KEY`

To deploy use:`deploy:erc20Bridge:${network}`

As example for `goerli`/`polygonZKEVMTestnet` testnets:
This script will deploy on both networks the same contract using the deterministic deployment:

```
npm run deploy:erc20Bridge:goerli
```

Once the deployment is finished, we will find the results on `ERC20Bridge_output.json`

To verify contracts use `npm run verify:erc20Bridge:${network}`

```
npm run verify:erc20Bridge:goerli
npm run verify:erc20Bridge:polygonZKEVMTestnet
```

## Using the erc20 bridge

In order to use the bridge, some scripts are provided:

```
npm run bridge:MockERC20:goerli
```

- Now we have to wait until the message is forwarded to L2, there is a final script that will check it if the claim is ready. If it is ready, it will actually claim the erc20 in the other layer:

```
npm run claim:MockERC20:polygonZKEVMTestnet
```

## Example erc20 bridge transaction

bridge: https://goerli.etherscan.io/tx/0x392827147f8883498cb8fbdaac96b2f453d1cc0ee9078c482d5606fa0058a32f
claim: https://testnet-zkevm.polygonscan.com/tx/0xbeca97d41c250fece46673c297dbc448b64c4a1825d53f360ccfe0d09733e978
