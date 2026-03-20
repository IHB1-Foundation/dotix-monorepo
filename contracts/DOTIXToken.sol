// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/// @title DOTIXToken
/// @notice ERC-20 share token minted and burned exclusively by the Dotix vault.
contract DOTIXToken is ERC20, AccessControl {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    event VaultSet(address indexed vault);

    /// @notice Deploys the DOTIX share token with an admin that can assign the minter.
    /// @param admin Address receiving the default admin role.
    constructor(address admin) ERC20("Dotix Index Token", "DOTIX") {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
    }

    /// @notice Mints DOTIX shares to a vault user.
    /// @param to Recipient of the newly minted shares.
    /// @param amount Share amount to mint.
    function mint(address to, uint256 amount) external onlyRole(MINTER_ROLE) {
        _mint(to, amount);
    }

    /// @notice Burns DOTIX shares from a vault user during redemption.
    /// @param from Holder whose shares are burned.
    /// @param amount Share amount to burn.
    function burn(address from, uint256 amount) external onlyRole(MINTER_ROLE) {
        _burn(from, amount);
    }
}
