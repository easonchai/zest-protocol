import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { ethers } from 'ethers';
import * as L2RegistrarABI from './abi/L2Registrar.json';
// import * as ReverseRegistrarABI from './abi/ReverseRegistrar.json';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';

@Processor('ens')
export class ENSProcessor {
  private readonly logger = new Logger(ENSProcessor.name);
  private l2Registrar: ethers.Contract;
  private reverseRegistrar: ethers.Contract;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {
    // Use Base Sepolia provider for registration
    const baseProvider = new ethers.JsonRpcProvider(
      this.configService.get<string>('BASE_RPC_URL'),
    );
    const baseSigner = new ethers.Wallet(
      this.configService.get<string>('PRIVATE_KEY') || '',
      baseProvider,
    );

    // Use ETH Sepolia provider for reverse resolution
    // const ethProvider = new ethers.JsonRpcProvider(
    //   this.configService.get<string>('ENS_RPC_URL'),
    // );
    // const ethSigner = new ethers.Wallet(
    //   this.configService.get<string>('PRIVATE_KEY') || '',
    //   ethProvider,
    // );

    this.l2Registrar = new ethers.Contract(
      this.configService.get<string>('L2_REGISTRAR_CONTRACT') || '',
      L2RegistrarABI.abi,
      baseSigner,
    );

    // this.reverseRegistrar = new ethers.Contract(
    //   this.configService.get<string>('REVERSE_REGISTRAR_CONTRACT') || '',
    //   ReverseRegistrarABI.abi,
    //   ethSigner,
    // );
  }

  @Process('register')
  async handleRegister(
    job: Job<{ label: string; owner: string; dbName: string }>,
  ) {
    try {
      this.logger.log(
        `Processing ENS registration for label: ${job.data.label}`,
      );

      // Register the name on-chain (L2)
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

      // // Set reverse resolution on L1
      // const reverseTx = await this.reverseRegistrar.claimForAddr(
      //   job.data.owner, // address to claim for
      //   '0x36a279136adDde960599fcA356369C04A96D387E', // owner
      //   '0x8FADE66B79cC9f707aB26799354482EB93a5B7dD', // resolver
      // );
      // const reverseReceipt = await reverseTx.wait();

      this.logger.log(
        `ENS registration completed for label: ${job.data.label}`,
      );
      return {
        status: 'completed',
        txHash: receipt.hash,
        // reverseTxHash: reverseReceipt.hash,
        name: job.data.dbName,
      };
    } catch (error) {
      this.logger.error(`Error processing ENS registration: ${error.message}`);
      throw error;
    }
  }
}
