// SPDX-License-Identifier: AGPL-3.0

pragma solidity 0.8.17;

/**
 * @dev Define interface for erc20 wrapped
 */
interface IERC20Wrapped {
    function bridgeMint(address to, uint256 value) external;

    function bridgeBurn(address account, uint256 value) external;
}
