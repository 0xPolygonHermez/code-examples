// SPDX-License-Identifier: AGPL-3.0

pragma solidity 0.8.17;

import "../polygonZKEVMContracts/interfaces/IBasePolygonZkEVMGlobalExitRoot.sol";
import "../polygonZKEVMContracts/interfaces/IBridgeMessageReceiver.sol";
import "../polygonZKEVMContracts/interfaces/IPolygonZkEVMBridge.sol";

/**
 * This contract contains the logic to use the message layer of the bridge to send and receive messages
 * to a counterpart contract deployed on another network.
 * Is needed to deploy 1 contract on each layer that inherits this base.
 */
abstract contract PolygonBridgeBase {
    // Zk-EVM Bridge address
    IPolygonZkEVMBridge public immutable polygonZkEVMBridge;

    // Counterpart contract that will be deployed on the other network
    // Both contract will send messages to each other
    address public immutable counterpartContract;

    // Counterpart network
    uint32 public immutable counterpartNetwork;

    /**
     * @param _polygonZkEVMBridge Polygon zkevm bridge address
     * @param _counterpartContract Couterpart contract
     * @param _counterpartNetwork Couterpart network
     */
    constructor(
        IPolygonZkEVMBridge _polygonZkEVMBridge,
        address _counterpartContract,
        uint32 _counterpartNetwork
    ) {
        polygonZkEVMBridge = _polygonZkEVMBridge;
        counterpartContract = _counterpartContract;
        counterpartNetwork = _counterpartNetwork;
    }

    /**
     * @notice Send a message to the bridge
     * @param messageData Message data
     * @param forceUpdateGlobalExitRoot Indicates if the global exit root is updated or not
     */
    function _bridgeMessage(
        bytes memory messageData,
        bool forceUpdateGlobalExitRoot
    ) internal virtual {
        polygonZkEVMBridge.bridgeMessage(
            counterpartNetwork,
            counterpartContract,
            forceUpdateGlobalExitRoot,
            messageData
        );
    }

    /**
     * @notice Function triggered by the bridge once a message is received by the other network
     * @param originAddress Origin address that the message was sended
     * @param originNetwork Origin network that the message was sended ( not usefull for this contract)
     * @param data Abi encoded metadata
     */
    function onMessageReceived(
        address originAddress,
        uint32 originNetwork,
        bytes memory data
    ) external payable {
        // Can only be called by the bridge
        require(
            msg.sender == address(polygonZkEVMBridge),
            "TokenWrapped::PolygonBridgeBase: Not PolygonZkEVMBridge"
        );

        require(
            counterpartContract == originAddress,
            "TokenWrapped::PolygonBridgeBase: Not counterpart contract"
        );
        require(
            counterpartNetwork == originNetwork,
            "TokenWrapped::PolygonBridgeBase: Not counterpart network"
        );

        _onMessageReceived(data);
    }

    /**
     * @dev Handle the data of the message received
     * Must be implemented in parent contracts
     */
    function _onMessageReceived(bytes memory data) internal virtual;
}
