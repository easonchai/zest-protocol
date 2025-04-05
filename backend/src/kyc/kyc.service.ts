import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SelfBackendVerifier } from '@selfxyz/core';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { PrismaService } from '../prisma/prisma.service';

export interface KYCVerificationResult {
  isValid: boolean;
  userId: string;
  credentialSubject: {
    name?: string;
    nationality?: string;
    dateOfBirth?: string;
    olderThan?: string;
    passportNoOfac?: boolean;
    nameAndDobOfac?: boolean;
    nameAndYobOfac?: boolean;
  };
}

@Injectable()
export class KYCService {
  private readonly logger = new Logger(KYCService.name);
  private selfVerifier: SelfBackendVerifier;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    @InjectQueue('kyc') private kycQueue: Queue,
  ) {
    const rpcUrl = this.configService.get<string>('SELF_RPC_URL');
    const appScope = this.configService.get<string>('SELF_APP_SCOPE');

    if (!rpcUrl || !appScope) {
      throw new Error('SELF_RPC_URL and SELF_APP_SCOPE must be configured');
    }

    // Initialize Self verifier
    this.selfVerifier = new SelfBackendVerifier(rpcUrl, appScope);

    // Configure verification options
    this.selfVerifier.setMinimumAge(18);
    this.selfVerifier.excludeCountries('IRN', 'PRK'); // Iran and North Korea
    this.selfVerifier.enableNameAndDobOfacCheck();
  }

  async verifyKYC(
    proof: any,
    publicSignals: any,
  ): Promise<KYCVerificationResult> {
    try {
      const result = await this.selfVerifier.verify(proof, publicSignals);

      if (result.isValid) {
        // Store verification result
        await this.prisma.kYCVerification.create({
          data: {
            userId: result.userId,
            name: result.credentialSubject.name,
            nationality: result.credentialSubject.nationality,
            dateOfBirth: result.credentialSubject.date_of_birth,
            status: 'VERIFIED',
          },
        });
      }

      return {
        isValid: result.isValid,
        userId: result.userId,
        credentialSubject: {
          name: result.credentialSubject.name,
          nationality: result.credentialSubject.nationality,
          dateOfBirth: result.credentialSubject.date_of_birth,
          olderThan: result.credentialSubject.older_than,
          passportNoOfac: result.credentialSubject.passport_no_ofac,
          nameAndDobOfac: result.credentialSubject.name_and_dob_ofac,
          nameAndYobOfac: result.credentialSubject.name_and_yob_ofac,
        },
      };
    } catch (error) {
      this.logger.error('KYC verification failed:', error);
      throw error;
    }
  }

  async getKYCStatus(userId: string) {
    const verification = await this.prisma.kYCVerification.findUnique({
      where: { userId },
    });

    return {
      status: verification?.status || 'NOT_VERIFIED',
      verifiedAt: verification?.createdAt,
    };
  }
}
