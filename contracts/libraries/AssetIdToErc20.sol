// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title AssetIdToErc20
/// @notice Converts Polkadot Hub native assetId values into deterministic ERC20 precompile addresses.
/// @dev Hub TestNet precompile pattern is: 0xFFFFFFFF + 12 bytes zeros + assetId(uint32, big-endian).
/// Example: assetId 1984 (0x000007C0) => 0xFFFFFFFF000000000000000000000000000007C0.
library AssetIdToErc20 {
    uint160 internal constant PREFIX = uint160(uint256(0xFFFFFFFF) << 128);

    /// @notice Converts a Polkadot Hub asset id to its ERC20 precompile address.
    /// @param assetId Native assets pallet id.
    /// @return token ERC20-compatible precompile address for the asset.
    function toAddress(uint32 assetId) internal pure returns (address token) {
        token = address(uint160(PREFIX | uint160(assetId)));
    }
}
