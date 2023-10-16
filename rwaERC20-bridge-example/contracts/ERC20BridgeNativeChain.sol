// SPDX-License-Identifier: AGPL-3.0

pragma solidity 0.8.17;

import "./base/PolygonERC20BridgeBase.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * ERC20BridgeNativeChain is an example contract to use the message layer of the PolygonZkEVMBridge to bridge custom ERC20
 * This contract will be deployed on the native erc20 network (usually will be mainnet)
 */
contract ERC20BridgeNativeChain is PolygonERC20BridgeBase {
    using SafeERC20 for IERC20;

    // Token address
    IERC20 public immutable token;

    /**
     * @param _polygonZkEVMBridge Polygon zkevm bridge address
     * @param _counterpartContract Couterpart contract
     * @param _counterpartNetwork Couterpart network
     * @param _token Token address
     */
    constructor(
        IPolygonZkEVMBridge _polygonZkEVMBridge,
        address _counterpartContract,
        uint32 _counterpartNetwork,
        IERC20 _token
    )
        PolygonERC20BridgeBase(
            _polygonZkEVMBridge,
            _counterpartContract,
            _counterpartNetwork
        )
    {
        token = _token;
    }

    /**
     * @dev Handle the reception of the tokens
     * @param amount Token amount
     */
    function _receiveTokens(uint256 amount) internal override {
        token.safeTransferFrom(msg.sender, address(this), amount);
    }

    /**
     * @dev Handle the transfer of the tokens
     * @param destinationAddress Address destination that will receive the tokens on the other network
     * @param amount Token amount
     */
    function _transferTokens(
        address destinationAddress,
        uint256 amount
    ) internal override {
        token.safeTransfer(destinationAddress, amount);
    }
}
