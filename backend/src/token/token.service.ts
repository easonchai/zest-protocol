import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ethers } from 'ethers';
import * as ERC20ABI from './abi/ERC20.json';

@Injectable()
export class TokenService {
  private readonly logger = new Logger(TokenService.name);
  private provider: ethers.JsonRpcProvider;
  private cbtcContract: ethers.Contract;
  private zestContract: ethers.Contract;
  private usdtContract: ethers.Contract;

  constructor(private configService: ConfigService) {
    this.provider = new ethers.JsonRpcProvider(
      this.configService.get<string>('RPC_URL'),
    );

    // Initialize token contracts
    this.cbtcContract = new ethers.Contract(
      this.configService.get<string>('CBTC_CONTRACT') || '',
      ERC20ABI.abi,
      this.provider,
    );

    this.zestContract = new ethers.Contract(
      this.configService.get<string>('ZEST_CONTRACT') || '',
      ERC20ABI.abi,
      this.provider,
    );

    this.usdtContract = new ethers.Contract(
      this.configService.get<string>('USDT_CONTRACT') || '',
      ERC20ABI.abi,
      this.provider,
    );
  }

  async getCBTCBalance(address: string): Promise<bigint> {
    return await this.cbtcContract.balanceOf(address);
  }

  async getZESTBalance(address: string): Promise<bigint> {
    return await this.zestContract.balanceOf(address);
  }

  async getUSDTBalance(address: string): Promise<bigint> {
    return await this.usdtContract.balanceOf(address);
  }

  prepareCBTCTransfer(from: string, amount: string) {
    const iface = new ethers.Interface(ERC20ABI.abi);
    const data = iface.encodeFunctionData('transfer', [from, amount]);

    return {
      to: this.cbtcContract.target,
      data,
      value: '0',
    };
  }

  prepareZESTTransfer(from: string, amount: string) {
    const iface = new ethers.Interface(ERC20ABI.abi);
    const data = iface.encodeFunctionData('transfer', [from, amount]);

    return {
      to: this.zestContract.target,
      data,
      value: '0',
    };
  }

  prepareUSDTTransfer(from: string, amount: string) {
    const iface = new ethers.Interface(ERC20ABI.abi);
    const data = iface.encodeFunctionData('transfer', [from, amount]);

    return {
      to: this.usdtContract.target,
      data,
      value: '0',
    };
  }
}
