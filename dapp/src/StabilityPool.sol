// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/extensions/ERC4626.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";
import "../interfaces/IZest.sol";
import "../src/SwapModule.sol";

/**
 * @title StabilityPool
 * @notice Handles liquidations and bonus distribution using cBTC as collateral
 */
contract StabilityPool is ERC4626, AccessControl, ReentrancyGuard {
    using Math for uint256;

    bytes32 public constant CDP_ROLE = keccak256("CDP_ROLE");
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

    uint256 public constant YIELD_RATE = 5e16; // 5% APY
    uint256 public lastUpdate;
    uint256 public totalDeposited;
    uint256 public totalYield;

    SwapModule public swapModule;

    struct UserDeposit {
        uint256 amount;
        uint256 timestamp;
        uint256 lastYieldUpdate;
    }

    mapping(address => UserDeposit) public deposits;
    mapping(address => uint256) public yieldEarned;

    event Deposited(address indexed user, uint256 amount);
    event Withdrawn(address indexed user, uint256 amount);
    event YieldAccrued(address indexed user, uint256 amount);
    event LiquidationProcessed(address indexed cdp, uint256 debt, uint256 collateral, uint256 yield);

    constructor(address _zest, address _swapModule) 
        ERC4626(IERC20(_zest))
        ERC20("Staked ZEST", "sZEST") 
    {
        lastUpdate = block.timestamp;
        totalDeposited = 0;
        totalYield = 0;
        swapModule = SwapModule(_swapModule);

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
    }

    function yieldRate() public pure returns (uint256) {
        return YIELD_RATE;
    }

    function _updateYield() internal {
        if (block.timestamp > lastUpdate) {
            uint256 timeElapsed = block.timestamp - lastUpdate;
            if (totalDeposited > 0) {
                uint256 yield = (totalDeposited * YIELD_RATE * timeElapsed) / (365 days * 1e18);
                if (yield > 0) {
                    totalYield += yield;
                }
            }
            lastUpdate = block.timestamp;
        }
    }

    function _updateUserYield(address user) internal {
        if (deposits[user].amount > 0) {
            uint256 timeElapsed = block.timestamp - deposits[user].lastYieldUpdate;
            uint256 userYield = (deposits[user].amount * YIELD_RATE * timeElapsed) / (365 days * 1e18);
            if (userYield > 0) {
                yieldEarned[user] += userYield;
            }
            deposits[user].lastYieldUpdate = block.timestamp;
        }
    }

    function deposit(uint256 assets, address receiver) public override nonReentrant returns (uint256) {
        require(assets > 0, "Amount must be greater than 0");
        
        _updateYield();
        _updateUserYield(receiver);
        
        // Transfer ZEST from user
        require(IERC20(asset()).transferFrom(msg.sender, address(this), assets), "Transfer failed");
        
        // Update deposit tracking
        deposits[receiver].amount += assets;
        deposits[receiver].timestamp = block.timestamp;
        deposits[receiver].lastYieldUpdate = block.timestamp;
        totalDeposited += assets;
        
        // Mint shares
        uint256 shares = previewDeposit(assets);
        _mint(receiver, shares);
        
        emit Deposited(receiver, assets);
        return shares;
    }

    function withdraw(uint256 assets, address receiver, address owner) public override nonReentrant returns (uint256) {
        require(assets > 0, "Amount must be greater than 0");
        require(deposits[owner].amount >= assets, "Insufficient balance");
        
        _updateYield();
        _updateUserYield(owner);
        
        // Calculate yield earned
        uint256 yield = yieldEarned[owner];
        yieldEarned[owner] = 0;
        
        // Update deposit tracking
        deposits[owner].amount -= assets;
        totalDeposited -= assets;
        
        // Burn shares
        uint256 shares = previewWithdraw(assets);
        _burn(owner, shares);
        
        // Transfer ZEST and yield back to user
        require(IERC20(asset()).transfer(receiver, assets + yield), "Transfer failed");
        
        emit Withdrawn(owner, assets);
        if (yield > 0) {
            emit YieldAccrued(owner, yield);
        }
        
        return shares;
    }

    function redeem(uint256 shares, address receiver, address owner) public override nonReentrant returns (uint256) {
        require(shares > 0, "Amount must be greater than 0");
        require(balanceOf(owner) >= shares, "Insufficient shares");
        
        _updateYield();
        _updateUserYield(owner);
        
        // Calculate assets and yield
        uint256 assets = previewRedeem(shares);
        uint256 yield = yieldEarned[owner];
        yieldEarned[owner] = 0;
        
        // Update deposit tracking
        deposits[owner].amount -= assets;
        totalDeposited -= assets;
        
        // Burn shares
        _burn(owner, shares);
        
        // Transfer ZEST and yield back to user
        require(IERC20(asset()).transfer(receiver, assets + yield), "Transfer failed");
        
        emit Withdrawn(owner, assets);
        if (yield > 0) {
            emit YieldAccrued(owner, yield);
        }
        
        return assets;
    }

    function processLiquidation(uint256 debt, uint256 collateral) external payable onlyRole(CDP_ROLE) {
        require(msg.value == collateral, "Incorrect collateral amount");
        require(debt > 0, "Debt must be greater than 0");
        
        _updateYield();
        
        // Convert cBTC to ZEST using SwapModule
        uint256 zestReceived = swapModule.swapCbtcToZest{value: collateral}(collateral);
        
        // Add received ZEST to total yield
        totalYield += zestReceived;
        
        emit LiquidationProcessed(msg.sender, debt, collateral, zestReceived);
    }

    function getYield(address user, uint256 timeElapsed) public view returns (uint256) {
        if (deposits[user].amount == 0) return 0;
        return (deposits[user].amount * YIELD_RATE * timeElapsed) / (365 days * 1e18);
    }

    function totalAssets() public view override returns (uint256) {
        return totalDeposited + totalYield;
    }

    function balanceOf(address account) public view override(ERC20, IERC20) returns (uint256) {
        return deposits[account].amount;
    }

    function totalSupply() public view override(ERC20, IERC20) returns (uint256) {
        return totalDeposited;
    }
}
