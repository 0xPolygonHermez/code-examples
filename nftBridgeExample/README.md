# NFT bridge example

This repo provides an example on how bridge NFTs using the message layer that `polygonZKEVMBridge` provides

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

We need some technic to have the same address in both networks.
Usually, this would be performed using a create2 squema, but for simplification, will deploy the contract
with the same address/nonce in both networks

Script will detect if the network use the `bridgeAddress` deployed accordingly

To deploy use:`deploy:nftBridge:${network}`

As example for goerli testnet:

```
npm run deploy:nftBridge:goerli
npm run deploy:nftBridge:polygonZKEVMTestnet
```

In the deployment we will find the results on `${networkName}_output.json`
Double check that both address must be the same!!!

To verify contracts use `npm run verify:nftBridge:${network}`

```
npm run verify:nftBridge:goerli
npm run verify:nftBridge:polygonZKEVMTestnet

```

## Using the bridge

In order to use the bridge, there are already provided some scripts:

- Deploy an NFT using:

```
npm run deploy:mockNFT:goerli
```

- Optionally verify it on etherscan:

```
verify:mockNFT:goerli
```

- To use the bridge you can use the already deployed one or deploy one yourself follwoing the `Deployment` section
  If you want to use your own bridge:
  Go to: `scripts/bridgeMockNFT.js` and update the `deployedNftBridgeAddress` with the previously deployed bridgeNFT

```
npm run bridge:mockNFT:goerli

```

- Now we have to wait until the message is forwarded to L2, there's the final script that will check it and if it's ready will actually claim the NFT in the other layer:
  The same way as the last script, if you deploy your own nftBridge you will have the update the `deployedNftBridgeAddress`

```
npm run claim:mockNFT:polygonZKEVMTestnet

```
