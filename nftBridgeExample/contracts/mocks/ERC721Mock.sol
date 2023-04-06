// SPDX-License-Identifier: AGPL-3.0

pragma solidity 0.8.17;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract ERC721Mock is ERC721, ERC721Enumerable, Ownable {
    // Base token URI, the tokenURI of every nft will be the concatenation of this with the tokenID
    string public baseTokenURI;

    constructor(
        string memory name,
        string memory symbol,
        string memory _baseTokenURI
    ) ERC721(name, symbol) {
        baseTokenURI = _baseTokenURI;
    }

    /**
     * @dev Allows owner to mint an nft for a receiver
     * @param receiver nft receiver
     */
    function mint(address receiver) public onlyOwner {
        // Mint NFT
        _mint(receiver, totalSupply() + 1);
    }

    /**
     * @dev Allows owner to set baseTokenURI
     * @param newBaseTokenURI new baseTokenURI
     */
    function setBaseTokenURI(string memory newBaseTokenURI) external onlyOwner {
        baseTokenURI = newBaseTokenURI;
    }

    /**
     * @dev Override _baseURI, see {ERC721-_baseURI}.
     */
    function _baseURI() internal view override returns (string memory) {
        return baseTokenURI;
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
