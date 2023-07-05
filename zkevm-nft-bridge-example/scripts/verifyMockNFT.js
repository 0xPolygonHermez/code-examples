/* eslint-disable import/no-dynamic-require, no-await-in-loop, no-restricted-syntax, guard-for-in */
require('dotenv').config();
const path = require('path');
const hre = require('hardhat');
const {expect} = require('chai');

async function main() {
    const pathDeployOutputParameters = path.join(__dirname, './deployMockNFT_output.json');
    const deployOutputParameters = require(pathDeployOutputParameters);

    try {
        // verify governance
        await hre.run(
            'verify:verify',
            {
                address: deployOutputParameters.nftMockcontract,
                constructorArguments: [
                    deployOutputParameters.tokenName,
                    deployOutputParameters.tokenSymbol,
                    deployOutputParameters.baseTokenURL,
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
