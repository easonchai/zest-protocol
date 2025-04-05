import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { PaymentService } from './payment.service';
import {
  BalanceDto,
  PaymentRequestDto,
  PreparePaymentDto,
  RecordPaymentDto,
  PaymentPaginationDto,
} from './dto/payment.dto';

@ApiTags('Payments')
@Controller('payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Get('balance/:identifier')
  @ApiOperation({ summary: 'Get token balances for an address or ENS name' })
  @ApiResponse({
    status: 200,
    description: 'Returns token balances for the specified address',
    schema: {
      type: 'object',
      properties: {
        address: { type: 'string', description: 'The normalized address' },
        cbtc: { type: 'string', description: 'cBTC balance in wei' },
        zest: { type: 'string', description: 'ZEST balance in wei' },
        usdt: { type: 'string', description: 'USDT balance in wei' },
      },
    },
  })
  @ApiParam({
    name: 'identifier',
    description: 'Ethereum address or ENS name',
    example: '0x1234...5678 or vitalik.zest',
  })
  async getBalance(@Param(ValidationPipe) params: BalanceDto) {
    return await this.paymentService.getBalance(params.identifier);
  }

  @Post('request')
  @ApiOperation({ summary: 'Create a new payment request' })
  @ApiResponse({
    status: 201,
    description: 'Payment request created successfully',
    schema: {
      type: 'object',
      properties: {
        requestId: {
          type: 'string',
          description: 'Unique identifier for the payment request',
        },
        qrData: {
          type: 'string',
          description: 'QR code data for the payment request',
        },
        expiresAt: {
          type: 'number',
          description: 'Unix timestamp when the request expires',
        },
      },
    },
  })
  @ApiBody({
    type: PaymentRequestDto,
    description: 'Payment request details',
    examples: {
      example1: {
        value: {
          amount: '1.0',
          token: 'cBTC',
          fromAddress: '0x1234...5678',
          description: 'Payment for services',
          expiresIn: 3600,
        },
      },
    },
  })
  async createPaymentRequest(
    @Body(ValidationPipe) paymentRequest: PaymentRequestDto,
  ) {
    return await this.paymentService.createPaymentRequest(paymentRequest);
  }

  @Post('prepare')
  @ApiOperation({ summary: 'Prepare a payment transaction' })
  @ApiResponse({
    status: 200,
    description: 'Returns prepared transaction data',
    schema: {
      type: 'object',
      properties: {
        to: { type: 'string', description: 'Recipient address' },
        value: { type: 'string', description: 'Amount in wei' },
        data: { type: 'string', description: 'Transaction data' },
        token: { type: 'string', description: 'Token symbol' },
        amount: { type: 'string', description: 'Amount' },
        description: { type: 'string', description: 'Description' },
        fromAddress: { type: 'string', description: 'Sender address' },
        requestId: { type: 'string', description: 'Payment request ID' },
      },
    },
  })
  @ApiBody({
    type: PreparePaymentDto,
    description: 'Payment preparation details',
    examples: {
      example1: {
        value: {
          requestId: '123e4567-e89b-12d3-a456-426614174000',
          fromAddress: '0x1234...5678',
        },
      },
    },
  })
  async preparePayment(@Body(ValidationPipe) payment: PreparePaymentDto) {
    return await this.paymentService.preparePayment(payment.requestId);
  }

  @Post('record')
  @ApiOperation({ summary: 'Record a completed payment' })
  @ApiResponse({
    status: 200,
    description: 'Payment recorded successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Payment request ID' },
        status: { type: 'string', description: 'Payment status' },
        txHash: { type: 'string', description: 'Transaction hash' },
      },
    },
  })
  @ApiBody({
    type: RecordPaymentDto,
    description: 'Payment recording details',
    examples: {
      example1: {
        value: {
          requestId: '123e4567-e89b-12d3-a456-426614174000',
          txHash: '0x1234...5678',
        },
      },
    },
  })
  async recordPayment(@Body(ValidationPipe) payment: RecordPaymentDto) {
    return await this.paymentService.recordPayment(
      payment.requestId,
      payment.txHash,
    );
  }

  @Get('history')
  @ApiOperation({ summary: 'Get payment history with pagination' })
  @ApiResponse({
    status: 200,
    description: 'Returns paginated payment history',
    schema: {
      type: 'object',
      properties: {
        payments: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              amount: { type: 'string' },
              token: { type: 'string' },
              status: { type: 'string' },
              createdAt: { type: 'string' },
            },
          },
        },
        pagination: {
          type: 'object',
          properties: {
            total: { type: 'number' },
            page: { type: 'number' },
            limit: { type: 'number' },
            pages: { type: 'number' },
          },
        },
      },
    },
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Page number for pagination',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Number of items per page',
    example: 10,
  })
  @ApiQuery({
    name: 'fromAddress',
    required: false,
    description: 'Filter by sender address',
    example: '0x1234...5678',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    description: 'Filter by payment status',
    example: 'COMPLETED',
  })
  async getPaymentHistory(@Query(ValidationPipe) query: PaymentPaginationDto) {
    return await this.paymentService.getPaymentHistory(query);
  }
}
