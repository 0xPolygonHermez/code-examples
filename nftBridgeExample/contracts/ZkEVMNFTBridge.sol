// SPDX-License-Identifier: AGPL-3.0

pragma solidity 0.8.17;

import "./ERC721Wrapped.sol";
import "./polygonZKEVMContracts/interfaces/IBasePolygonZkEVMGlobalExitRoot.sol";
import "./polygonZKEVMContracts/interfaces/IBridgeMessageReceiver.sol";
import "./polygonZKEVMContracts/interfaces/IPolygonZkEVMBridge.sol";
import "@openzeppelin/contracts/token/ERC721/utils/ERC721Holder.sol";

/**
 * ZkEVMNFTBridge is an example contract to use the message layer of the PolygonZkEVMBridge to bridge NFTs
 */
contract ZkEVMNFTBridge is ERC721Holder, IBridgeMessageReceiver {
    // Wrapped Token information struct
    struct TokenInformation {
        uint32 originNetwork;
        address originTokenAddress;
    }

    // Global Exit Root address
    IPolygonZkEVMBridge public immutable polygonZkEVMBridge;

    // Current network identifier
    uint32 public immutable networkID;

    // keccak256(OriginNetwork || tokenAddress) --> Wrapped token address
    mapping(bytes32 => address) public tokenInfoToWrappedToken;

    // Wrapped token Address --> Origin token information
    mapping(address => TokenInformation) public wrappedTokenToTokenInfo;

    /**
     * @param _polygonZkEVMBridge Polygon zkevm bridge address
     */
    constructor(IPolygonZkEVMBridge _polygonZkEVMBridge) {
        polygonZkEVMBridge = _polygonZkEVMBridge;
        networkID = polygonZkEVMBridge.networkID();
    }

    /**
     * @dev Emitted when bridge assets or messages to another network
     */
    event BridgeNFT(
        uint32 destinationNetwork,
        address token,
        address destinationAddress,
        uint256 tokenId
    );

    /**
     * @dev Emitted when a nft is transfered from another network
     */
    event ClaimNFT(
        uint32 originTokenNetwork,
        address originTokenAddress,
        address destinationAddress,
        uint256 tokenId
    );

    /**
     * @dev Emitted when a new wrapped token is created
     */
    event NewWrappedToken(
        uint32 originNetwork,
        address originTokenAddress,
        address wrappedTokenAddress,
        string name,
        string symbol
    );

    /**
     * @notice Deposit add a new leaf to the merkle tree
     * Correctness of the destination network in checked on the polygonZKEVMBridge
     * @param destinationNetwork Network destination
     * @param destinationAddress Address destination that will receive the NFT in the other network
     * @param token Token address, 0 address is reserved for ether
     * @param tokenId Token address, 0 address is reserved for ether
     * @param forceUpdateGlobalExitRoot Indicates if the global exit root is updated or not
     */
    function bridgeNFT(
        uint32 destinationNetwork,
        address destinationAddress,
        address token,
        uint256 tokenId,
        bool forceUpdateGlobalExitRoot
    ) public virtual {
        uint32 originNetwork = networkID;
        address originTokenAddress = token;

        TokenInformation memory tokenInfo = wrappedTokenToTokenInfo[token];
        if (tokenInfo.originTokenAddress != address(0)) {
            // The token is a wrapped token from another network

            // Burn tokens
            ERC721Wrapped(token).burn(tokenId);

            // Override token parameters
            originNetwork = tokenInfo.originNetwork;
            originTokenAddress = tokenInfo.originTokenAddress;
        } else {
            IERC721(token).transferFrom(msg.sender, address(this), tokenId);
        }

        bytes memory messageData = abi.encode(
            originNetwork,
            originTokenAddress,
            destinationAddress,
            tokenId,
            _safeName(token),
            _safeSymbol(token),
            _safeTokenURI(token, tokenId)
        );

        // It's supposed that both contracts will be deployed with the same address
        // Can be achieve using the same nonce on CREATE, or using CREATE2 patterns
        polygonZkEVMBridge.bridgeMessage(
            destinationNetwork,
            address(this),
            forceUpdateGlobalExitRoot,
            messageData
        );

        emit BridgeNFT(destinationNetwork, token, destinationAddress, tokenId);
    }

    /**
     * @notice Verify merkle proof and withdraw tokens/ether
     * @param originAddress Origin address that the message was sended
     * @param originNetwork Origin network that the message was sended ( not usefull for this contract)
     * @param data Abi encoded metadata
     */
    function onMessageReceived(
        address originAddress,
        uint32 originNetwork,
        bytes memory data
    ) external payable override {
        // Can only be called by the bridge
        require(
            msg.sender == address(polygonZkEVMBridge),
            "TokenWrapped::onlyBridge: Not PolygonZkEVMBridge"
        );

        // Can only be called by this contract in another network
        // It's supposed to be deployed with the same address in both networks
        require(
            address(this) == originAddress,
            "TokenWrapped::onlyBridge: Not ZkEVMNFTBridge"
        );

        // Decode data
        (
            uint32 originTokenNetwork,
            address originTokenAddress,
            address destinationAddress,
            uint256 tokenId,
            string memory name,
            string memory symbol,
            string memory tokenURI
        ) = abi.decode(
                data,
                (uint32, address, address, uint256, string, string, string)
            );

        // Transfer NFTs
        if (originTokenNetwork == networkID) {
            // The token is an ERC721 from this network
            IERC721(originTokenAddress).transferFrom(
                address(this),
                destinationAddress,
                tokenId
            );
        } else {
            // The tokens is not from this network
            // Create a wrapper for the token if not exist yet
            bytes32 tokenInfoHash = keccak256(
                abi.encodePacked(originTokenNetwork, originTokenAddress)
            );
            address wrappedToken = tokenInfoToWrappedToken[tokenInfoHash];
            if (wrappedToken == address(0)) {
                // Create a new wrapped erc20 using create2
                ERC721Wrapped newWrappedToken = (new ERC721Wrapped){
                    salt: tokenInfoHash
                }(name, symbol);

                // Mint tokens for the destination address
                newWrappedToken.mint(destinationAddress, tokenId, tokenURI);

                // Create mappings
                tokenInfoToWrappedToken[tokenInfoHash] = address(
                    newWrappedToken
                );

                wrappedTokenToTokenInfo[
                    address(newWrappedToken)
                ] = TokenInformation(originTokenNetwork, originTokenAddress);

                emit NewWrappedToken(
                    originTokenNetwork,
                    originTokenAddress,
                    address(newWrappedToken),
                    name,
                    symbol
                );
            } else {
                // Use the existing wrapped erc721
                ERC721Wrapped(wrappedToken).mint(
                    destinationAddress,
                    tokenId,
                    tokenURI
                );
            }
        }

        emit ClaimNFT(
            originTokenNetwork,
            originTokenAddress,
            destinationAddress,
            tokenId
        );
    }

    /**
     * @notice Returns the precalculated address of a wrapper using the token information
     * Note Updating the metadata of a token is not supported.
     * Since the metadata has relevance in the address deployed, this function will not return a valid
     * wrapped address if the metadata provided is not the original one.
     * @param originNetwork Origin network
     * @param originTokenAddress Origin token address, 0 address is reserved for ether
     * @param name Name of the token
     * @param symbol Symbol of the token
     */
    function precalculatedWrapperAddress(
        uint32 originNetwork,
        address originTokenAddress,
        string calldata name,
        string calldata symbol
    ) external view returns (address) {
        bytes32 salt = keccak256(
            abi.encodePacked(originNetwork, originTokenAddress)
        );

        bytes32 hashCreate2 = keccak256(
            abi.encodePacked(
                bytes1(0xff),
                address(this),
                salt,
                keccak256(
                    abi.encodePacked(
                        type(ERC721Wrapped).creationCode,
                        abi.encode(name, symbol)
                    )
                )
            )
        );

        // last 20 bytes of hash to address
        return address(uint160(uint256(hashCreate2)));
    }

    /**
     * @notice Returns the address of a wrapper using the token information if already exist
     * @param originNetwork Origin network
     * @param originTokenAddress Origin token address, 0 address is reserved for ether
     */
    function getTokenWrappedAddress(
        uint32 originNetwork,
        address originTokenAddress
    ) external view returns (address) {
        return
            tokenInfoToWrappedToken[
                keccak256(abi.encodePacked(originNetwork, originTokenAddress))
            ];
    }

    // Helpers to safely get the metadata from a ERC721

    /**
     * @notice  Provides a safe ERC721.name version which returns 'NO_NAME' as fallback string.
     * @param token The address of the ERC-721 token contract.
     */
    function _safeName(address token) internal view returns (string memory) {
        (bool success, bytes memory data) = address(token).staticcall(
            abi.encodeCall(IERC721Metadata.name, ())
        );
        return success ? _returnDataToString(data) : "NO_NAME";
    }

    /**
     * @notice Provides a safe ERC721.symbol version which returns 'NO_SYMBOL' as fallback string
     * @param token The address of the ERC-721 token contract
     */
    function _safeSymbol(address token) internal view returns (string memory) {
        (bool success, bytes memory data) = address(token).staticcall(
            abi.encodeCall(IERC721Metadata.symbol, ())
        );
        return success ? _returnDataToString(data) : "NO_SYMBOL";
    }

    /**
     * @notice Provides a safe ERC721.tokenURI version which returns '' as fallback value.
     * @param token The address of the ERC-721 token contract
     * @param tokenId Token Id
     */
    function _safeTokenURI(
        address token,
        uint256 tokenId
    ) internal view returns (string memory) {
        (bool success, bytes memory data) = address(token).staticcall(
            abi.encodeCall(IERC721Metadata.tokenURI, (tokenId))
        );
        return success ? _returnDataToString(data) : "";
    }

    /**
     * @notice Function to convert returned data to string
     * returns 'NOT_VALID_ENCODING' as fallback value.
     * @param data returned data
     */
    function _returnDataToString(
        bytes memory data
    ) internal pure returns (string memory) {
        if (data.length >= 64) {
            return abi.decode(data, (string));
        } else if (data.length == 32) {
            // Since the strings on bytes32 are encoded left-right, check the first zero in the data
            uint256 nonZeroBytes;
            while (nonZeroBytes < 32 && data[nonZeroBytes] != 0) {
                nonZeroBytes++;
            }

            // If the first one is 0, we do not handle the encoding
            if (nonZeroBytes == 0) {
                return "NOT_VALID_ENCODING";
            }
            // Create a byte array with nonZeroBytes length
            bytes memory bytesArray = new bytes(nonZeroBytes);
            for (uint256 i = 0; i < nonZeroBytes; i++) {
                bytesArray[i] = data[i];
            }
            return string(bytesArray);
        } else {
            return "NOT_VALID_ENCODING";
        }
    }
}
