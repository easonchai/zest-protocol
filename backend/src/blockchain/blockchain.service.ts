/* eslint-disable @typescript-eslint/require-await */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ethers } from 'ethers';
import * as CDPManagerABI from './abi/CDPManager.json';
import * as StabilityPoolABI from './abi/StabilityPool.json';
import * as SwapABI from './abi/SwapModule.json';

@Injectable()
export class BlockchainService implements OnModuleInit {
  private provider: ethers.JsonRpcProvider;
  public cdpManagerContract: string;
  public stabilityPoolContract: string;
  public swapContract: string;
  public cdpManagerABI = CDPManagerABI.abi;
  public stabilityPoolABI = StabilityPoolABI.abi;
  public swapABI = SwapABI.abi;

  constructor(private configService: ConfigService) {
    this.provider = new ethers.JsonRpcProvider(
      this.configService.get<string>('CITREA_RPC_URL'),
    );
  }

  async onModuleInit() {
    // Store contract addresses
    this.cdpManagerContract =
      this.configService.get<string>('CDPMANAGER_CONTRACT') || '';
    this.stabilityPoolContract =
      this.configService.get<string>('STABILITYPOOL_CONTRACT') || '';
    this.swapContract = this.configService.get<string>('SWAP_CONTRACT') || '';
  }

  // Read-only functions that don't require transactions
  async getCDPDetails(owner: string) {
    const contract = new ethers.Contract(
      this.cdpManagerContract,
      this.cdpManagerABI,
      this.provider,
    );
    return contract.getCDP(owner);
  }

  async getStabilityPoolDeposit(depositor: string) {
    const stabilityPool = new ethers.Contract(
      this.stabilityPoolContract,
      this.stabilityPoolABI,
      this.provider,
    );
    return stabilityPool.deposits(depositor);
  }

  async getTotalStabilityPoolDeposits() {
    const stabilityPool = new ethers.Contract(
      this.stabilityPoolContract,
      this.stabilityPoolABI,
      this.provider,
    );
    return stabilityPool.totalDeposited();
  }

  async getStabilityPoolYield(depositor: string) {
    const stabilityPool = new ethers.Contract(
      this.stabilityPoolContract,
      this.stabilityPoolABI,
      this.provider,
    );
    return stabilityPool.yieldEarned(depositor);
  }

  async getTotalStabilityPoolYield() {
    const stabilityPool = new ethers.Contract(
      this.stabilityPoolContract,
      this.stabilityPoolABI,
      this.provider,
    );
    return stabilityPool.totalYield();
  }

  async getStabilityPoolSharePrice() {
    const stabilityPool = new ethers.Contract(
      this.stabilityPoolContract,
      this.stabilityPoolABI,
      this.provider,
    );
    const totalAssets = await stabilityPool.totalAssets();
    const totalSupply = await stabilityPool.totalSupply();
    return (BigInt(totalAssets) * BigInt(10 ** 18)) / BigInt(totalSupply);
  }

  async getSwapOutputAmount(
    fromToken: string,
    toToken: string,
    amount: bigint,
  ) {
    const contract = new ethers.Contract(
      this.swapContract,
      this.swapABI,
      this.provider,
    );
    return contract.getOutputAmount(fromToken, toToken, amount);
  }

  // Price feed (mocked for hackathon)
  async getCBTCPrice(): Promise<number> {
    if (this.configService.get<boolean>('MOCK_PRICE_FEED')) {
      return 85000; // $85,000 per cBTC
    }
    const cdpManager = new ethers.Contract(
      this.cdpManagerContract,
      this.cdpManagerABI,
      this.provider,
    );
    return cdpManager.cBTCPrice();
  }
}
