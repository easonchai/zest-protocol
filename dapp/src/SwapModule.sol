// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title SwapModule
 * @notice Handles USDT to ZEST and cBTC to ZEST swaps
 */
contract SwapModule is ReentrancyGuard, AccessControl {
    using SafeERC20 for IERC20;

    IERC20 public immutable usdtToken;
    IERC20 public immutable zestToken;
    uint256 public constant CBTC_PRICE = 85000e18; // 1 cBTC = 85,000 ZEST
    
    event Swapped(address indexed user, uint256 amount, bool isZestToUsdt);
    event CBTCSwapped(address indexed user, uint256 cbtcAmount, uint256 zestAmount);

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

    /**
     * @notice Swap cBTC for ZEST at fixed rate
     * @param cbtcAmount Amount of cBTC to swap
     * @return zestAmount Amount of ZEST received
     */
    function swapCbtcToZest(uint256 cbtcAmount) external payable nonReentrant returns (uint256) {
        require(msg.value == cbtcAmount, "Incorrect cBTC amount");
        require(cbtcAmount > 0, "Amount must be > 0");
        
        uint256 zestAmount = (cbtcAmount * CBTC_PRICE) / 1e18;
        require(zestToken.balanceOf(address(this)) >= zestAmount, "Insufficient ZEST balance");
        
        zestToken.safeTransfer(msg.sender, zestAmount);
        
        emit CBTCSwapped(msg.sender, cbtcAmount, zestAmount);
        return zestAmount;
    }
}
