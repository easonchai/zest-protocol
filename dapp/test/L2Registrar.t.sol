// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Test, console} from "forge-std/Test.sol";
import {L2Registrar} from "../src/L2Registrar.sol";

contract L2RegistrarTest is Test {
    L2Registrar public registrar;
    address admin = 0x36a279136adDde960599fcA356369C04A96D387E;

    function setUp() public {
        vm.startPrank(admin);
        registrar = new L2Registrar(0x4f339A1F489D42F4e5Da00398e6ecEa38C2f687E);
    }

    function test_Register() public {
        vm.startPrank(admin);
        registrar.register("john", vm.addr(0));
    }

    function testFail_Register() public {
        vm.startPrank(vm.addr(0));
        vm.expectRevert("Only admin can modify registry");
        registrar.register("john2", vm.addr(1));
    }
}
