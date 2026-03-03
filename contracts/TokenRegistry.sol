// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/AccessControl.sol";

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

    constructor(address admin) {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
    }

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

    function getTokenMeta(address token) external view returns (TokenMeta memory) {
        return tokens[token];
    }

    function isEnabled(address token) external view returns (bool) {
        return tokens[token].enabled;
    }

    function allTokens() external view returns (address[] memory) {
        return _tokenList;
    }
}
