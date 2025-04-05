import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ethers } from 'ethers';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import * as L2RegistrarABI from './abi/L2Registrar.json';

@Injectable()
export class ENSService implements OnModuleInit {
  private ensProvider: ethers.JsonRpcProvider;
  private l2Registrar: ethers.Contract;
  private l2RegistrarAddress: string;
  private signer: ethers.Wallet;

  constructor(
    private configService: ConfigService,
    @InjectQueue('ens') private ensQueue: Queue,
  ) {
    // Base sepolia provider for ENS
    this.ensProvider = new ethers.JsonRpcProvider(
      this.configService.get<string>('RPC_URL'),
    );
    this.l2RegistrarAddress =
      this.configService.get<string>('L2_REGISTRAR_CONTRACT') || '';
    this.signer = new ethers.Wallet(
      this.configService.get<string>('PRIVATE_KEY') || '',
      this.ensProvider,
    );
  }

  onModuleInit() {
    this.l2Registrar = new ethers.Contract(
      this.l2RegistrarAddress,
      L2RegistrarABI.abi,
      this.signer,
    );
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

  async registerName(label: string, owner: string) {
    try {
      // Check if name is available
      const isAvailable = await this.l2Registrar.available(label);
      if (!isAvailable) {
        throw new Error('Name is not available');
      }

      // Add to queue
      await this.ensQueue.add('register', {
        label,
        owner,
      });

      return {
        status: 'queued',
        message: 'Name registration has been queued',
      };
    } catch (error) {
      console.error('Error preparing ENS registration:', error);
      throw error;
    }
  }
}
