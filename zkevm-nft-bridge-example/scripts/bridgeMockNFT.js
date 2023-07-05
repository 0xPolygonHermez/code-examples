/* eslint-disable no-await-in-loop, no-use-before-define, no-lonely-if, import/no-dynamic-require, global-require */
/* eslint-disable no-console, no-inner-declarations, no-undef, import/no-unresolved, no-restricted-syntax */
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { ethers } = require('hardhat');

const networkIDMainnet = 0;
const networkIDRollup = 1;

const pathdeployedNFT = path.join(__dirname, './deployMockNFT_output.json');
const deployedNFT = require(pathdeployedNFT).nftMockcontract;

const pathPingPongOutput = path.join(__dirname, '../deployment/NFTBridge_output.json');
const deployedNftBridgeAddress = require(pathPingPongOutput).nftBridgeContract;

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

    const nftBridgeFactory = await ethers.getContractFactory('ZkEVMNFTBridge', deployer);
    const nftBridgeContract = await nftBridgeFactory.attach(
        deployedNftBridgeAddress,
    );

    const tokenId = 1;
    const destinationNetwork = networkIDRollup;
    const destinationAddress = deployer.address;

    // Approve tokens
    const nftFactory = await ethers.getContractFactory('ERC721Mock', deployer);
    const nftContract = nftFactory.attach(deployedNFT);
    await (await nftContract.approve(nftBridgeContract.address, tokenId)).wait();
    console.log('approved token id');

    const tx = await nftBridgeContract.bridgeNFT(
        destinationNetwork,
        destinationAddress,
        deployedNFT,
        tokenId,
        true,
    );

    console.log((await tx.wait()).transactionHash);

    console.log('Bridge done succesfully');
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
