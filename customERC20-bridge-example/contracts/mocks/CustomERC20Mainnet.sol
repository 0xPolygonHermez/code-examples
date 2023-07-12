// SPDX-License-Identifier: AGPL-3.0

pragma solidity 0.8.17;

import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract CustomERC20Mainnet is ERC20Pausable, Ownable {
    constructor(
        string memory name,
        string memory symbol,
        address initialAccount,
        uint256 initialBalance
    ) ERC20(name, symbol) {
        _mint(initialAccount, initialBalance);
    }

    /**
     * @notice This function is used to pause the transferability of the token.
     * Only the owner can call this function
     */
    function pause() public onlyOwner {
        _pause();
    }

    /**
     * @notice This function is used to unpause the transferability of the token.
     * Only the owner can call this function
     */
    function unpause() public onlyOwner {
        _unpause();
    }
}
