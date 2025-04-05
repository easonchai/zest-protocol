import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { ethers } from 'ethers';
import * as L2RegistrarABI from './abi/L2Registrar.json';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';

@Processor('ens')
export class ENSProcessor {
  private readonly logger = new Logger(ENSProcessor.name);
  private l2Registrar: ethers.Contract;
  private readonly DOMAIN_SUFFIX = '.zest';
  private readonly FULL_DOMAIN_SUFFIX = '.zest.eth';

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {
    // Use Base Sepolia provider for registration
    const provider = new ethers.JsonRpcProvider(
      this.configService.get<string>('RPC_URL'),
    );
    const signer = new ethers.Wallet(
      this.configService.get<string>('PRIVATE_KEY') || '',
      provider,
    );
    this.l2Registrar = new ethers.Contract(
      this.configService.get<string>('L2_REGISTRAR_CONTRACT') || '',
      L2RegistrarABI.abi,
      signer,
    );
  }

  @Process('register')
  async handleRegister(
    job: Job<{ label: string; owner: string; dbName: string }>,
  ) {
    try {
      this.logger.log(
        `Processing ENS registration for label: ${job.data.label}`,
      );

      // Register the name on-chain
      const tx = await this.l2Registrar.register(
        job.data.label,
        job.data.owner,
      );
      const receipt = await tx.wait();

      // Store the name in our database
      await this.prisma.eNSName.create({
        data: {
          name: job.data.dbName,
          owner: job.data.owner,
          txHash: receipt.hash,
        },
      });

      this.logger.log(
        `ENS registration completed for label: ${job.data.label}`,
      );
      return {
        status: 'completed',
        txHash: receipt.hash,
        name: job.data.dbName,
      };
    } catch (error) {
      this.logger.error(`Error processing ENS registration: ${error.message}`);
      throw error;
    }
  }
}
