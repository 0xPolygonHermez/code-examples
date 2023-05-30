function checkNetwork(network, infoNetworks) {
    if (!Object.keys(infoNetworks).includes(network)) {
        console.log(`Available deployments: ${Object.keys(infoNetworks)}`);
        console.log('   Specify deployment with: --network {networkName}');
        throw new Error(`Deployment ${network} does not match any deployment info`);
    }
}

module.exports = {
    checkNetwork,
};