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

function encodeMessageData(originNetwork, originTokenAddress, destinationAddress, tokenId, name, symbol, tokenURI) {
    return ethers.utils.defaultAbiCoder.encode(
        ['uint32', 'address', 'address', 'uint256', 'string', 'string', 'string'],
        [originNetwork, originTokenAddress, destinationAddress, tokenId, name, symbol, tokenURI],
    );
}

describe('PolygonZkEVMBridge Contract', () => {
    let deployer;
    let rollup;

    let polygonZkEVMGlobalExitRoot;
    let polygonZkEVMBridgeContract;

    let nftBridgeContract;
    let nftContract;

    const tokenName = 'Matic Token';
    const tokenSymbol = 'MATIC';
    const baseTokenURL = 'https://url.test';

    const networkIDMainnet = 0;
    const networkIDRollup = 1;

    const LEAF_TYPE_MESSAGE = 1;

    const polygonZkEVMAddress = ethers.constants.AddressZero;

    beforeEach('Deploy contracts', async () => {
        // load signers
        [deployer, rollup] = await ethers.getSigners();

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
            baseTokenURL,
        );
        await nftContract.deployed();

        // mint nft for owner
        await nftContract.mint(deployer.address);

        // deploy nft bridge
        const nftBridgeFactory = await ethers.getContractFactory('ZkEVMNFTBridge');
        nftBridgeContract = await nftBridgeFactory.deploy(
            polygonZkEVMBridgeContract.address,
        );
        await nftBridgeContract.deployed();
    });

    it('should check the constructor parameters', async () => {
        expect(await nftBridgeContract.polygonZkEVMBridge()).to.be.equal(polygonZkEVMBridgeContract.address);
        expect(await nftBridgeContract.networkID()).to.be.equal(networkIDMainnet);
    });

    it('should bridge NFT', async () => {
        // Encode message
        const originNetwork = networkIDMainnet;
        const originTokenAddress = nftContract.address;
        const tokenId = 1;
        const destinationNetwork = networkIDRollup;
        const destinationAddress = deployer.address;

        const tokenURI = baseTokenURL + tokenId;
        // Encode message
        const message = encodeMessageData(
            originNetwork,
            originTokenAddress,
            destinationAddress,
            tokenId,
            tokenName,
            tokenSymbol,
            tokenURI,
        );

        // pre compute root merkle tree in Js
        const height = 32;
        const merkleTree = new MerkleTreeBridge(height);

        // bridge message between nftBridgeContract deployed on both networks
        const originAddressLeaf = nftBridgeContract.address;
        const destinationAddressLeaf = nftBridgeContract.address;
        const amountLeaf = 0; // 0 ehters
        const messageHash = ethers.utils.solidityKeccak256(['bytes'], [message]);

        const leafValue = getLeafValue(
            LEAF_TYPE_MESSAGE,
            originNetwork,
            originAddressLeaf,
            destinationNetwork,
            destinationAddressLeaf,
            amountLeaf,
            messageHash,
        );
        merkleTree.add(leafValue);
        const rootJSMainnet = merkleTree.getRoot();

        const depositCount = await polygonZkEVMBridgeContract.depositCount();
        const rollupExitRoot = await polygonZkEVMGlobalExitRoot.lastRollupExitRoot();

        // Owner do not approve tokens
        await expect(nftBridgeContract.bridgeNFT(
            destinationNetwork,
            destinationAddress,
            nftContract.address,
            tokenId,
            true,
        )).to.be.revertedWith('ERC721: caller is not token owner or approved');

        // Approve tokens
        await nftContract.approve(nftBridgeContract.address, tokenId);

        await expect(nftBridgeContract.bridgeNFT(
            destinationNetwork,
            destinationAddress,
            nftContract.address,
            tokenId,
            true,
        ))
            .to.emit(nftBridgeContract, 'BridgeNFT')
            .withArgs(
                destinationNetwork,
                nftContract.address,
                destinationAddress,
                tokenId,
            )
            .to.emit(polygonZkEVMBridgeContract, 'BridgeEvent')
            .withArgs(
                LEAF_TYPE_MESSAGE,
                originNetwork,
                originAddressLeaf,
                destinationNetwork,
                destinationAddressLeaf,
                amountLeaf,
                message,
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
        // Encode message from another network
        const originNetwork = networkIDRollup;
        const originTokenAddress = nftContract.address;
        const tokenId = 1;
        const destinationNetwork = networkIDMainnet;
        const destinationAddress = deployer.address;

        const tokenURI = baseTokenURL + tokenId;
        // Encode message
        const message = encodeMessageData(
            originNetwork,
            originTokenAddress,
            destinationAddress,
            tokenId,
            tokenName,
            tokenSymbol,
            tokenURI,
        );

        // compute root merkle tree in Js
        const height = 32;
        const merkleTree = new MerkleTreeBridge(height);

        // Compute leaf
        const originAddressLeaf = nftBridgeContract.address;
        const destinationAddressLeaf = nftBridgeContract.address;
        const amountLeaf = 0; // 0 ehters
        const messageHash = ethers.utils.solidityKeccak256(['bytes'], [message]);

        const leafValue = getLeafValue(
            LEAF_TYPE_MESSAGE,
            originNetwork,
            originAddressLeaf,
            destinationNetwork,
            destinationAddressLeaf,
            amountLeaf,
            messageHash,
        );
        merkleTree.add(leafValue);

        // check merkle root with SC
        const rootJSRollup = merkleTree.getRoot();
        const mainnetExitRoot = await polygonZkEVMGlobalExitRoot.lastMainnetExitRoot();

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

        // Try to call onMessageReceived direct
        await expect(nftBridgeContract.onMessageReceived(
            originTokenAddress,
            networkIDRollup,
            message,
        )).to.be.revertedWith('TokenWrapped::onlyBridge: Not PolygonZkEVMBridge');

        // Expect messages only from nftBridgeContract of another networks
        await expect(nftBridgeContract.onMessageReceived(
            deployer.address,
            networkIDRollup,
            message,
        )).to.be.revertedWith('TokenWrapped::onlyBridge: Not PolygonZkEVMBridge');

        // Precalculate the new wrapped token
        const newWrappedAddress = await nftBridgeContract.precalculatedWrapperAddress(
            originNetwork,
            originTokenAddress,
            tokenName,
            tokenSymbol,
        );

        // Claim message
        await expect(polygonZkEVMBridgeContract.claimMessage(
            proof,
            index,
            mainnetExitRoot,
            rollupExitRootSC,
            originNetwork,
            originAddressLeaf,
            destinationNetwork,
            destinationAddressLeaf,
            amountLeaf,
            message,
        ))
            .to.emit(polygonZkEVMBridgeContract, 'ClaimEvent')
            .withArgs(
                index,
                originNetwork,
                originAddressLeaf,
                destinationAddressLeaf,
                amountLeaf,
            )
            .to.emit(nftBridgeContract, 'NewWrappedToken')
            .withArgs(
                originNetwork,
                originTokenAddress,
                newWrappedAddress,
                tokenName,
                tokenSymbol,
            )
            .to.emit(nftBridgeContract, 'ClaimNFT')
            .withArgs(
                originNetwork,
                originTokenAddress,
                destinationAddress,
                tokenId,
            );

        /*
         *  This will trigget the deployment of new nft contract aswell of the mint of the nft bridged
         * Check new nft minted
         */
        const nftWrappedFactory = await ethers.getContractFactory('ERC721Wrapped');
        const newNftContract = nftWrappedFactory.attach(newWrappedAddress);

        // Wrapped nft Contract checks
        expect(await newNftContract.totalSupply()).to.be.equal(1);
        expect(await newNftContract.name()).to.be.equal(tokenName);
        expect(await newNftContract.symbol()).to.be.equal(tokenSymbol);

        // New minted nft checks
        expect(await newNftContract.ownerOf(tokenId)).to.be.equal(destinationAddress);
        expect(await newNftContract.tokenURI(tokenId)).to.be.equal(tokenURI);

        // Can't claim because nullifier
        await expect(polygonZkEVMBridgeContract.claimAsset(
            proof,
            index,
            mainnetExitRoot,
            rollupExitRootSC,
            originNetwork,
            originAddressLeaf,
            destinationNetwork,
            destinationAddressLeaf,
            amountLeaf,
            message,
        )).to.be.revertedWith('AlreadyClaimed');
    });
});
