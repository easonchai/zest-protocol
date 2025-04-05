// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "forge-std/Test.sol";
import "../src/Zest.sol";
import "../src/CDPManager.sol";
import "../src/StabilityPool.sol";
import "../src/SwapModule.sol";
import "../src/MockUSDT.sol";

contract ZestTest is Test {
    Zest public zest;
    CDPManager public cdpManager;
    StabilityPool public stabilityPool;
    SwapModule public swapModule;
    MockUSDT public usdt;

    // Test accounts
    address public admin = address(1);
    address public alice = address(2);
    address public bob = address(3);
    address public carol = address(4);

    // Constants
    uint256 public constant INITIAL_CBTC_BALANCE = 100 ether;
    uint256 public constant INITIAL_USDT_BALANCE = 100_000e18;
    uint256 public constant CBTC_PRICE = 85000e18; // $85,000 per cBTC
    uint256 public constant LIQUIDATION_CBTC_PRICE = 40000e18; // $40,000 per cBTC (below liquidation threshold)

    function setUp() public {
        // Setup accounts with initial balances
        vm.deal(alice, INITIAL_CBTC_BALANCE);
        vm.deal(bob, INITIAL_CBTC_BALANCE);
        vm.deal(carol, INITIAL_CBTC_BALANCE);

        // Deploy mock USDT
        usdt = new MockUSDT();
        
        // Mint USDT to test accounts
        usdt.mint(alice, INITIAL_USDT_BALANCE);
        usdt.mint(bob, INITIAL_USDT_BALANCE);
        usdt.mint(carol, INITIAL_USDT_BALANCE);

        // Deploy protocol contracts
        vm.startPrank(admin);
        
        // Deploy main token
        zest = new Zest(admin);
        
        // Deploy Swap Module
        swapModule = new SwapModule(address(usdt), address(zest), admin);
        
        // Deploy Stability Pool
        stabilityPool = new StabilityPool(address(zest), address(swapModule));
        
        // Deploy CDP Manager
        cdpManager = new CDPManager(address(zest), address(stabilityPool));

        // Setup roles
        zest.grantRole(zest.MINTER_ROLE(), address(cdpManager));
        zest.grantRole(zest.MINTER_ROLE(), address(swapModule));
        stabilityPool.grantRole(stabilityPool.CDP_ROLE(), address(cdpManager));
        stabilityPool.grantRole(stabilityPool.CDP_ROLE(), bob);

        // Set initial cBTC price
        cdpManager.setCBTCPrice(CBTC_PRICE);
        
        vm.stopPrank();
    }

    function testStakingDeposit() public {
        vm.startPrank(admin);
        zest.mint(alice, 100 * 10**18);
        vm.stopPrank();

        vm.startPrank(alice);
        uint256 depositAmount = 100 * 10**18;
        zest.approve(address(stabilityPool), depositAmount);
        stabilityPool.deposit(depositAmount, alice);
        
        // Check balances
        assertEq(zest.balanceOf(alice), 0);
        assertEq(stabilityPool.balanceOf(alice), depositAmount);
        assertEq(stabilityPool.totalAssets(), depositAmount);
        
        vm.stopPrank();
    }

    function testStakingWithdraw() public {
        vm.startPrank(admin);
        zest.mint(alice, 100 * 10**18);
        vm.stopPrank();

        vm.startPrank(alice);
        uint256 depositAmount = 100 * 10**18;
        zest.approve(address(stabilityPool), depositAmount);
        stabilityPool.deposit(depositAmount, alice);
        
        // Fast forward 1 year
        vm.warp(block.timestamp + 365 days);
        
        // Calculate expected yield and mint it to the pool
        uint256 expectedYield = (depositAmount * stabilityPool.yieldRate() * 365 days) / (365 days * 1e18);
        vm.startPrank(admin);
        zest.mint(address(stabilityPool), expectedYield);
        vm.stopPrank();
        
        // Withdraw
        vm.startPrank(alice);
        stabilityPool.withdraw(depositAmount, alice, alice);
        
        // Check balances
        assertEq(zest.balanceOf(alice), depositAmount + expectedYield);
        assertEq(stabilityPool.balanceOf(alice), 0);
        
        vm.stopPrank();
    }

    function testStakingWithStabilityPool() public {
        // Test CDP liquidation with staking
        vm.startPrank(admin);
        zest.mint(alice, 100 * 10**18);
        zest.mint(address(swapModule), 1_000_000e18); // Fund swap module for liquidation
        vm.stopPrank();

        vm.startPrank(alice);
        uint256 depositAmount = 100 * 10**18;
        zest.approve(address(stabilityPool), depositAmount);
        stabilityPool.deposit(depositAmount, alice);
        
        // Bob opens a CDP
        vm.stopPrank();
        vm.startPrank(bob);
        uint256 cdpDeposit = 10 ether;
        uint256 borrowAmount = 500000e18;
        
        cdpManager.openCDP{value: cdpDeposit}(cdpDeposit, borrowAmount, 1);
        
        // Price drops and triggers liquidation
        vm.stopPrank();
        vm.prank(admin);
        cdpManager.setCBTCPrice(LIQUIDATION_CBTC_PRICE);
        
        // Process liquidation
        vm.prank(bob);
        cdpManager.liquidate(bob);
        
        // Check staking received yield from liquidation
        uint256 yield = stabilityPool.totalAssets() - depositAmount;
        assertGt(yield, 0, "Staking should have received yield from liquidation");
        
        vm.stopPrank();
    }

    function testLiquidationWithCBTC() public {
        // Setup initial state
        vm.startPrank(admin);
        zest.mint(address(swapModule), 1_000_000e18); // Fund swap module with ZEST
        vm.stopPrank();

        // Bob opens a CDP
        vm.startPrank(bob);
        uint256 collateral = 1 ether; // 1 cBTC
        uint256 debt = 50000e18; // 50,000 ZEST
        cdpManager.openCDP{value: collateral}(collateral, debt, 1);
        vm.stopPrank();

        // Alice deposits into stability pool
        vm.startPrank(admin);
        zest.mint(alice, 100_000e18);
        vm.stopPrank();

        vm.startPrank(alice);
        uint256 depositAmount = 100_000e18;
        zest.approve(address(stabilityPool), depositAmount);
        stabilityPool.deposit(depositAmount, alice);
        vm.stopPrank();

        // Process liquidation
        vm.startPrank(bob);
        uint256 liquidationCollateral = 0.5 ether; // 0.5 cBTC
        stabilityPool.processLiquidation{value: liquidationCollateral}(debt, liquidationCollateral);
        vm.stopPrank();

        // Verify results
        uint256 expectedZest = (liquidationCollateral * 85000e18) / 1e18; // 42,500 ZEST
        assertEq(stabilityPool.totalYield(), expectedZest, "Total yield should match expected ZEST amount");
        assertEq(stabilityPool.totalAssets(), depositAmount + expectedZest, "Total assets should include yield");
    }
}

// Mock ERC20 for USDT
contract MockERC20 is ERC20 {
    constructor(string memory name, string memory symbol, uint8 decimals) 
        ERC20(name, symbol) 
    {}

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
} 