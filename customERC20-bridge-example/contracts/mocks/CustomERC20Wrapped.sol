// SPDX-License-Identifier: AGPL-3.0

pragma solidity 0.8.17;

import "./CustomERC20Mainnet.sol";
import "../interfaces/IERC20Wrapped.sol";

contract CustomERC20Wrapped is CustomERC20Mainnet, IERC20Wrapped {
    // PolygonZkEVM Bridge address
    address public immutable ERC20bridgeAddress;

    // Notice that can inherit any erc20 contract with ANY custom logic
    constructor(
        string memory name,
        string memory symbol,
        address initialAccount,
        uint256 initialBalance,
        address _ERC20bridgeAddress
    ) CustomERC20Mainnet(name, symbol, initialAccount, initialBalance) {
        ERC20bridgeAddress = _ERC20bridgeAddress;
    }

    modifier onlyBridge() {
        require(
            msg.sender == ERC20bridgeAddress,
            "CustomERC20Wrapped::onlyBridge: Not PolygonZkEVMBridge"
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
}
