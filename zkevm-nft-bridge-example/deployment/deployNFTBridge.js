/* eslint-disable no-await-in-loop, no-use-before-define, no-lonely-if, import/no-dynamic-require, global-require */
/* eslint-disable no-console, no-inner-declarations, no-undef, import/no-unresolved, no-restricted-syntax */
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { ethers } = require('hardhat');

const mainnetBridgeAddress = '0x2a3DD3EB832aF982ec71669E178424b10Dca2EDe';
const testnetBridgeAddress = '0xF6BEEeBB578e214CA9E23B0e9683454Ff88Ed2A7';

const create2Contract = '0x4e59b44847b379578588920ca78fbf26c0b4956c';
const saltCreate2 = '0x0000000000000000000000000000000000000000000000000000000000000000';

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
    let deployer; let deployerZkEVM;
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

    const nftBridgeFactory = await ethers.getContractFactory('ZkEVMNFTBridge', deployer);
    const deployBridgeTxData = (nftBridgeFactory.getDeployTransaction(
        zkEVMBridgeContractAddress,
    )).data;

    // Encode deploy transaction
    const hashInitCode = ethers.utils.solidityKeccak256(['bytes'], [deployBridgeTxData]);
    // Precalculate create2 address
    const precalculatedAddressDeployed = ethers.utils.getCreate2Address(create2Contract, saltCreate2, hashInitCode);

    const txParams = {
        to: create2Contract,
        data: ethers.utils.hexConcat([saltCreate2, deployBridgeTxData]),
    };

    // Deploy L1
    if (await deployer.provider.getCode(precalculatedAddressDeployed) === '0x') {
        await (await deployer.sendTransaction(txParams)).wait();
    } else {
        console.log('Contract already deployed on L1');
    }

    // Deploy zkEVM
    if (await deployerZkEVM.provider.getCode(precalculatedAddressDeployed) === '0x') {
        await (await deployerZkEVM.sendTransaction(txParams)).wait();
    } else {
        console.log('Contract already deployed on L2');
    }

    // Check succesfull deployment
    if (await deployer.provider.getCode(precalculatedAddressDeployed) === '0x'
        || await deployerZkEVM.provider.getCode(precalculatedAddressDeployed) === '0x'
    ) {
        throw new Error('Deployment failed');
    }
    console.log('NFT bridge contract succesfully deployed on: ', precalculatedAddressDeployed);

    const outputJson = {
        nftBridgeContract: precalculatedAddressDeployed,
    };
    const pathOutputJson = path.join(__dirname, './NFTBridge_output.json');

    fs.writeFileSync(pathOutputJson, JSON.stringify(outputJson, null, 1));
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
