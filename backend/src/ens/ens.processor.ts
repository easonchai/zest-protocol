import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { ethers } from 'ethers';
import * as L2RegistrarABI from './abi/L2Registrar.json';

@Processor('ens')
export class ENSProcessor {
  private readonly logger = new Logger(ENSProcessor.name);
  private l2Registrar: ethers.Contract;

  constructor() {
    const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
    const signer = new ethers.Wallet(process.env.PRIVATE_KEY || '', provider);
    this.l2Registrar = new ethers.Contract(
      process.env.L2_REGISTRAR_CONTRACT || '',
      L2RegistrarABI.abi,
      signer,
    );
  }

  @Process('register')
  async handleRegister(job: Job<{ label: string; owner: string }>) {
    try {
      this.logger.log(
        `Processing ENS registration for label: ${job.data.label}`,
      );

      const tx = await this.l2Registrar.register(
        job.data.label,
        job.data.owner,
      );
      const receipt = await tx.wait();

      this.logger.log(
        `ENS registration completed for label: ${job.data.label}`,
      );
      return {
        status: 'completed',
        txHash: receipt.hash,
      };
    } catch (error) {
      this.logger.error(`Error processing ENS registration: ${error.message}`);
      throw error;
    }
  }
}
