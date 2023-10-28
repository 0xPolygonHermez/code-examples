// SPDX-License-Identifier: AGPL-3.0

pragma solidity 0.8.17;

import "./CustomERC20Mainnet.sol";
import "../interfaces/IERC20Wrapped.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

contract CustomERC20Wrapped is CustomERC20Mainnet, AccessControl, IERC20Wrapped {
    // PolygonZkEVM Bridge address
    address public immutable ERC20bridgeAddress;

    /// @notice Blacklister role
    bytes32 public constant BLACKLISTER_ROLE = keccak256("BLACKLISTER_ROLE");

    /// @notice Map address to whitelist status
    mapping(address => bool) public isBlacklisted;

    /// @notice Event emitted when account is blacklisted
    event BlacklistAdded(address account);

    /// @notice Event emitted when account is removed from blacklist
    event BlacklistRemoved(address account);

    // Notice that can inherit any erc20 contract with ANY custom logic
    constructor(
        string memory name,
        string memory symbol,
        address initialAccount,
        uint256 initialBalance,
        address _ERC20bridgeAddress,
        address _blacklister
    ) CustomERC20Mainnet(name, symbol, initialAccount, initialBalance) {
        ERC20bridgeAddress = _ERC20bridgeAddress;
        _grantRole(BLACKLISTER_ROLE, _blacklister);
    }

    modifier onlyBridge() {
        require(
            msg.sender == ERC20bridgeAddress,
            "CustomERC20Wrapped::onlyBridge: Not PolygonZkEVMBridge"
        );
        _;
    }

    modifier whenNotBlacklisted(address account) {
        require(
            !isBlacklisted[account],
            "CustomERC20Wrapped::whenNotBlacklisted: Account blacklisted"
        );
        _;
    }

    function bridgeMint(address to, uint256 value) external onlyBridge {
        _mint(to, value);
    }

    // Notice that is not require to approve wrapped tokens to use the bridge
    function bridgeBurn(address account, uint256 value) external onlyBridge {
        _burn(account, value);
    }

    function addBlacklist(address account) external onlyRole(BLACKLISTER_ROLE) {
        isBlacklisted[account] = true;
        emit BlacklistAdded(account);
    }

    function removeBlacklist(address account) external onlyRole(BLACKLISTER_ROLE) {
        isBlacklisted[account] = false;
        emit BlacklistRemoved(account);
    }

    /**
    * @notice _beforeTokenTransfer hook to pause the transfer
    */
    function _beforeTokenTransfer(address from, address to, uint256 amount)
        internal
        virtual
        override
        whenNotBlacklisted(from)
        whenNotBlacklisted(to)
    {
        super._beforeTokenTransfer(from, to, amount);
    }

}
