const ethers = require('ethers');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { argv } = require('yargs')
    .alias('n', 'network');

const abiPolygonZkEVM = require('@0xpolygonhermez/zkevm-contracts/compiled-contracts/PolygonZkEVM').abi;
const params = require('./utils');
const networksConfig = require('../networks.json');

async function main() {
    // get network
    const { network } = argv;
    params.checkNetwork(network, networksConfig);
    const networkInfo = networksConfig[network];

    // load provider
    const provider = new ethers.providers.JsonRpcProvider(process.env[`PROVIDER_${network.toUpperCase()}`]);

    // load wallet
    const walletInit = new ethers.Wallet(process.env.PVTKEY_L1);
    const wallet = walletInit.connect(provider);
    console.log('Wallet public address: ', wallet.address);

    // load polygonZkEVM contract interface
    const contract = new ethers.Contract(networkInfo.addressZkEVM, abiPolygonZkEVM, wallet);

    // get amount matic tokens to send
    const maticAddress = await contract.matic();
    console.log('MATIC ERC20 token address: ', maticAddress);

    const amount = await contract.getForcedBatchFee();
    console.log('MATIC amount needed to send a force batch: ', ethers.utils.formatUnits(amount, 'ether'), 'MATIC');

    // get batchL2Data
    const { batchData } = JSON.parse(fs.readFileSync(path.join(__dirname, '../forced-batch-data.json')));

    // send force batch to L1
    const resTx = await contract.forceBatch(batchData, amount);
    console.log('Forced batch transaction sent');
    console.log('Info tx: ', resTx);
}

main();
