// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "forge-std/Test.sol";
import "../src/Zest.sol";
import "../src/CDPManager.sol";
import "../src/StabilityPool.sol";
import "../src/Staking.sol";
import "../src/SwapModule.sol";
import "../src/MockUSDT.sol";
import "../src/sZest.sol";

contract ZestTest is Test {
    Zest public zest;
    CDPManager public cdpManager;
    StabilityPool public stabilityPool;
    Staking public staking;
    SwapModule public swapModule;
    MockUSDT public usdt;
    sZest public sZestToken;

    // Test accounts
    address public admin = address(1);
    address public alice = address(2);
    address public bob = address(3);
    address public carol = address(4);

    // Constants
    uint256 public constant INITIAL_CBTC_BALANCE = 100 ether;
    uint256 public constant INITIAL_USDT_BALANCE = 100_000e18;
    uint256 public constant CBTC_PRICE = 85000e18; // $85,000 per cBTC
    uint256 public constant LIQUIDATION_CBTC_PRICE = 48000e18; // $70,000 per cBTC (below liquidation threshold)

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
        
        // Deploy Stability Pool
        stabilityPool = new StabilityPool(address(zest));
        
        // Deploy CDP Manager
        cdpManager = new CDPManager(address(zest), address(stabilityPool));
        
        // Deploy sZEST token
        sZestToken = new sZest(admin);
        
        // Deploy Staking contract
        staking = new Staking(address(zest), address(sZestToken), admin);
        
        // Deploy Swap Module
        swapModule = new SwapModule(address(usdt), address(zest), admin);

        // Setup roles
        zest.grantRole(zest.MINTER_ROLE(), address(cdpManager));
        zest.grantRole(zest.MINTER_ROLE(), address(swapModule));
        stabilityPool.grantRole(stabilityPool.CDP_ROLE(), address(cdpManager));
        stabilityPool.grantRole(stabilityPool.CDP_ROLE(), bob);
        sZestToken.grantRole(sZestToken.MINTER_ROLE(), address(staking));

        // Set initial cBTC price
        cdpManager.setCBTCPrice(CBTC_PRICE);
        
        vm.stopPrank();
    }

    function testFullProtocolFlow() public {
        // Test 1: Alice opens a CDP
        vm.startPrank(alice);
        
        uint256 depositAmount = 10 ether;
        uint256 borrowAmount = 500000e18; // $500,000 worth of ZEST (with cBTC at $85,000)
        // Collateral value = 10 * 85000 = $850,000
        // Collateral ratio = 850,000 / 500,000 = 170% (above minimum 150%)
        
        // Open CDP
        cdpManager.openCDP{value: depositAmount}(depositAmount, borrowAmount, 1); // 1 bps interest rate
        
        assertEq(address(cdpManager).balance, depositAmount, "CDP Manager should have cBTC");
        assertEq(zest.balanceOf(alice), borrowAmount, "Alice should have ZEST");
        
        // Add more debt to make CDP unsafe at lower price
        uint256 additionalDebt = 50000e18; // Add $50,000 more debt
        cdpManager.mintDebt(additionalDebt);
        
        vm.stopPrank();

        // Test 2: Bob provides liquidity to Stability Pool
        vm.startPrank(admin);
        // Mint ZEST to Bob for stability pool deposit
        zest.mint(bob, 5000e18);
        vm.stopPrank();

        vm.startPrank(bob);
        
        uint256 stabilityDeposit = 5000e18;
        zest.approve(address(stabilityPool), stabilityDeposit);
        stabilityPool.deposit(stabilityDeposit);
        
        (uint256 amount,) = stabilityPool.deposits(bob);
        assertEq(amount, stabilityDeposit, "Bob's deposit should be recorded");
        
        vm.stopPrank();

        // Test 3: Carol stakes ZEST
        vm.startPrank(admin);
        // Mint ZEST to Carol for staking
        zest.mint(carol, 1000e18);
        // Mint ZEST to SwapModule for USDT-ZEST swaps
        zest.mint(address(swapModule), 10000e18);
        vm.stopPrank();

        vm.startPrank(carol);
        
        // First swap USDT for ZEST
        uint256 swapAmount = 1000e18;
        usdt.approve(address(swapModule), swapAmount);
        swapModule.swapUsdtForZest(swapAmount);
        
        // Then stake ZEST
        zest.approve(address(staking), swapAmount);
        staking.stake(swapAmount);
        
        vm.stopPrank();

        // Test 4: Alice repays part of her debt
        vm.startPrank(alice);
        
        uint256 repayAmount = 100000e18; // Repay $100,000 worth of ZEST
        zest.approve(address(cdpManager), repayAmount);
        cdpManager.repayDebt(repayAmount);
        
        (, uint256 aliceDebt,,) = cdpManager.cdps(alice);
        assertEq(aliceDebt, borrowAmount + additionalDebt - repayAmount, "Alice's debt should be reduced");
        
        vm.stopPrank();

        // Test 5: Price drop and liquidation
        vm.startPrank(admin);
        
        // Drop cBTC price to $48,000, making Alice's CDP unsafe
        // With 10 cBTC collateral and 450,000 ZEST debt:
        // Collateral value = 10 * 48000 = 480,000 USD
        // Collateral ratio = 450,000 / 480,000 = 93%
        // But liquidation threshold is 91%, so this should trigger liquidation
        cdpManager.setCBTCPrice(LIQUIDATION_CBTC_PRICE);
        
        vm.stopPrank();

        // Bob liquidates Alice's CDP
        vm.prank(bob);
        cdpManager.liquidate(alice);

        // Verify liquidation results
        assertEq(address(cdpManager).balance, 0, "CDP Manager should have no cBTC");
        assertGt(address(stabilityPool).balance, 0, "Stability Pool should have received cBTC");
    }

    function testCDPOperations() public {
        vm.startPrank(alice);
        
        // Open CDP
        uint256 depositAmount = 5 ether;
        uint256 borrowAmount = 7500e18; // $7500 worth of ZEST
        
        cdpManager.openCDP{value: depositAmount}(depositAmount, borrowAmount, 1);
        
        // Add more collateral
        cdpManager.addCollateral{value: 2 ether}(2 ether);
        
        // Mint more debt
        cdpManager.mintDebt(3000e18);
        
        // Withdraw some collateral
        cdpManager.withdrawCollateral(1 ether);
        
        // Repay some debt
        uint256 repayAmount = 5000e18;
        zest.approve(address(cdpManager), repayAmount);
        cdpManager.repayDebt(repayAmount);
        
        vm.stopPrank();
    }

    function testStabilityPoolOperations() public {
        // Setup initial ZEST balance for Bob
        vm.startPrank(admin);
        zest.mint(bob, 10000e18);
        vm.stopPrank();

        vm.startPrank(bob);
        
        // Deposit to Stability Pool
        zest.approve(address(stabilityPool), 5000e18);
        stabilityPool.deposit(5000e18);
        
        // Withdraw partial amount
        stabilityPool.withdraw(2000e18);
        
        // Check remaining balance
        (uint256 remainingDeposit,) = stabilityPool.deposits(bob);
        assertEq(remainingDeposit, 3000e18, "Remaining deposit should be correct");
        
        vm.stopPrank();
    }

    function testStakingOperations() public {
        // Setup initial ZEST balance for Carol
        vm.startPrank(admin);
        zest.mint(carol, 10000e18);
        vm.stopPrank();

        vm.startPrank(carol);
        
        // Stake ZEST
        zest.approve(address(staking), 5000e18);
        staking.stake(5000e18);
        
        // Approve sZEST for unstaking
        sZestToken.approve(address(staking), 2500e18);
        
        // Wait some time to accrue rewards
        skip(30 days);
        
        // Unstake with rewards
        staking.unstake(2500e18);
        
        // Verify reward calculation
        uint256 reward = staking.calculateReward(carol, 2500e18);
        assertGt(reward, 0, "Should have earned staking rewards");
        
        vm.stopPrank();
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