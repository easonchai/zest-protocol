// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "./Zest.sol";
import "../interfaces/IStabilityPool.sol";

/**
 * @title CDPManager
 * @notice Manages Collateralized Debt Positions using cBTC as collateral
 */
contract CDPManager is ReentrancyGuard, AccessControl {
    // Constants based on PRD specifications
    uint256 public constant MINIMUM_COLLATERAL_RATIO = 150; // 150%
    uint256 public constant LIQUIDATION_THRESHOLD = 91; // 91%
    
    // State variables
    Zest public immutable zestToken;
    IStabilityPool public immutable stabilityPool;
    
    // Mock price for hackathon (in USD with 18 decimals)
    uint256 public cBTCPrice = 30_000 * 1e18;
    
    struct CDP {
        uint256 collateral;        // Amount of cBTC
        uint256 debt;             // Amount of ZEST
        uint256 interestRate;     // Interest rate in basis points per second
        uint256 lastInterestAccrual;  // Timestamp of last interest accrual
    }
    
    mapping(address => CDP) public cdps;
    uint256 public totalCollateral;
    uint256 public totalDebt;

    // Events
    event CDPOpened(address indexed owner, uint256 collateral, uint256 debt);
    event CollateralAdded(address indexed owner, uint256 amount);
    event CollateralWithdrawn(address indexed owner, uint256 amount);
    event DebtMinted(address indexed owner, uint256 amount);
    event DebtRepaid(address indexed owner, uint256 amount);
    event CDPLiquidated(address indexed owner, uint256 debt, uint256 collateral);
    event InterestAccrued(address indexed owner, uint256 amount);

    constructor(
        address _zestToken,
        address _stabilityPool
    ) {
        zestToken = Zest(_zestToken);
        stabilityPool = IStabilityPool(_stabilityPool);
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    /**
     * @notice Opens a new CDP with initial collateral and debt
     * @param collateralAmount Amount of cBTC to deposit
     * @param debtAmount Amount of ZEST to mint
     * @param interestRate Interest rate in basis points per second
     */
    function openCDP(
        uint256 collateralAmount,
        uint256 debtAmount,
        uint256 interestRate
    ) external payable nonReentrant {
        require(msg.value == collateralAmount, "Incorrect cBTC amount sent");
        require(collateralAmount > 0, "Collateral must be > 0");
        require(debtAmount > 0, "Debt must be > 0");
        require(cdps[msg.sender].collateral == 0, "CDP already exists");
        
        // Check if collateralization ratio is sufficient
        require(
            _getCollateralRatio(collateralAmount, debtAmount) >= MINIMUM_COLLATERAL_RATIO,
            "Insufficient collateral ratio"
        );
        
        // Create CDP
        cdps[msg.sender] = CDP({
            collateral: collateralAmount,
            debt: debtAmount,
            interestRate: interestRate,
            lastInterestAccrual: block.timestamp
        });

        // Mint ZEST
        zestToken.mint(msg.sender, debtAmount);
        
        // Update totals
        totalCollateral += collateralAmount;
        totalDebt += debtAmount;

        emit CDPOpened(msg.sender, collateralAmount, debtAmount);
    }

    /**
     * @notice Add collateral to existing CDP
     * @param amount Amount of cBTC to add
     */
    function addCollateral(uint256 amount) external payable nonReentrant {
        require(msg.value == amount, "Incorrect cBTC amount sent");
        require(amount > 0, "Amount must be > 0");
        require(cdps[msg.sender].collateral > 0, "CDP doesn't exist");

        _accrueInterest(msg.sender);
        
        cdps[msg.sender].collateral += amount;
        totalCollateral += amount;

        emit CollateralAdded(msg.sender, amount);
    }

    /**
     * @notice Withdraw collateral if position remains safe
     * @param amount Amount of cBTC to withdraw
     */
    function withdrawCollateral(uint256 amount) external nonReentrant {
        require(amount > 0, "Amount must be > 0");
        CDP storage cdp = cdps[msg.sender];
        require(cdp.collateral >= amount, "Insufficient collateral");

        _accrueInterest(msg.sender);
        
        uint256 newCollateral = cdp.collateral - amount;
        require(
            _getCollateralRatio(newCollateral, cdp.debt) >= MINIMUM_COLLATERAL_RATIO,
            "Withdrawal would undercollateralize CDP"
        );

        cdp.collateral = newCollateral;
        totalCollateral -= amount;
        
        (bool success, ) = msg.sender.call{value: amount}("");
        require(success, "cBTC transfer failed");

        emit CollateralWithdrawn(msg.sender, amount);
    }

    /**
     * @notice Mint additional ZEST against existing CDP
     * @param amount Amount of ZEST to mint
     */
    function mintDebt(uint256 amount) external nonReentrant {
        require(amount > 0, "Amount must be > 0");
        CDP storage cdp = cdps[msg.sender];
        require(cdp.collateral > 0, "CDP doesn't exist");

        _accrueInterest(msg.sender);
        
        uint256 newDebt = cdp.debt + amount;
        require(
            _getCollateralRatio(cdp.collateral, newDebt) >= MINIMUM_COLLATERAL_RATIO,
            "Insufficient collateral for minting"
        );

        cdp.debt = newDebt;
        totalDebt += amount;
        zestToken.mint(msg.sender, amount);

        emit DebtMinted(msg.sender, amount);
    }

    /**
     * @notice Repay ZEST debt
     * @param amount Amount of ZEST to repay
     */
    function repayDebt(uint256 amount) external nonReentrant {
        require(amount > 0, "Amount must be > 0");
        CDP storage cdp = cdps[msg.sender];
        require(cdp.debt >= amount, "Amount exceeds debt");

        _accrueInterest(msg.sender);
        
        cdp.debt -= amount;
        totalDebt -= amount;
        zestToken.burnFrom(msg.sender, amount);

        emit DebtRepaid(msg.sender, amount);
    }

    /**
     * @notice Liquidate an unsafe CDP
     * @param owner Address of the CDP owner
     */
    function liquidate(address owner) external nonReentrant {
        CDP storage cdp = cdps[owner];
        require(cdp.collateral > 0, "CDP doesn't exist");

        _accrueInterest(owner);
        
        uint256 collateralRatio = _getCollateralRatio(cdp.collateral, cdp.debt);
        require(collateralRatio < LIQUIDATION_THRESHOLD, "CDP is safe");

        uint256 collateralToLiquidate = cdp.collateral;
        uint256 debtToRepay = cdp.debt;

        // Clear the CDP
        delete cdps[owner];
        totalCollateral -= collateralToLiquidate;
        totalDebt -= debtToRepay;

        // Process liquidation and transfer collateral in one call
        stabilityPool.processLiquidation{value: collateralToLiquidate}(debtToRepay, collateralToLiquidate);

        emit CDPLiquidated(owner, debtToRepay, collateralToLiquidate);
    }

    /**
     * @notice Accrue interest on a CDP
     * @param owner Address of the CDP owner
     */
    function _accrueInterest(address owner) internal {
        CDP storage cdp = cdps[owner];
        if (cdp.debt > 0) {
            uint256 timePassed = block.timestamp - cdp.lastInterestAccrual;
            if (timePassed > 0) {
                uint256 interest = (cdp.debt * cdp.interestRate * timePassed) / 10000;
                cdp.debt += interest;
                totalDebt += interest;
                cdp.lastInterestAccrual = block.timestamp;
                emit InterestAccrued(owner, interest);
            }
        }
    }

    /**
     * @notice Calculate collateral ratio
     * @param collateralAmount Amount of collateral
     * @param debtAmount Amount of debt
     * @return Collateral ratio (in percentage)
     */
    function _getCollateralRatio(uint256 collateralAmount, uint256 debtAmount) 
        internal 
        view 
        returns (uint256) 
    {
        if (debtAmount == 0) return type(uint256).max;
        uint256 collateralValue = (collateralAmount * cBTCPrice) / 1e18;
        return (collateralValue * 100) / debtAmount;
    }

    // Admin functions for hackathon purposes
    function setCBTCPrice(uint256 newPrice) external onlyRole(DEFAULT_ADMIN_ROLE) {
        cBTCPrice = newPrice;
    }

    // Function to receive cBTC
    receive() external payable {}
}
