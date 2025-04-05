import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ethers } from 'ethers';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import * as L2RegistrarABI from './abi/L2Registrar.json';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ENSService implements OnModuleInit {
  private baseProvider: ethers.JsonRpcProvider;
  private ethProvider: ethers.JsonRpcProvider;
  private l2Registrar: ethers.Contract;
  private l2RegistrarAddress: string;
  private signer: ethers.Wallet;
  private readonly DOMAIN_SUFFIX = '.zest';
  private readonly FULL_DOMAIN_SUFFIX = '.zest.eth';

  constructor(
    private configService: ConfigService,
    @InjectQueue('ens') private ensQueue: Queue,
    private prisma: PrismaService,
  ) {
    // Base sepolia provider for registry/registrar
    this.baseProvider = new ethers.JsonRpcProvider(
      this.configService.get<string>('BASE_RPC_URL'),
    );

    // ETH sepolia provider for resolution
    this.ethProvider = new ethers.JsonRpcProvider(
      this.configService.get<string>('ENS_RPC_URL'),
    );

    this.l2RegistrarAddress =
      this.configService.get<string>('L2_REGISTRAR_CONTRACT') || '';
    this.signer = new ethers.Wallet(
      this.configService.get<string>('PRIVATE_KEY') || '',
      this.baseProvider,
    );
  }

  onModuleInit() {
    this.l2Registrar = new ethers.Contract(
      this.l2RegistrarAddress,
      L2RegistrarABI.abi,
      this.signer,
    );
  }

  private formatNameForDB(label: string): string {
    return `${label}${this.DOMAIN_SUFFIX}`;
  }

  private formatNameForENS(label: string): string {
    return `${label}${this.FULL_DOMAIN_SUFFIX}`;
  }

  async resolveName(name: string): Promise<string | null> {
    try {
      // If name already has .zest suffix, use it directly
      const fullName = name.endsWith(this.DOMAIN_SUFFIX)
        ? name.replace(this.DOMAIN_SUFFIX, this.FULL_DOMAIN_SUFFIX)
        : this.formatNameForENS(name);

      const address = await this.ethProvider.resolveName(fullName);
      return address;
    } catch (error) {
      console.error('Error resolving ENS name:', error);
      return null;
    }
  }

  async lookupAddress(address: string): Promise<string | null> {
    try {
      const ensRecord = await this.prisma.eNSName.findFirst({
        where: {
          owner: {
            contains: address.toLowerCase(),
            mode: 'insensitive',
          },
        },
        select: {
          name: true,
        },
      });

      return ensRecord?.name || null;
    } catch (error) {
      console.error('Error looking up ENS name:', error);
      return null;
    }
  }

  async getAvatar(nameOrAddress: string): Promise<string | null> {
    try {
      // If name already has .zest suffix, use it directly
      const fullName = nameOrAddress.endsWith(this.DOMAIN_SUFFIX)
        ? nameOrAddress.replace(this.DOMAIN_SUFFIX, this.FULL_DOMAIN_SUFFIX)
        : this.formatNameForENS(nameOrAddress);

      const avatar = await this.ethProvider.getAvatar(fullName);
      return avatar;
    } catch (error) {
      console.error('Error getting ENS avatar:', error);
      return null;
    }
  }

  async getTextRecord(name: string, key: string): Promise<string | null> {
    try {
      // If name already has .zest suffix, use it directly
      const fullName = name.endsWith(this.DOMAIN_SUFFIX)
        ? name.replace(this.DOMAIN_SUFFIX, this.FULL_DOMAIN_SUFFIX)
        : this.formatNameForENS(name);

      const resolver = await this.ethProvider.getResolver(fullName);
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

      // Add to queue with both the label and the formatted name for DB
      await this.ensQueue.add('register', {
        label,
        owner,
        dbName: this.formatNameForDB(label),
      });

      return {
        status: 'queued',
        message: 'Name registration has been queued',
        name: this.formatNameForDB(label),
      };
    } catch (error) {
      console.error('Error preparing ENS registration:', error);
      throw error;
    }
  }
}
