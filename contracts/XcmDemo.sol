// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/AccessControl.sol";

import "./interfaces/IXcm.sol";

contract XcmDemo is AccessControl {
    bytes32 public constant KEEPER_ROLE = keccak256("KEEPER_ROLE");

    address public constant XCM_PRECOMPILE = 0x00000000000000000000000000000000000a0000;

    // XCM v3 demo payload for deterministic weigh/execute demos.
    bytes public constant DEFAULT_MESSAGE = hex"03020100";

    event WeighResult(bytes message, uint64 refTime, uint64 proofSize);
    event ExecuteResult(bytes message, uint8 outcome, address executor);

    constructor(address admin) {
      _grantRole(DEFAULT_ADMIN_ROLE, admin);
      _grantRole(KEEPER_ROLE, admin);
    }

    function demoWeigh(bytes calldata message)
        external
        view
        returns (uint64 refTime, uint64 proofSize)
    {
        return IXcm(XCM_PRECOMPILE).weightMessage(message);
    }

    function demoExecute(
        bytes calldata message,
        uint64 maxRefTime,
        uint64 maxProofSize
    ) external onlyRole(KEEPER_ROLE) {
        uint8 outcome = IXcm(XCM_PRECOMPILE).execute(message, maxRefTime, maxProofSize);
        emit ExecuteResult(message, outcome, msg.sender);
    }

    function weighDefault() external view returns (uint64 refTime, uint64 proofSize) {
        return IXcm(XCM_PRECOMPILE).weightMessage(DEFAULT_MESSAGE);
    }
}
