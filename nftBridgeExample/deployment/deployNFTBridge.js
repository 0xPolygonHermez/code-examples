/* eslint-disable no-await-in-loop, no-use-before-define, no-lonely-if, import/no-dynamic-require, global-require */
/* eslint-disable no-console, no-inner-declarations, no-undef, import/no-unresolved, no-restricted-syntax */
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { ethers } = require('hardhat');

const mainnetBridgeAddress = "0x2a3DD3EB832aF982ec71669E178424b10Dca2EDe";
const testnetBridgeAddress = "0xF6BEEeBB578e214CA9E23B0e9683454Ff88Ed2A7";

async function main() {
    // Load deployer
    let deployer;
    if (process.env.PVTKEY) {
        deployer = new ethers.Wallet(process.env.PVTKEY, ethers.provider);
        console.log('Using pvtKey deployer with address: ', deployer.address);
    } else if (process.env.MNEMONIC) {
        deployer = ethers.Wallet.fromMnemonic(process.env.MNEMONIC, 'm/44\'/60\'/0\'/0/0').connect(ethers.provider);
        console.log('Using MNEMONIC deployer with address: ', deployer.address);
    } else {
        [deployer] = (await ethers.getSigners());
    }

    let zkEVMBridgeContractAddress;
    const networkName = process.env.HARDHAT_NETWORK;

    // Use mainnet bridge address
    if (networkName == "polygonZKEVMMainnet" || networkName == "mainnet") {
        zkEVMBridgeContractAddress = mainnetBridgeAddress;
    } else if (networkName == "polygonZKEVMTestnet" || networkName == "goerli") {
        // Use testnet bridge address
        zkEVMBridgeContractAddress = testnetBridgeAddress;
    }

    const nftBridgeFactory = await ethers.getContractFactory('ZkEVMNFTBridge', deployer);
    const nftBridgeContract = await nftBridgeFactory.deploy(
        zkEVMBridgeContractAddress,
    );
    await nftBridgeContract.deployed();

    console.log("nftBridge contract succesfully deployed on: ", nftBridgeContract.address);

    const outputJson = {
        nftBridgeContract: nftBridgeContract.address,
    };
    const pathOutputJson = path.join(__dirname, `./${networkName}_output.json`);

    fs.writeFileSync(pathOutputJson, JSON.stringify(outputJson, null, 1));
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
