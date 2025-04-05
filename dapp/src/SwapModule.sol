// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title SwapModule
 * @notice Handles 1:1 USDT to ZEST swaps
 */
contract SwapModule is ReentrancyGuard, AccessControl {
    using SafeERC20 for IERC20;

    IERC20 public immutable usdtToken;
    IERC20 public immutable zestToken;
    
    event Swapped(address indexed user, uint256 amount, bool isZestToUsdt);

    constructor(address _usdtToken, address _zestToken, address admin) {
        usdtToken = IERC20(_usdtToken);
        zestToken = IERC20(_zestToken);
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
    }

    /**
     * @notice Swap USDT for ZEST 1:1
     * @param amount Amount to swap
     */
    function swapUsdtForZest(uint256 amount) external nonReentrant {
        require(amount > 0, "Amount must be > 0");
        
        usdtToken.safeTransferFrom(msg.sender, address(this), amount);
        zestToken.safeTransfer(msg.sender, amount);
        
        emit Swapped(msg.sender, amount, false);
    }

    /**
     * @notice Swap ZEST for USDT 1:1
     * @param amount Amount to swap
     */
    function swapZestForUsdt(uint256 amount) external nonReentrant {
        require(amount > 0, "Amount must be > 0");
        
        zestToken.safeTransferFrom(msg.sender, address(this), amount);
        usdtToken.safeTransfer(msg.sender, amount);
        
        emit Swapped(msg.sender, amount, true);
    }
}
