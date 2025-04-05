// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title IStabilityPool
 * @notice Interface for the Stability Pool that handles liquidations and bonus distribution
 */
interface IStabilityPool {
    // === Events ===
    event DepositMade(address indexed depositor, uint256 amount);
    event DepositWithdrawn(address indexed depositor, uint256 amount);
    event LiquidationProcessed(
        address indexed liquidatedCDP,
        uint256 liquidatedDebt,
        uint256 liquidatedColl,
        uint256 collateralBonus
    );
    event BonusDistributed(address indexed receiver, uint256 amount);

    // === State-changing functions ===
    
    /**
     * @notice Deposit ZEST tokens into the Stability Pool
     * @param amount Amount of ZEST to deposit
     */
    function deposit(uint256 amount) external;

    /**
     * @notice Withdraw ZEST tokens from the Stability Pool
     * @param amount Amount of ZEST to withdraw
     */
    function withdraw(uint256 amount) external;

    /**
     * @notice Process liquidation of a CDP
     * @param debt Amount of debt to be covered
     * @param collateral Amount of collateral to be distributed
     */
    function processLiquidation(
        uint256 debt,
        uint256 collateral
    ) external payable;

    // === View functions ===

    /**
     * @notice Get the total ZEST deposits in the pool
     * @return Total amount of ZEST deposited
     */
    function getTotalDeposits() external view returns (uint256);

    /**
     * @notice Get the deposit amount for a specific user
     * @param depositor Address of the depositor
     * @return Amount of ZEST deposited by the user
     */
    function getDeposit(address depositor) external view returns (uint256);

    /**
     * @notice Calculate the bonus collateral for a given liquidation
     * @param collateralAmount Amount of collateral being liquidated
     * @return Bonus amount of collateral to be distributed
     */
    function calculateBonus(uint256 collateralAmount) external view returns (uint256);

    /**
     * @notice Get a list of all depositors
     * @return An array of depositor addresses
     */
    function getDepositors() external view returns (address[] memory);
}
