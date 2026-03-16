// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/AccessControl.sol";

/// @title TokenRegistry
/// @notice Stores metadata and allowlist status for assets used by the Dotix vault.
contract TokenRegistry is AccessControl {
    struct TokenMeta {
        string name;
        string symbol;
        uint8 decimals;
        bool enabled;
    }

    mapping(address => TokenMeta) public tokens;
    mapping(address => bool) private _known;
    address[] private _tokenList;

    event TokenMetaSet(address indexed token, string symbol, bool enabled);

    /// @notice Deploys the registry with an admin that can manage token metadata.
    /// @param admin Address receiving the default admin role.
    constructor(address admin) {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
    }

    /// @notice Registers or updates metadata for a supported token.
    /// @param token Token address keyed in the registry.
    /// @param name Human-readable token name.
    /// @param symbol Short token symbol.
    /// @param decimals Token decimals used for formatting and accounting.
    /// @param enabled Whether the token is currently allowed for vault usage.
    function setTokenMeta(
        address token,
        string calldata name,
        string calldata symbol,
        uint8 decimals,
        bool enabled
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(token != address(0), "zero token");

        if (!_known[token]) {
            _known[token] = true;
            _tokenList.push(token);
        }

        tokens[token] = TokenMeta({
            name: name,
            symbol: symbol,
            decimals: decimals,
            enabled: enabled
        });

        emit TokenMetaSet(token, symbol, enabled);
    }

    /// @notice Reads the stored metadata for a token.
    /// @param token Token address to inspect.
    /// @return Metadata struct for the token.
    function getTokenMeta(address token) external view returns (TokenMeta memory) {
        return tokens[token];
    }

    /// @notice Checks whether a token is enabled for vault operations.
    /// @param token Token address to inspect.
    /// @return True when the token is enabled.
    function isEnabled(address token) external view returns (bool) {
        return tokens[token].enabled;
    }

    /// @notice Returns the full registered token list.
    /// @return Array of registered token addresses.
    function allTokens() external view returns (address[] memory) {
        return _tokenList;
    }

    /// @notice Returns the number of registered tokens.
    /// @return Count of known tokens.
    function tokenCount() external view returns (uint256) {
        return _tokenList.length;
    }

    /// @notice Returns a paginated slice of the registered token list.
    /// @param offset Zero-based starting index in the token list.
    /// @param limit Maximum number of addresses to return.
    /// @return page Token addresses in the requested page.
    function getTokens(uint256 offset, uint256 limit) external view returns (address[] memory page) {
        uint256 length = _tokenList.length;
        if (offset >= length || limit == 0) {
            return new address[](0);
        }

        uint256 end = offset + limit;
        if (end > length) {
            end = length;
        }

        page = new address[](end - offset);
        for (uint256 i = offset; i < end; i++) {
            page[i - offset] = _tokenList[i];
        }
    }
}
