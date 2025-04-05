// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title IZest Interface
 * @notice Interface for Zest stablecoin with additional functionality
 */
interface IZest is IERC20 {
    /**
     * @notice Mint new tokens (only callable by minter role)
     * @param to Address to receive the tokens
     * @param amount Amount of tokens to mint
     */
    function mint(address to, uint256 amount) external;

    /**
     * @notice Burns a specific amount of tokens from the caller's account
     * @param amount The amount of tokens to burn
     */
    function burn(uint256 amount) external;

    /**
     * @notice Burns tokens from a specific account
     * @param account The account to burn tokens from
     * @param amount The amount of tokens to burn
     */
    function burnFrom(address account, uint256 amount) external;

    /**
     * @notice Pause token transfers
     */
    function pause() external;

    /**
     * @notice Unpause token transfers
     */
    function unpause() external;

    /**
     * @notice Checks if an account has a specific role
     * @param role The role to check
     * @param account The account to check
     * @return bool True if the account has the role
     */
    function hasRole(bytes32 role, address account) external view returns (bool);

    /**
     * @notice Returns whether the token is paused
     * @return bool True if the token is paused
     */
    function paused() external view returns (bool);

    /**
     * @notice The hash of the minter role
     */
    function MINTER_ROLE() external view returns (bytes32);

    /**
     * @notice The hash of the pauser role
     */
    function PAUSER_ROLE() external view returns (bytes32);
} 