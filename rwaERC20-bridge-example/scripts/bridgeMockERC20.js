/* eslint-disable no-await-in-loop, no-use-before-define, no-lonely-if, import/no-dynamic-require, global-require */
/* eslint-disable no-console, no-inner-declarations, no-undef, import/no-unresolved, no-restricted-syntax */
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { ethers } = require('hardhat');

const networkIDMainnet = 0;
const networkIDRollup = 1;

const pathdeployeERC20Bridge = path.join(__dirname, '../deployment/ERC20Bridge_output.json');
const deploymentERC20Bridge = require(pathdeployeERC20Bridge);

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

    const networkName = process.env.HARDHAT_NETWORK;
    let destinationNetwork; let
        ERC20BridgeContractAddress; let erc20TokenAddress;

    if (networkName === 'polygonZKEVMTestnet' || networkName === 'polygonZKEVMMainnet') {
        destinationNetwork = networkIDMainnet;
        erc20TokenAddress = deploymentERC20Bridge.erc20zkEVMToken;
        ERC20BridgeContractAddress = deploymentERC20Bridge.ERC20BridgezkEVM;
    }

    if (networkName === 'mainnet' || networkName === 'goerli') {
        destinationNetwork = networkIDRollup;
        erc20TokenAddress = deploymentERC20Bridge.erc20MainnetToken;
        ERC20BridgeContractAddress = deploymentERC20Bridge.ERC20BridgeMainnet;
    }

    const erc20BridgeFactory = await ethers.getContractFactory('ERC20BridgeNativeChain', deployer);
    const erc20BridgeContract = await erc20BridgeFactory.attach(
        ERC20BridgeContractAddress,
    );

    // Approve tokens
    const tokenFactory = await ethers.getContractFactory('CustomERC20Mainnet', deployer);
    const tokenContract = await tokenFactory.attach(
        erc20TokenAddress,
    );

    const tokenAmount = ethers.utils.parseEther('1');
    const destinationAddress = deployer.address;

    await (await tokenContract.approve(ERC20BridgeContractAddress, tokenAmount)).wait();
    console.log('approved tokens');

    const tx = await erc20BridgeContract.bridgeToken(
        destinationAddress,
        tokenAmount,
        true,
    );

    console.log((await tx.wait()).transactionHash);

    console.log('Bridge done succesfully');
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
