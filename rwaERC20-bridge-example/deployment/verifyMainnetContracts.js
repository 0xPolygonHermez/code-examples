/* eslint-disable global-require */
/* eslint-disable import/no-dynamic-require, no-await-in-loop, no-restricted-syntax, guard-for-in */
require('dotenv').config();
const path = require('path');
const hre = require('hardhat');
const { expect } = require('chai');

const mainnetBridgeAddress = '0x2a3DD3EB832aF982ec71669E178424b10Dca2EDe';
const testnetBridgeAddress = '0xF6BEEeBB578e214CA9E23B0e9683454Ff88Ed2A7';

const networkIDMainnet = 0;
const networkIDzkEVM = 1;

async function main() {
    const networkName = process.env.HARDHAT_NETWORK;
    const pathDeployOutputParameters = path.join(__dirname, './ERC20Bridge_output.json');
    const deployOutputParameters = require(pathDeployOutputParameters);

    let zkEVMBridgeContractAddress;
    // Use mainnet bridge address
    if (networkName === 'polygonZKEVMMainnet' || networkName === 'mainnet') {
        zkEVMBridgeContractAddress = mainnetBridgeAddress;
    }

    // Use testnet bridge address
    if (networkName === 'polygonZKEVMTestnet' || networkName === 'goerli') {
        zkEVMBridgeContractAddress = testnetBridgeAddress;
    }

    // Token params
    const name = deployOutputParameters.tokenName;
    const symbol = deployOutputParameters.tokenSymbol;
    const initialAccount = deployOutputParameters.deployerAddress;
    const initialBalance = deployOutputParameters.tokenInitialBalance;

    try {
        // verify token mainnet
        await hre.run(
            'verify:verify',
            {
                address: deployOutputParameters.erc20MainnetToken,
                constructorArguments: [
                    name,
                    symbol,
                    initialAccount,
                    initialBalance,
                ],
            },
        );
    } catch (error) {
        console.log(error);
        expect(error.message.toLowerCase().includes('already verified')).to.be.equal(true);
    }

    try {
        // verify ERC20BridgeNativeChain
        await hre.run(
            'verify:verify',
            {
                address: deployOutputParameters.ERC20BridgeMainnet,
                constructorArguments: [
                    zkEVMBridgeContractAddress,
                    deployOutputParameters.ERC20BridgezkEVM,
                    networkIDzkEVM,
                    deployOutputParameters.erc20MainnetToken,
                ],
            },
        );
    } catch (error) {
        expect(error.message.toLowerCase().includes('already verified')).to.be.equal(true);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
