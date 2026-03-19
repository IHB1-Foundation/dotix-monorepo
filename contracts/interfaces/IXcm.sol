// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @notice Official XCM precompile interface (Polkadot Hub).
/// @dev See: polkadot-sdk/polkadot/xcm/pallet-xcm/precompiles/src/interface/IXcm.sol
interface IXcm {
    struct Weight {
        uint64 refTime;
        uint64 proofSize;
    }

    function weighMessage(bytes calldata message)
        external
        view
        returns (Weight memory weight);

    function execute(bytes calldata message, Weight calldata weight) external;

    function send(bytes calldata destination, bytes calldata message) external;
}
