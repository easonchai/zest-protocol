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
    function run() external {
        // Retrieve deployer private key from environment
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        
        vm.startBroadcast(deployerPrivateKey);

        // Deploy Mock USDT
        MockUSDT usdt = new MockUSDT();
        console.log("Mock USDT deployed to:", address(usdt));

        // Deploy Zest token
        Zest zest = new Zest(msg.sender);
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
        sZest sZestToken = new sZest(msg.sender);
        console.log("sZEST token deployed to:", address(sZestToken));

        // Deploy Staking contract
        Staking staking = new Staking(
            address(zest),
            address(sZestToken),
            msg.sender
        );
        console.log("Staking deployed to:", address(staking));

        // Deploy Swap Module
        SwapModule swapModule = new SwapModule(
            address(usdt),
            address(zest),
            msg.sender
        );
        console.log("SwapModule deployed to:", address(swapModule));

        // Setup roles and permissions
        zest.grantRole(zest.MINTER_ROLE(), address(cdpManager));
        zest.grantRole(zest.MINTER_ROLE(), address(swapModule));
        stabilityPool.grantRole(stabilityPool.CDP_ROLE(), address(cdpManager));
        sZestToken.grantRole(sZestToken.MINTER_ROLE(), address(staking));

        // Set initial cBTC Price
        cdpManager.setCBTCPrice(85000e18);

        vm.stopBroadcast();

        // Log deployment addresses for verification
        console.log("\nDeployment Summary:");
        console.log("-------------------");
        console.log("Mock USDT:", address(usdt));
        console.log("ZEST Token:", address(zest));
        console.log("sZEST Token:", address(sZestToken));
        console.log("CDP Manager:", address(cdpManager));
        console.log("Stability Pool:", address(stabilityPool));
        console.log("Staking:", address(staking));
        console.log("Swap Module:", address(swapModule));
    }
} 