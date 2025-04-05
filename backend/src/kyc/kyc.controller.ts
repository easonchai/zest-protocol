import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { KYCService, KYCVerificationResult } from './kyc.service';

@ApiTags('KYC')
@Controller('kyc')
export class KYCController {
  constructor(private readonly kycService: KYCService) {}

  @Post('verify')
  @ApiOperation({ summary: 'Verify KYC using Self protocol' })
  @ApiResponse({
    status: 200,
    description: 'Returns the KYC verification result.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        proof: {
          type: 'object',
          description: 'Zero-knowledge proof from Self protocol',
        },
        publicSignals: {
          type: 'object',
          description: 'Public signals from Self protocol',
        },
      },
      required: ['proof', 'publicSignals'],
    },
  })
  async verifyKYC(
    @Body('proof') proof: any,
    @Body('publicSignals') publicSignals: any,
  ): Promise<KYCVerificationResult> {
    return await this.kycService.verifyKYC(proof, publicSignals);
  }

  @Get('status/:userId')
  @ApiOperation({ summary: 'Get KYC status for a user' })
  @ApiResponse({
    status: 200,
    description: 'Returns the KYC status and verification timestamp.',
  })
  @ApiParam({
    name: 'userId',
    description: 'User ID from Self protocol',
    example: 'user123',
  })
  async getKYCStatus(@Param('userId') userId: string) {
    return await this.kycService.getKYCStatus(userId);
  }
}
