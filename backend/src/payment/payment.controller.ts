import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  ValidationPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { PaymentService } from './payment.service';
import {
  BalanceDto,
  PaymentRequestDto,
  PreparePaymentDto,
  RecordPaymentDto,
  PaymentPaginationDto,
} from './dto/payment.dto';

@ApiTags('payment')
@Controller('payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Get('balance/:identifier')
  @ApiOperation({ summary: 'Get token balances for an address or ENS name' })
  @ApiResponse({ status: 200, description: 'Returns token balances' })
  async getBalance(@Param(ValidationPipe) params: BalanceDto) {
    return await this.paymentService.getBalance(params.identifier);
  }

  @Post('request')
  @ApiOperation({ summary: 'Create a new payment request' })
  @ApiResponse({
    status: 201,
    description: 'Payment request created successfully',
  })
  @ApiBody({ type: PaymentRequestDto })
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
  })
  @ApiBody({ type: PreparePaymentDto })
  async preparePayment(@Body(ValidationPipe) payment: PreparePaymentDto) {
    return await this.paymentService.preparePayment(
      payment.requestId,
      payment.fromAddress,
    );
  }

  @Post('record')
  @ApiOperation({ summary: 'Record a completed payment' })
  @ApiResponse({ status: 200, description: 'Payment recorded successfully' })
  @ApiBody({ type: RecordPaymentDto })
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
  })
  async getPaymentHistory(@Query(ValidationPipe) query: PaymentPaginationDto) {
    return await this.paymentService.getPaymentHistory(query);
  }
}
