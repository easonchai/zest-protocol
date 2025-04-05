// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title StabilityPool
 * @notice Handles liquidations and bonus distribution using cBTC as collateral
 */
contract StabilityPool is ReentrancyGuard, AccessControl {
    using SafeERC20 for IERC20;

    bytes32 public constant CDP_ROLE = keccak256("CDP_ROLE");
    
    IERC20 public immutable zestToken;
    
    // Liquidation bonus (5%)
    uint256 public constant BONUS_PERCENTAGE = 5;
    
    struct Deposit {
        uint256 amount;
        uint256 timestamp;
    }
    
    mapping(address => Deposit) public deposits;
    mapping(uint256 => address) public depositorList;
    uint256 public depositorCount;
    uint256 public totalDeposits;

    event DepositMade(address indexed depositor, uint256 amount);
    event DepositWithdrawn(address indexed depositor, uint256 amount);
    event LiquidationProcessed(uint256 debt, uint256 collateral);
    event BonusDistributed(address indexed receiver, uint256 amount);

    constructor(address _zestToken) {
        zestToken = IERC20(_zestToken);
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(CDP_ROLE, msg.sender);
    }

    /**
     * @notice Deposit ZEST tokens into stability pool
     * @param amount Amount to deposit
     */
    function deposit(uint256 amount) external nonReentrant {
        require(amount > 0, "Amount must be > 0");
        
        if (deposits[msg.sender].amount == 0) {
            depositorList[depositorCount] = msg.sender;
            depositorCount++;
        }
        
        deposits[msg.sender].amount += amount;
        deposits[msg.sender].timestamp = block.timestamp;
        totalDeposits += amount;
        
        zestToken.safeTransferFrom(msg.sender, address(this), amount);
        emit DepositMade(msg.sender, amount);
    }

    /**
     * @notice Withdraw ZEST tokens from stability pool
     * @param amount Amount to withdraw
     */
    function withdraw(uint256 amount) external nonReentrant {
        require(amount > 0, "Amount must be > 0");
        require(deposits[msg.sender].amount >= amount, "Insufficient deposit");
        
        deposits[msg.sender].amount -= amount;
        totalDeposits -= amount;
        
        if (deposits[msg.sender].amount == 0) {
            _removeDepositor(msg.sender);
        }
        
        zestToken.safeTransfer(msg.sender, amount);
        emit DepositWithdrawn(msg.sender, amount);
    }

    /**
     * @notice Process a liquidation, distributing cBTC collateral to depositors
     * @param debt Amount of debt to be repaid
     * @param collateral Amount of cBTC collateral to be distributed
     */
    function processLiquidation(uint256 debt, uint256 collateral) 
        external 
        payable
        onlyRole(CDP_ROLE) 
        nonReentrant 
    {
        require(msg.value == collateral, "Incorrect cBTC amount sent");
        require(totalDeposits >= debt, "Insufficient stability pool deposits");
        
        // Calculate bonus collateral (5% more)
        uint256 totalCollateralWithBonus = collateral * (100 + BONUS_PERCENTAGE) / 100;
        
        // Distribute collateral to depositors based on their share
        for (uint256 i = 0; i < depositorCount; i++) {
            address depositor = depositorList[i];
            uint256 userDeposit = deposits[depositor].amount;
            
            if (userDeposit > 0) {
                uint256 share = (userDeposit * totalCollateralWithBonus) / totalDeposits;
                if (share > 0) {
                    (bool success, ) = depositor.call{value: share}("");
                    require(success, "cBTC transfer failed");
                    emit BonusDistributed(depositor, share);
                }
            }
        }
        
        emit LiquidationProcessed(debt, collateral);
    }

    /**
     * @notice Remove a depositor from the list
     * @param depositor Address to remove
     */
    function _removeDepositor(address depositor) internal {
        for (uint256 i = 0; i < depositorCount; i++) {
            if (depositorList[i] == depositor) {
                if (i != depositorCount - 1) {
                    depositorList[i] = depositorList[depositorCount - 1];
                }
                delete depositorList[depositorCount - 1];
                depositorCount--;
                break;
            }
        }
    }

    /**
     * @notice Get all active depositors
     * @return Array of depositor addresses
     */
    function getDepositors() external view returns (address[] memory) {
        address[] memory activeDepositors = new address[](depositorCount);
        for (uint256 i = 0; i < depositorCount; i++) {
            activeDepositors[i] = depositorList[i];
        }
        return activeDepositors;
    }

    // Function to receive cBTC
    receive() external payable {}
}
