// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../interfaces/IXcm.sol";

contract MockXcmPrecompile {
    function weighMessage(bytes memory)
        external
        pure
        returns (IXcm.Weight memory weight)
    {
        return IXcm.Weight(123456, 789);
    }

    function execute(bytes memory, IXcm.Weight memory) external pure {}

    function send(bytes memory, bytes memory) external pure {}
}
