import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ethers } from 'ethers';
import * as ERC20ABI from './abi/ERC20.json';

@Injectable()
export class TokenService {
  private readonly logger = new Logger(TokenService.name);
  private provider: ethers.JsonRpcProvider;
  private zestContract: ethers.Contract;
  private usdtContract: ethers.Contract;

  constructor(private configService: ConfigService) {
    this.provider = new ethers.JsonRpcProvider(
      this.configService.get<string>('CITREA_RPC_URL'),
    );

    // Initialize token contracts
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
    return await this.provider.getBalance(address);
  }

  async getZESTBalance(address: string): Promise<bigint> {
    return await this.zestContract.balanceOf(address);
  }

  async getUSDTBalance(address: string): Promise<bigint> {
    return await this.usdtContract.balanceOf(address);
  }

  prepareCBTCTransfer(to: string, amount: string) {
    return {
      to,
      value: amount,
      data: '0x',
    };
  }

  prepareZESTTransfer(to: string, amount: string) {
    const iface = new ethers.Interface(ERC20ABI.abi);
    const data = iface.encodeFunctionData('transfer', [to, amount]);

    return {
      to: this.zestContract.target,
      data,
      value: '0',
    };
  }

  prepareUSDTTransfer(to: string, amount: string) {
    const iface = new ethers.Interface(ERC20ABI.abi);
    const data = iface.encodeFunctionData('transfer', [to, amount]);

    return {
      to: this.usdtContract.target,
      data,
      value: '0',
    };
  }
}
