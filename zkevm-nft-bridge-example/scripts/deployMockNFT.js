/* eslint-disable no-await-in-loop, no-use-before-define, no-lonely-if, import/no-dynamic-require, global-require */
/* eslint-disable no-console, no-inner-declarations, no-undef, import/no-unresolved, no-restricted-syntax */
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { ethers } = require('hardhat');

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

    // deploy erc721 token
    const tokenName = 'test NFT';
    const tokenSymbol = 'TNFT';
    const baseTokenURL = 'http://example';

    const nftFactory = await ethers.getContractFactory('ERC721Mock', deployer);
    const nftContract = await nftFactory.deploy(
        tokenName,
        tokenSymbol,
        baseTokenURL,
    );
    await nftContract.deployed();

    console.log('nftMockContract contract succesfully deployed on: ', nftContract.address);

    // mint nft for owner
    await nftContract.mint(deployer.address);

    const outputJson = {
        tokenName,
        tokenSymbol,
        baseTokenURL,
        nftMockcontract: nftContract.address,
    };

    const pathOutputJson = path.join(__dirname, './deployMockNFT_output.json');

    fs.writeFileSync(pathOutputJson, JSON.stringify(outputJson, null, 1));
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
