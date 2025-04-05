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
    schema: {
      type: 'object',
      properties: {
        verified: {
          type: 'boolean',
          description: 'Whether KYC verification was successful',
        },
        userId: {
          type: 'string',
          description: 'Unique identifier for the verified user',
        },
        timestamp: {
          type: 'number',
          description: 'Unix timestamp of verification',
        },
      },
    },
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        proof: {
          type: 'object',
          description: 'Zero-knowledge proof from Self protocol',
          example: {
            pi_a: ['0x1234...', '0x5678...'],
            pi_b: [
              ['0x1234...', '0x5678...'],
              ['0x1234...', '0x5678...'],
            ],
            pi_c: ['0x1234...', '0x5678...'],
          },
        },
        publicSignals: {
          type: 'object',
          description: 'Public signals from Self protocol',
          example: {
            userId: 'user123',
            timestamp: 1234567890,
          },
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
    schema: {
      type: 'object',
      properties: {
        verified: {
          type: 'boolean',
          description: 'Whether the user is KYC verified',
        },
        userId: { type: 'string', description: 'User ID from Self protocol' },
        verifiedAt: {
          type: 'number',
          description: 'Unix timestamp of verification',
        },
        expiresAt: {
          type: 'number',
          description: 'Unix timestamp when verification expires',
        },
      },
    },
  })
  @ApiParam({
    name: 'userId',
    description: 'User ID from Self protocol',
    example: 'user123',
    schema: {
      type: 'string',
      pattern: '^[a-zA-Z0-9_-]+$',
    },
  })
  async getKYCStatus(@Param('userId') userId: string) {
    return await this.kycService.getKYCStatus(userId);
  }
}
