import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ethers } from 'ethers';

@Injectable()
export class ENSService implements OnModuleInit {
  private ensProvider: ethers.JsonRpcProvider;
  constructor(private configService: ConfigService) {
    // Base sepolia provider for ENS
    this.ensProvider = new ethers.JsonRpcProvider(
      this.configService.get<string>('RPC_URL'),
    );
  }

  async onModuleInit() {
    // No initialization needed
  }

  async resolveName(name: string): Promise<string | null> {
    try {
      const address = await this.ensProvider.resolveName(name);
      return address;
    } catch (error) {
      console.error('Error resolving ENS name:', error);
      return null;
    }
  }

  async lookupAddress(address: string): Promise<string | null> {
    try {
      const name = await this.ensProvider.lookupAddress(address);
      return name;
    } catch (error) {
      console.error('Error looking up ENS name:', error);
      return null;
    }
  }

  async getAvatar(nameOrAddress: string): Promise<string | null> {
    try {
      const avatar = await this.ensProvider.getAvatar(nameOrAddress);
      return avatar;
    } catch (error) {
      console.error('Error getting ENS avatar:', error);
      return null;
    }
  }

  async getTextRecord(name: string, key: string): Promise<string | null> {
    try {
      const resolver = await this.ensProvider.getResolver(name);
      if (!resolver) return null;

      const text = await resolver.getText(key);
      return text;
    } catch (error) {
      console.error('Error getting ENS text record:', error);
      return null;
    }
  }
}
