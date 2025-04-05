// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "forge-std/Script.sol";
import "../src/Zest.sol";
import "../src/CDPManager.sol";
import "../src/StabilityPool.sol";
import "../src/SwapModule.sol";
import "../src/MockUSDT.sol";

contract DeployScript is Script {
    // Initial balances for contracts
    uint256 public constant INITIAL_USDT_BALANCE = 1_000_000e18;
    uint256 public constant INITIAL_ZEST_BALANCE = 1_000_000e18;
    uint256 public constant SWAP_MODULE_BALANCE = 1_000_000e18;
    uint256 public constant STABILITY_POOL_DEPOSIT = 500_000e18;
    uint256 public constant CBTC_PRICE = 85000e18; // $85,000 per cBTC

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

        // Deploy Swap Module
        SwapModule swapModule = new SwapModule(
            address(usdt),
            address(zest),
            admin
        );
        console.log("SwapModule deployed to:", address(swapModule));

        // Deploy Stability Pool
        StabilityPool stabilityPool = new StabilityPool(
            address(zest),
            address(swapModule)
        );
        console.log("StabilityPool deployed to:", address(stabilityPool));

        // Deploy CDP Manager
        CDPManager cdpManager = new CDPManager(
            address(zest),
            address(stabilityPool)
        );
        console.log("CDPManager deployed to:", address(cdpManager));

        // Setup roles and permissions
        zest.grantRole(zest.MINTER_ROLE(), address(cdpManager));
        zest.grantRole(zest.MINTER_ROLE(), address(swapModule));
        stabilityPool.grantRole(stabilityPool.CDP_ROLE(), address(cdpManager));

        // Set initial cBTC Price
        cdpManager.setCBTCPrice(CBTC_PRICE);

        // Fund contracts with USDT
        usdt.mint(address(swapModule), INITIAL_USDT_BALANCE);

        usdt.mint(admin, INITIAL_USDT_BALANCE);
        zest.mint(admin, INITIAL_ZEST_BALANCE);

        // Fund contracts with ZEST
        zest.mint(address(swapModule), SWAP_MODULE_BALANCE);
        zest.mint(admin, STABILITY_POOL_DEPOSIT);

        // Setup initial deposits
        zest.approve(address(stabilityPool), STABILITY_POOL_DEPOSIT);
        stabilityPool.deposit(STABILITY_POOL_DEPOSIT, admin);

        vm.stopBroadcast();

        // Log deployment addresses and initial balances
        console.log("\nDeployment Summary:");
        console.log("-------------------");
        console.log("Mock USDT:", address(usdt));
        console.log("ZEST Token:", address(zest));
        console.log("CDP Manager:", address(cdpManager));
        console.log("Stability Pool:", address(stabilityPool));
        console.log("Swap Module:", address(swapModule));

        console.log("\nInitial Balances:");
        console.log("-------------------");
        console.log("SwapModule USDT:", INITIAL_USDT_BALANCE);
        console.log("SwapModule ZEST:", SWAP_MODULE_BALANCE);
        console.log("StabilityPool ZEST:", STABILITY_POOL_DEPOSIT);
    }
} 