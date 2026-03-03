// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IXcm {
    function weightMessage(bytes memory message)
        external
        view
        returns (uint64 refTime, uint64 proofSize);

    function execute(
        bytes memory message,
        uint64 maxRefTime,
        uint64 maxProofSize
    ) external returns (uint8 outcome);
}
