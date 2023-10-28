// SPDX-License-Identifier: AGPL-3.0

pragma solidity 0.8.17;

import "./PolygonBridgeBase.sol";

/**
 * This contract contains the common logic to interact with the message layer of the bridge
 * to build a custom erc20 bridge. Is needed to deploy 1 contract on each layer that inherits
 * this base.
 */
abstract contract PolygonERC20BridgeBase is PolygonBridgeBase {
    /**
     * @param _polygonZkEVMBridge Polygon zkevm bridge address
     * @param _counterpartContract Couterpart contract
     * @param _counterpartNetwork Couterpart network
     */
    constructor(
        IPolygonZkEVMBridge _polygonZkEVMBridge,
        address _counterpartContract,
        uint32 _counterpartNetwork
    )
        PolygonBridgeBase(
            _polygonZkEVMBridge,
            _counterpartContract,
            _counterpartNetwork
        )
    {}

    /**
     * @dev Emitted when bridge tokens to the counterpart network
     */
    event BridgeTokens(address destinationAddress, uint256 amount);

    /**
     * @dev Emitted when claim tokens from the counterpart network
     */
    event ClaimTokens(address destinationAddress, uint256 amount);

    /**
     * @notice Send a message to the bridge that contains the destination address and the token amount
     * The parent contract should implement the receive token protocol and afterwards call this function
     * @param destinationAddress Address destination that will receive the tokens on the other network
     * @param amount Token amount
     * @param forceUpdateGlobalExitRoot Indicates if the global exit root is updated or not
     */
    function bridgeToken(
        address destinationAddress,
        uint256 amount,
        bool forceUpdateGlobalExitRoot
    ) external {
        _receiveTokens(amount);

        // Encode message data
        bytes memory messageData = abi.encode(destinationAddress, amount);

        // Send message data through the bridge
        _bridgeMessage(messageData, forceUpdateGlobalExitRoot);

        emit BridgeTokens(destinationAddress, amount);
    }

    /**
     * @notice Internal function triggered when receive a message
     * @param data message data containing the destination address and the token amount
     */
    function _onMessageReceived(bytes memory data) internal override {
        // Decode message data
        (address destinationAddress, uint256 amount) = abi.decode(
            data,
            (address, uint256)
        );

        _transferTokens(destinationAddress, amount);
        emit ClaimTokens(destinationAddress, amount);
    }

    /**
     * @dev Handle the reception of the tokens
     * Must be implemented in parent contracts
     */
    function _receiveTokens(uint256 amount) internal virtual;

    /**
     * @dev Handle the transfer of the tokens
     * Must be implemented in parent contracts
     */
    function _transferTokens(
        address destinationAddress,
        uint256 amount
    ) internal virtual;
}
