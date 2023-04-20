// SPDX-License-Identifier: AGPL-3.0

pragma solidity 0.8.17;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract ERC721Wrapped is ERC721, ERC721Enumerable, ERC721URIStorage {
    // PolygonZkEVM Bridge address
    address public immutable bridgeAddress;

    constructor(
        string memory name,
        string memory symbol
    ) ERC721(name, symbol) {
        bridgeAddress = msg.sender;
    }

    modifier onlyBridge() {
        require(
            msg.sender == bridgeAddress,
            "TokenWrapped::onlyBridge: Not PolygonZkEVMBridge"
        );
        _;
    }
    /**
     * @dev Allows owner to mint an nft for a receiver
     * @param receiver nft receiver
     * @param tokenId token Id
     * @param _tokenURI token uri
     */
    function mint(address receiver, uint256 tokenId, string memory _tokenURI) public onlyBridge {
        // Mint NFT
        _mint(receiver, tokenId);
         _setTokenURI(tokenId, _tokenURI);
    }


    /**
     * @dev Override _burn, see {IERC165-supportsInterface}.
     */
    function burn(uint256 tokenId) public onlyBridge {
        return _burn(tokenId);
    }

    /**
     * @dev Override _burn, see {IERC165-supportsInterface}.
     */
    function _burn(uint256 tokenId) internal override(ERC721, ERC721URIStorage) {
        return super._burn(tokenId);
    }


  /**
       * @dev Override supportsInterface, see {IERC165-supportsInterface}.
     */
    function tokenURI(uint256 tokenId) public view virtual override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }


    /**
     * @dev Override supportsInterface, see {IERC165-supportsInterface}.
     */
    function supportsInterface(
        bytes4 interfaceId
    ) public view virtual override(ERC721, ERC721Enumerable) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    /**
     * @dev Override _beforeTokenTransfer, see {ERC721-_beforeTokenTransfer}.
     */
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 firstTokenId,
        uint256 batchSize
    ) internal virtual override(ERC721, ERC721Enumerable) {
        super._beforeTokenTransfer(from, to, firstTokenId, batchSize);
    }
}
