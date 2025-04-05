import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';
import { PaymentService } from './payment.service';
import {
  BalanceResponse,
  PaymentRequest,
  PaymentRequestResponse,
} from './payment.service';

@ApiTags('Payments')
@Controller('payments')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Get('balance/:identifier')
  @ApiOperation({ summary: 'Get balance for an address or ENS name' })
  @ApiResponse({
    status: 200,
    description: 'Returns the balance for the specified address or ENS name.',
  })
  @ApiParam({
    name: 'identifier',
    description: 'Ethereum address or ENS name',
    example: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
  })
  async getBalance(
    @Param('identifier') identifier: string,
  ): Promise<BalanceResponse> {
    return await this.paymentService.getBalance(identifier);
  }

  @Post('request')
  @ApiOperation({ summary: 'Create a new payment request' })
  @ApiResponse({
    status: 201,
    description: 'Returns the payment request details and QR code data.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        amount: {
          type: 'string',
          description: 'Amount to request',
          example: '1000000000000000000',
        },
        token: {
          type: 'string',
          description: 'Token to request payment in',
          enum: ['cBTC', 'ZEST', 'USDT'],
          example: 'cBTC',
        },
        description: {
          type: 'string',
          description: 'Optional description of the payment',
          example: 'Payment for services',
        },
        expiresIn: {
          type: 'number',
          description: 'Time in seconds until the request expires',
          example: 3600,
        },
      },
      required: ['amount', 'token'],
    },
  })
  async createPaymentRequest(
    @Body() request: PaymentRequest,
  ): Promise<PaymentRequestResponse> {
    return await this.paymentService.createPaymentRequest(request);
  }

  @Post('prepare/:requestId')
  @ApiOperation({ summary: 'Prepare a payment transaction' })
  @ApiResponse({
    status: 200,
    description: 'Returns the prepared transaction data.',
  })
  @ApiParam({
    name: 'requestId',
    description: 'ID of the payment request',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiQuery({
    name: 'fromAddress',
    description: 'Address making the payment',
    example: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
  })
  async preparePayment(
    @Param('requestId') requestId: string,
    @Query('fromAddress') fromAddress: string,
  ) {
    return await this.paymentService.preparePayment(requestId, fromAddress);
  }

  @Post('record/:requestId')
  @ApiOperation({ summary: 'Record a completed payment' })
  @ApiResponse({
    status: 200,
    description: 'Payment recorded successfully.',
  })
  @ApiParam({
    name: 'requestId',
    description: 'ID of the payment request',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiQuery({
    name: 'txHash',
    description: 'Transaction hash of the completed payment',
    example: '0x123...',
  })
  async recordPayment(
    @Param('requestId') requestId: string,
    @Query('txHash') txHash: string,
  ) {
    return await this.paymentService.recordPayment(requestId, txHash);
  }
}
