/* eslint-disable import/no-dynamic-require */
const ethers = require('ethers');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
const { argv } = require('yargs')
    .alias('n', 'network');

const { rawTxToCustomRawTx } = require('@0xpolygonhermez/zkevm-commonjs').processorUtils;
const params = require(path.join(__dirname, '../utils'));
const networksConfig = require(path.join(__dirname, '../../networks.json'));

async function main() {
    // get network
    const { network } = argv;
    params.checkNetwork(network, networksConfig);
    const networkInfo = networksConfig[network];

    // load provider
    const provider = new ethers.providers.JsonRpcProvider(networkInfo.urlRPC);

    // load wallet
    const walletInit = new ethers.Wallet(process.env.PVTKEY_L2_ZKEVM);
    const wallet = walletInit.connect(provider);
    console.log('Wallet public address: ', wallet.address);

    // tx parameters
    // FILL IN BY THE USER: START
    const amountEthToSend = ethers.utils.parseUnits('0.01', 'ether');
    const to = '0x0000000000000000000000000000000000000000';
    // FILL IN BY THE USER: FINISH

    const tx = {
        to,
        value: amountEthToSend,
    };

    // populate transaction
    const finalTx = await wallet.populateTransaction(tx);
    // sign transaction
    const txSigned = await wallet.signTransaction(finalTx);
    // get transaction parameters
    const parsedTx = ethers.utils.parseTransaction(txSigned);
    console.log('TX TO SEND: ');
    console.log(parsedTx, '\n');

    // build batch data
    const batchData = rawTxToCustomRawTx(txSigned);
    console.log('FORCED BATCH DATA: ');
    console.log(batchData, '\n');
}

main();
