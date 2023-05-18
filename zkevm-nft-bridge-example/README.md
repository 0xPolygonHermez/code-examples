# zkEVM NFT bridge example
This folder provides an example on how to **bridge NFTs** using the message layer that `polygonZKEVMBridge` implements

## Requirements
- node version: >= 14.x
- npm version: >= 7.x

## Deployment NFT Bridge
### Note
There are two bridges already deployed on `goerli <--> polygonZkEVMTestnet` networks:
- `0xd3b1d467694d4964E3d777e5f2baCcf9Aee930b0`
- `0x6D792cb4d69cC3E1e9A2282106Cc0491E796655e`

Deploying a new nft-bridge is not necessary in order to bridge a NFT. Therefore, you can skip this section and go directly to `Using the NFT bridge` section in this document.

### Deployment
In project root execute:
```
npm i
cp .env.example .env
```

Fill `.env` with your `MNEMONIC` or `PVTKEY` and `INFURA_PROJECT_ID`
If you want to verify the contracts also fill in the `ETHERSCAN_API_KEY` and `ETHERSCAN_ZKEVM_API_KEY`

> Deterministic deployment is used to have the same address in both networks
> This would be performed using a `create2` schema using this typical create2 factory https://etherscan.io/address/0x4e59b44847b379578588920ca78fbf26c0b4956c
More info in the repo: https://github.com/Arachnid/deterministic-deployment-proxy/tree/master

> Script will detect automatically the `bridgeAddress` to be used depending on the network

To deploy use:`npm run deploy:nftBridge:${network}`


As example for `goerli`/`polygonZKEVMTestnet` testnets:
This script will deploy on both networks the same contract using the deterministic deployment:
```
npm run deploy:nftBridge:goerli
```

Once the deployment is finished, we will find the results on `NFTBridge_output_output.json`

To verify contracts use `npm run verify:nftBridge:${network}`
```
npm run verify:nftBridge:goerli
npm run verify:nftBridge:polygonZKEVMTestnet
```

## Using the NFT bridge
In order to use the bridge, some scripts are provided:

- Deploy an NFT using:
```
npm run deploy:mockNFT:goerli
```

- Optionally verify it on etherscan:
```
npm run verify:mockNFT:goerli
```

- To use the bridge you can use one of the already deployed ones or deploy one yourself following the `Deployment NFT Bridge:Deployment` section
The address of `deployment/NFTBridge_output.json` is used for this examples

```
npm run bridge:mockNFT:goerli
```

- Now we have to wait until the message is forwarded to L2, there is a final script that will check it if the claim is ready. If it is ready, it will actually claim the NFT in the other layer:
> The same way as the previous step, if you deploy your own nftBridge you will have the update the `deployedNftBridgeAddress`

```
npm run claim:mockNFT:polygonZKEVMTestnet
```

## Example nft bridge transaction
https://testnet-zkevm.polygonscan.com/tx/0x4aed03de03897bf0f54337825fa4c876eb12549039dc374bafb13ef47ca2fad1