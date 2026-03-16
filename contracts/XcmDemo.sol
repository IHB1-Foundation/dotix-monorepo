// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/AccessControl.sol";

import "./interfaces/IXcm.sol";

/// @title XcmDemo
/// @notice Minimal XCM precompile wrapper used in the Dotix demo flow.
contract XcmDemo is AccessControl {
    bytes32 public constant KEEPER_ROLE = keccak256("KEEPER_ROLE");

    address public constant XCM_PRECOMPILE = 0x00000000000000000000000000000000000a0000;

    // XCM v3 demo payload for deterministic weigh/execute demos.
    bytes public constant DEFAULT_MESSAGE = hex"03020100";

    event WeighResult(bytes message, uint64 refTime, uint64 proofSize);
    event ExecuteResult(bytes message, uint8 outcome, address executor);

    /// @notice Deploys the demo wrapper and grants admin and keeper privileges.
    /// @param admin Address receiving the admin and keeper roles.
    constructor(address admin) {
      _grantRole(DEFAULT_ADMIN_ROLE, admin);
      _grantRole(KEEPER_ROLE, admin);
    }

    /// @notice Weighs a custom XCM message through the precompile.
    /// @param message Raw XCM bytes to weigh.
    /// @return refTime Estimated reference time weight.
    /// @return proofSize Estimated proof size weight.
    function demoWeigh(bytes calldata message)
        external
        view
        returns (uint64 refTime, uint64 proofSize)
    {
        return IXcm(XCM_PRECOMPILE).weightMessage(message);
    }

    /// @notice Executes a custom XCM message through the precompile.
    /// @param message Raw XCM bytes to execute.
    /// @param maxRefTime Maximum refTime budget supplied to the precompile.
    /// @param maxProofSize Maximum proofSize budget supplied to the precompile.
    function demoExecute(
        bytes calldata message,
        uint64 maxRefTime,
        uint64 maxProofSize
    ) external onlyRole(KEEPER_ROLE) {
        uint8 outcome = IXcm(XCM_PRECOMPILE).execute(message, maxRefTime, maxProofSize);
        emit ExecuteResult(message, outcome, msg.sender);
    }

    /// @notice Weighs the built-in deterministic demo message.
    /// @return refTime Estimated reference time weight.
    /// @return proofSize Estimated proof size weight.
    function weighDefault() external view returns (uint64 refTime, uint64 proofSize) {
        return IXcm(XCM_PRECOMPILE).weightMessage(DEFAULT_MESSAGE);
    }
}
