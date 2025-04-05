/* eslint-disable @typescript-eslint/require-await */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ethers } from 'ethers';
import * as CDPManagerABI from './abi/CDPManager.json';
import * as StabilityPoolABI from './abi/StabilityPool.json';
import * as StakingABI from './abi/Staking.json';
import * as SwapABI from './abi/SwapModule.json';

@Injectable()
export class BlockchainService implements OnModuleInit {
  private provider: ethers.JsonRpcProvider;
  private cdpManager: ethers.Contract;
  private stabilityPool: ethers.Contract;
  private staking: ethers.Contract;
  private swap: ethers.Contract;

  constructor(private configService: ConfigService) {
    this.provider = new ethers.JsonRpcProvider(
      this.configService.get<string>('RPC_URL'),
    );
  }

  async onModuleInit() {
    // Initialize contract instances
    this.cdpManager = new ethers.Contract(
      this.configService.get<string>('CDPMANAGER_CONTRACT') || '',
      CDPManagerABI.abi,
      this.provider,
    );

    this.stabilityPool = new ethers.Contract(
      this.configService.get<string>('STABILITYPOOL_CONTRACT') || '',
      StabilityPoolABI.abi,
      this.provider,
    );

    this.staking = new ethers.Contract(
      this.configService.get<string>('STAKING_CONTRACT') || '',
      StakingABI.abi,
      this.provider,
    );

    this.swap = new ethers.Contract(
      this.configService.get<string>('SWAP_CONTRACT') || '',
      SwapABI.abi,
      this.provider,
    );
  }

  // CDP Manager functions
  async createCDP(collateral: number, debt: number, interestRate: number) {
    return this.cdpManager.openCDP(
      ethers.parseEther(collateral.toString()),
      ethers.parseEther(debt.toString()),
      interestRate,
    );
  }

  async getCDPDetails(owner: string) {
    return this.cdpManager.cdps(owner);
  }

  // Stability Pool functions
  async getStabilityPoolDeposit(depositor: string) {
    return this.stabilityPool.deposits(depositor);
  }

  async getTotalStabilityPoolDeposits() {
    return this.stabilityPool.totalDeposits();
  }

  // Staking functions
  async getStake(staker: string) {
    return this.staking.stakes(staker);
  }

  async calculateStakingReward(staker: string, amount: number) {
    return this.staking.calculateReward(
      staker,
      ethers.parseEther(amount.toString()),
    );
  }

  // Price feed (mocked for hackathon)
  async getCBTCPrice(): Promise<number> {
    if (this.configService.get<boolean>('MOCK_PRICE_FEED')) {
      return 85000; // $85,000 per cBTC
    }
    return this.cdpManager.cBTCPrice();
  }
}
