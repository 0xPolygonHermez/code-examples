const { expect } = require('chai');
const { ethers, upgrades } = require('hardhat');
const MerkleTreeBridge = require('@0xpolygonhermez/zkevm-commonjs').MTBridge;
const {
    verifyMerkleProof,
    getLeafValue,
} = require('@0xpolygonhermez/zkevm-commonjs').mtBridgeUtils;

function calculateGlobalExitRoot(mainnetExitRoot, rollupExitRoot) {
    return ethers.utils.solidityKeccak256(['bytes32', 'bytes32'], [mainnetExitRoot, rollupExitRoot]);
}

describe('PolygonZkEVMBridge Contract', () => {
    let deployer;
    let rollup;
    let acc1;

    let polygonZkEVMGlobalExitRoot;
    let polygonZkEVMBridgeContract;

    let nftBridgeContract;
    let nftContract;

    const tokenName = 'Matic Token';
    const tokenSymbol = 'MATIC';
    const baseTokenURL = "https://url.test";
    
    const tokenInitialBalance = ethers.utils.parseEther('20000000');
    const metadataToken = ethers.utils.defaultAbiCoder.encode(
        ['string', 'string', 'string'],
        [tokenName, tokenSymbol, baseTokenURL],
    );

    const networkIDMainnet = 0;
    const networkIDRollup = 1;

    const LEAF_TYPE_ASSET = 0;
    const LEAF_TYPE_MESSAGE = 1;

    const polygonZkEVMAddress = ethers.constants.AddressZero;

    beforeEach('Deploy contracts', async () => {
        // load signers
        [deployer, rollup, acc1] = await ethers.getSigners();

        // deploy PolygonZkEVMBridge
        const polygonZkEVMBridgeFactory = await ethers.getContractFactory('PolygonZkEVMBridge');
        polygonZkEVMBridgeContract = await upgrades.deployProxy(polygonZkEVMBridgeFactory, [], { initializer: false });

        // deploy global exit root manager
        const PolygonZkEVMGlobalExitRootFactory = await ethers.getContractFactory('PolygonZkEVMGlobalExitRoot');
        polygonZkEVMGlobalExitRoot = await PolygonZkEVMGlobalExitRootFactory.deploy(rollup.address, polygonZkEVMBridgeContract.address);
        await polygonZkEVMBridgeContract.initialize(networkIDMainnet, polygonZkEVMGlobalExitRoot.address, polygonZkEVMAddress);


        // deploy erc721 token
        const nftFactory = await ethers.getContractFactory('ERC721Mock');
        nftContract = await nftFactory.deploy(
            tokenName,
            tokenSymbol,
            baseTokenURL
        );
        await nftContract.deployed();

        // mint nft for owner
        await nftContract.mint(deployer.address);

        // deploy nft bridge
        const nftBridgeFactory = await ethers.getContractFactory('ZkEVMNFTBridge');
        nftBridgeContract = await nftBridgeFactory.deploy(
            polygonZkEVMBridgeContract.address
        );
        await nftBridgeContract.deployed();
        
    });

    it('should check the constructor parameters', async () => {
        expect(await nftBridgeContract.polygonZkEVMBridge()).to.be.equal(polygonZkEVMBridgeContract.address);
        expect(await nftBridgeContract.networkID()).to.be.equal(networkIDMainnet);
    });

    it('should bridge NFT', async () => {
        // Bridge nft

        // uint32 destinationNetwork,
        // address destinationAddress,
        // address token,
        // uint256 tokenId,
        // bool forceUpdateGlobalExitRoot


        const depositCount = await polygonZkEVMBridgeContract.depositCount();
        const originNetwork = networkIDMainnet;
        const originAddress = deployer.address;
        const amount = ethers.utils.parseEther('10');
        const destinationNetwork = networkIDRollup;
        const destinationAddress = deployer.address;

        const metadata = metadataToken;
        const metadataHash = ethers.utils.solidityKeccak256(['bytes'], [metadata]);
        const rollupExitRoot = await polygonZkEVMGlobalExitRoot.lastRollupExitRoot();

        // pre compute root merkle tree in Js
        const height = 32;
        const merkleTree = new MerkleTreeBridge(height);
        const leafValue = getLeafValue(
            LEAF_TYPE_MESSAGE,
            originNetwork,
            originAddress,
            destinationNetwork,
            destinationAddress,
            amount,
            metadataHash,
        );
        merkleTree.add(leafValue);
        const rootJSMainnet = merkleTree.getRoot();

        await expect(polygonZkEVMBridgeContract.bridgeMessage(destinationNetwork, destinationAddress, true, metadata, { value: amount }))
            .to.emit(polygonZkEVMBridgeContract, 'BridgeEvent')
            .withArgs(
                LEAF_TYPE_MESSAGE,
                originNetwork,
                originAddress,
                destinationNetwork,
                destinationAddress,
                amount,
                metadata,
                depositCount,
            );

        // check merkle root with SC
        const rootSCMainnet = await polygonZkEVMBridgeContract.getDepositRoot();
        expect(rootSCMainnet).to.be.equal(rootJSMainnet);

        // check merkle proof
        const proof = merkleTree.getProofTreeByIndex(0);
        const index = 0;

        // verify merkle proof
        expect(verifyMerkleProof(leafValue, proof, index, rootSCMainnet)).to.be.equal(true);
        expect(await polygonZkEVMBridgeContract.verifyMerkleProof(
            leafValue,
            proof,
            index,
            rootSCMainnet,
        )).to.be.equal(true);

        const computedGlobalExitRoot = calculateGlobalExitRoot(rootJSMainnet, rollupExitRoot);
        expect(computedGlobalExitRoot).to.be.equal(await polygonZkEVMGlobalExitRoot.getLastGlobalExitRoot());
    });

    it('should claim message', async () => {
        // Add a claim leaf to rollup exit tree
        const originNetwork = networkIDMainnet;
        const tokenAddress = ethers.constants.AddressZero; // ether
        const amount = ethers.utils.parseEther('10');
        const destinationNetwork = networkIDMainnet;
        const destinationAddress = deployer.address;

        const metadata = '0x176923791298713271763697869132'; // since is ether does not have metadata
        const metadataHash = ethers.utils.solidityKeccak256(['bytes'], [metadata]);

        const mainnetExitRoot = await polygonZkEVMGlobalExitRoot.lastMainnetExitRoot();

        // compute root merkle tree in Js
        const height = 32;
        const merkleTree = new MerkleTreeBridge(height);
        const leafValue = getLeafValue(
            LEAF_TYPE_MESSAGE,
            originNetwork,
            tokenAddress,
            destinationNetwork,
            destinationAddress,
            amount,
            metadataHash,
        );
        merkleTree.add(leafValue);

        // check merkle root with SC
        const rootJSRollup = merkleTree.getRoot();

        // add rollup Merkle root
        await expect(polygonZkEVMGlobalExitRoot.connect(rollup).updateExitRoot(rootJSRollup))
            .to.emit(polygonZkEVMGlobalExitRoot, 'UpdateGlobalExitRoot')
            .withArgs(mainnetExitRoot, rootJSRollup);

        // check roots
        const rollupExitRootSC = await polygonZkEVMGlobalExitRoot.lastRollupExitRoot();
        expect(rollupExitRootSC).to.be.equal(rootJSRollup);

        const computedGlobalExitRoot = calculateGlobalExitRoot(mainnetExitRoot, rollupExitRootSC);
        expect(computedGlobalExitRoot).to.be.equal(await polygonZkEVMGlobalExitRoot.getLastGlobalExitRoot());

        // check merkle proof
        const proof = merkleTree.getProofTreeByIndex(0);
        const index = 0;

        // verify merkle proof
        expect(verifyMerkleProof(leafValue, proof, index, rootJSRollup)).to.be.equal(true);
        expect(await polygonZkEVMBridgeContract.verifyMerkleProof(
            leafValue,
            proof,
            index,
            rootJSRollup,
        )).to.be.equal(true);

        /*
         * claim
         * Can't claim a message as an assets
         */
        await expect(polygonZkEVMBridgeContract.claimAsset(
            proof,
            index,
            mainnetExitRoot,
            rollupExitRootSC,
            originNetwork,
            tokenAddress,
            destinationNetwork,
            destinationAddress,
            amount,
            metadata,
        )).to.be.revertedWith('InvalidSmtProof');

        /*
         * claim
         * Can't claim without ether
         */
        await expect(polygonZkEVMBridgeContract.claimMessage(
            proof,
            index,
            mainnetExitRoot,
            rollupExitRootSC,
            originNetwork,
            tokenAddress,
            destinationNetwork,
            destinationAddress,
            amount,
            metadata,
        )).to.be.revertedWith('MessageFailed');

        const balanceDeployer = await ethers.provider.getBalance(deployer.address);
        /*
         * Create a deposit to add ether to the PolygonZkEVMBridge
         * Check deposit amount ether asserts
         */
        await expect(polygonZkEVMBridgeContract.bridgeAsset(
            networkIDRollup,
            destinationAddress,
            amount,
            tokenAddress,
            true,
            '0x',
            { value: ethers.utils.parseEther('100') },
        )).to.be.revertedWith('AmountDoesNotMatchMsgValue');

        // Check mainnet destination assert
        await expect(polygonZkEVMBridgeContract.bridgeAsset(
            networkIDMainnet,
            destinationAddress,
            amount,
            tokenAddress,
            true,
            '0x',
            { value: amount },
        )).to.be.revertedWith('DestinationNetworkInvalid');

        // This is used just to pay ether to the PolygonZkEVMBridge smart contract and be able to claim it afterwards.
        expect(await polygonZkEVMBridgeContract.bridgeAsset(
            networkIDRollup,
            destinationAddress,
            amount,
            tokenAddress,
            true,
            '0x',
            { value: amount },
        ));

        // Check balances before claim
        expect(await ethers.provider.getBalance(polygonZkEVMBridgeContract.address)).to.be.equal(amount);
        expect(await ethers.provider.getBalance(deployer.address)).to.be.lte(balanceDeployer.sub(amount));

        // Check mainnet destination assert
        await expect(polygonZkEVMBridgeContract.claimAsset(
            proof,
            index,
            mainnetExitRoot,
            rollupExitRootSC,
            originNetwork,
            tokenAddress,
            destinationNetwork,
            destinationAddress,
            amount,
            metadata,
        )).to.be.revertedWith('InvalidSmtProof');

        await expect(polygonZkEVMBridgeContract.claimMessage(
            proof,
            index,
            mainnetExitRoot,
            rollupExitRootSC,
            originNetwork,
            tokenAddress,
            destinationNetwork,
            destinationAddress,
            amount,
            metadata,
        ))
            .to.emit(polygonZkEVMBridgeContract, 'ClaimEvent')
            .withArgs(
                index,
                originNetwork,
                tokenAddress,
                destinationAddress,
                amount,
            );

        // Check balances after claim
        expect(await ethers.provider.getBalance(polygonZkEVMBridgeContract.address)).to.be.equal(ethers.utils.parseEther('0'));
        expect(await ethers.provider.getBalance(deployer.address)).to.be.lte(balanceDeployer);

        // Can't claim because nullifier
        await expect(polygonZkEVMBridgeContract.claimAsset(
            proof,
            index,
            mainnetExitRoot,
            rollupExitRootSC,
            originNetwork,
            tokenAddress,
            destinationNetwork,
            destinationAddress,
            amount,
            metadata,
        )).to.be.revertedWith('AlreadyClaimed');
    });
});
