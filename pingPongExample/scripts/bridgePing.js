/* eslint-disable no-await-in-loop, no-use-before-define, no-lonely-if, import/no-dynamic-require, global-require */
/* eslint-disable no-console, no-inner-declarations, no-undef, import/no-unresolved, no-restricted-syntax */
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { ethers } = require('hardhat');

// const networkIDMainnet = 0;
const networkIDzkEVM = 1;

const pathPingPongOutput = path.join(__dirname, '../deployment/pingPong_output.json');
const pingSenderContractAddress = require(pathPingPongOutput).pingSenderContract;

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

    const nftBridgeFactory = await ethers.getContractFactory('PingSender', deployer);
    const nftBridgeContract = await nftBridgeFactory.attach(
        pingSenderContractAddress,
    );

    const forceUpdateGlobalExitRoot = true; // fast bridge
    const pingValue = 69420;
    const tx = await nftBridgeContract.bridgePingMessage(
        networkIDzkEVM, // Send to the zkEVM
        forceUpdateGlobalExitRoot,
        pingValue,
    );

    console.log(await tx.wait());

    console.log('Bridge done succesfully');
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
