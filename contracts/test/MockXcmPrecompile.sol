// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract MockXcmPrecompile {
    function weightMessage(bytes memory)
        external
        pure
        returns (uint64 refTime, uint64 proofSize)
    {
        return (123456, 789);
    }

    function execute(
        bytes memory,
        uint64,
        uint64
    ) external pure returns (uint8 outcome) {
        return 0;
    }
}
