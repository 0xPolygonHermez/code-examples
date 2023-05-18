/* eslint-disable no-await-in-loop, no-use-before-define, no-lonely-if, import/no-dynamic-require, global-require */
/* eslint-disable no-console, no-inner-declarations, no-undef, import/no-unresolved, no-restricted-syntax */
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { ethers } = require('hardhat');

const mainnetBridgeAddress = '0x2a3DD3EB832aF982ec71669E178424b10Dca2EDe';
const testnetBridgeAddress = '0xF6BEEeBB578e214CA9E23B0e9683454Ff88Ed2A7';

async function main() {
    let zkEVMProvider;
    let zkEVMBridgeContractAddress;

    const networkName = process.env.HARDHAT_NETWORK;

    // Use mainnet bridge address
    if (networkName === 'mainnet') {
        zkEVMBridgeContractAddress = mainnetBridgeAddress;
        zkEVMProvider = new ethers.providers.JsonRpcProvider('https://zkevm-rpc.com');
    } else if (networkName === 'goerli') {
        // Use testnet bridge address
        zkEVMBridgeContractAddress = testnetBridgeAddress;
        zkEVMProvider = new ethers.providers.JsonRpcProvider('https://rpc.public.zkevm-test.net');
    } else {
        throw new Error('Network not supported');
    }

    // Load deployer
    let deployer;
    if (process.env.PVTKEY) {
        deployer = new ethers.Wallet(process.env.PVTKEY, ethers.provider);
        deployerZkEVM = new ethers.Wallet(process.env.PVTKEY, zkEVMProvider);
        console.log('Using pvtKey deployer with address: ', deployer.address);
    } else if (process.env.MNEMONIC) {
        deployer = ethers.Wallet.fromMnemonic(process.env.MNEMONIC, 'm/44\'/60\'/0\'/0/0').connect(ethers.provider);
        deployerZkEVM = ethers.Wallet.fromMnemonic(process.env.MNEMONIC, 'm/44\'/60\'/0\'/0/0').connect(zkEVMProvider);
        console.log('Using MNEMONIC deployer with address: ', deployer.address);
    } else {
        [deployer] = (await ethers.getSigners());
    }

    // Deploy Ping sender on goerli / zkevm mainnet
    const pingSenderFactory = await ethers.getContractFactory('PingSender', deployer);
    const pingSenderContract = await pingSenderFactory.deploy(
        zkEVMBridgeContractAddress,
    );
    await pingSenderContract.deployed();

    console.log('Ping sender deployed on: ', pingSenderContract.address);

    // Deploy Ping receiver on zkevm testnet /zkevm mainnet
    const pingREceiverFactory = await ethers.getContractFactory('PingReceiver', deployerZkEVM);
    const pingReceiverContract = await pingREceiverFactory.deploy(
        zkEVMBridgeContractAddress,
    );
    await pingReceiverContract.deployed();

    // Set address on both networks
    await pingSenderContract.setReceiver(pingReceiverContract.address);
    await pingReceiverContract.setSender(pingSenderContract.address);

    // Write output
    const outputJson = {
        pingSenderContract: pingSenderContract.address,
        pingReceiverContract: pingReceiverContract.address,
    };
    const pathOutputJson = path.join(__dirname, './pingPong_output.json');
    fs.writeFileSync(pathOutputJson, JSON.stringify(outputJson, null, 1));
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
