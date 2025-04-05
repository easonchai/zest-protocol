// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "../interfaces/IZest.sol";

/**
 * @title Staking
 * @notice Manages ZEST staking and sZEST token distribution
 */
contract Staking is ReentrancyGuard, AccessControl {
    using SafeERC20 for IZest;

    IZest public immutable zestToken;
    IZest public immutable sZestToken;
    
    struct StakeInfo {
        uint256 amount;
        uint256 timestamp;
    }
    
    mapping(address => StakeInfo) public stakes;
    uint256 public totalStaked;
    
    // Basic APY (for hackathon purposes)
    uint256 public constant APY = 500; // 5% annual yield
    
    event Staked(address indexed user, uint256 amount);
    event Unstaked(address indexed user, uint256 amount, uint256 reward);

    constructor(address _zestToken, address _sZestToken, address admin) {
        zestToken = IZest(_zestToken);
        sZestToken = IZest(_sZestToken);
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
    }

    /**
     * @notice Stake ZEST tokens and receive sZEST
     * @param amount Amount to stake
     */
    function stake(uint256 amount) external nonReentrant {
        require(amount > 0, "Amount must be > 0");
        
        stakes[msg.sender].amount += amount;
        stakes[msg.sender].timestamp = block.timestamp;
        totalStaked += amount;
        
        zestToken.safeTransferFrom(msg.sender, address(this), amount);
        sZestToken.mint(msg.sender, amount);
        
        emit Staked(msg.sender, amount);
    }

    /**
     * @notice Unstake ZEST tokens and receive rewards
     * @param amount Amount to unstake
     */
    function unstake(uint256 amount) external nonReentrant {
        require(amount > 0, "Amount must be > 0");
        require(stakes[msg.sender].amount >= amount, "Insufficient stake");
        
        uint256 reward = calculateReward(msg.sender, amount);
        stakes[msg.sender].amount -= amount;
        totalStaked -= amount;
        
        sZestToken.burnFrom(msg.sender, amount);
        zestToken.safeTransfer(msg.sender, amount + reward);
        
        emit Unstaked(msg.sender, amount, reward);
    }

    /**
     * @notice Calculate staking reward
     * Simple calculation for hackathon purposes
     */
    function calculateReward(address user, uint256 amount) public view returns (uint256) {
        uint256 timeStaked = block.timestamp - stakes[user].timestamp;
        return (amount * APY * timeStaked) / (365 days * 10000);
    }
}
