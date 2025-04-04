// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Script, console} from "forge-std/Script.sol";
import {L2Registrar} from "../src/L2Registrar.sol";

contract L2RegistrarScript is Script {
    L2Registrar public registrar;

    function setUp() public {}

    function run() public {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");

        vm.startBroadcast(deployerPrivateKey);

        registrar = new L2Registrar(0x4f339A1F489D42F4e5Da00398e6ecEa38C2f687E);

        vm.stopBroadcast();
    }
}
