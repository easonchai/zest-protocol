// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "forge-std/Script.sol";
import "../src/Zest.sol";
import "../src/CDPManager.sol";
import "../src/StabilityPool.sol";
import "../src/Staking.sol";
import "../src/SwapModule.sol";
import "../src/MockUSDT.sol";
import "../src/sZest.sol";

contract DeployScript is Script {
    // Test accounts
    address public constant BOB = 0x6f1524F5A1152d6b08ef8833E42E4311151e904F;

    // Initial balances for testing
    uint256 public constant INITIAL_CBTC_BALANCE = 100 ether;
    uint256 public constant INITIAL_USDT_BALANCE = 1_000_000e18;
    uint256 public constant INITIAL_ZEST_BALANCE = 1_000_000e18;
    uint256 public constant STABILITY_POOL_DEPOSIT = 500_000e18;
    uint256 public constant SWAP_MODULE_BALANCE = 100_000e18;
    uint256 public constant STAKING_BALANCE = 100_000e18;

    function run() external {
        // Retrieve deployer private key from environment
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address admin = vm.addr(deployerPrivateKey);
        
        vm.startBroadcast(deployerPrivateKey);

        // Deploy Mock USDT
        MockUSDT usdt = new MockUSDT();
        console.log("Mock USDT deployed to:", address(usdt));

        // Deploy Zest token
        Zest zest = new Zest(admin);
        console.log("Zest deployed to:", address(zest));

        // Deploy Stability Pool
        StabilityPool stabilityPool = new StabilityPool(address(zest));
        console.log("StabilityPool deployed to:", address(stabilityPool));

        // Deploy CDP Manager
        CDPManager cdpManager = new CDPManager(
            address(zest),
            address(stabilityPool)
        );
        console.log("CDPManager deployed to:", address(cdpManager));

        // Deploy sZEST token
        sZest sZestToken = new sZest(admin);
        console.log("sZEST token deployed to:", address(sZestToken));

        // Deploy Staking contract
        Staking staking = new Staking(
            address(zest),
            address(sZestToken),
            admin
        );
        console.log("Staking deployed to:", address(staking));

        // Deploy Swap Module
        SwapModule swapModule = new SwapModule(
            address(usdt),
            address(zest),
            admin
        );
        console.log("SwapModule deployed to:", address(swapModule));

        // Setup roles and permissions
        zest.grantRole(zest.MINTER_ROLE(), address(cdpManager));
        zest.grantRole(zest.MINTER_ROLE(), address(swapModule));
        stabilityPool.grantRole(stabilityPool.CDP_ROLE(), address(cdpManager));
        sZestToken.grantRole(sZestToken.MINTER_ROLE(), address(staking));

        // Set initial cBTC Price
        cdpManager.setCBTCPrice(85000e18);

        // Fund test accounts with cBTC
        vm.deal(admin, INITIAL_CBTC_BALANCE);
        vm.deal(BOB, INITIAL_CBTC_BALANCE);

        // Mint USDT to test accounts and SwapModule
        usdt.mint(admin, INITIAL_USDT_BALANCE);
        usdt.mint(BOB, INITIAL_USDT_BALANCE);
        usdt.mint(address(swapModule), INITIAL_USDT_BALANCE);

        // Mint ZEST to test accounts and contracts
        zest.mint(admin, INITIAL_ZEST_BALANCE);
        zest.mint(BOB, INITIAL_ZEST_BALANCE);
        zest.mint(address(swapModule), SWAP_MODULE_BALANCE);
        zest.mint(address(staking), STAKING_BALANCE);

        // Setup initial deposits
        zest.approve(address(stabilityPool), STABILITY_POOL_DEPOSIT);
        stabilityPool.deposit(STABILITY_POOL_DEPOSIT);

        vm.stopBroadcast();

        // Log deployment addresses and initial balances
        console.log("\nDeployment Summary:");
        console.log("-------------------");
        console.log("Mock USDT:", address(usdt));
        console.log("ZEST Token:", address(zest));
        console.log("sZEST Token:", address(sZestToken));
        console.log("CDP Manager:", address(cdpManager));
        console.log("Stability Pool:", address(stabilityPool));
        console.log("Staking:", address(staking));
        console.log("Swap Module:", address(swapModule));

        console.log("\nInitial Balances:");
        console.log("-------------------");
        console.log("Admin cBTC:", INITIAL_CBTC_BALANCE);
        console.log("Bob cBTC:", INITIAL_CBTC_BALANCE);
        console.log("Admin USDT:", INITIAL_USDT_BALANCE);
        console.log("Bob USDT:", INITIAL_USDT_BALANCE);
        console.log("Admin ZEST:", INITIAL_ZEST_BALANCE);
        console.log("Bob ZEST:", INITIAL_ZEST_BALANCE);
        console.log("SwapModule USDT:", INITIAL_USDT_BALANCE);
        console.log("SwapModule ZEST:", SWAP_MODULE_BALANCE);
        console.log("Staking ZEST:", STAKING_BALANCE);
        console.log("StabilityPool ZEST:", STABILITY_POOL_DEPOSIT);
    }
} 