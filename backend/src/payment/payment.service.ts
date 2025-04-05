import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ENSService } from '../ens/ens.service';
import { TokenService } from '../token/token.service';
import { ethers } from 'ethers';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';

export interface BalanceResponse {
  address: string;
  cbtc: string;
  zest: string;
  usdt: string;
}

export interface PaymentRequest {
  amount: string;
  token: 'cBTC' | 'ZEST' | 'USDT';
  description?: string;
  expiresIn?: number; // seconds
}

export interface PaymentRequestResponse {
  requestId: string;
  qrData: string;
  expiresAt: number;
}

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly tokenService: TokenService,
    private readonly ensService: ENSService,
    @InjectQueue('payment') private paymentQueue: Queue,
  ) {}

  async getBalance(identifier: string): Promise<BalanceResponse> {
    // Resolve ENS name if provided
    const address =
      (await this.ensService.resolveName(identifier)) || identifier;

    if (!ethers.isAddress(address)) {
      throw new Error('Invalid address or ENS name');
    }

    // Get balances from blockchain
    const [cbtcBalance, zestBalance, usdtBalance] = await Promise.all([
      this.tokenService.getCBTCBalance(address),
      this.tokenService.getZESTBalance(address),
      this.tokenService.getUSDTBalance(address),
    ]);

    return {
      address,
      cbtc: cbtcBalance.toString(),
      zest: zestBalance.toString(),
      usdt: usdtBalance.toString(),
    };
  }

  async createPaymentRequest(
    request: PaymentRequest,
  ): Promise<PaymentRequestResponse> {
    const expiresAt =
      Math.floor(Date.now() / 1000) + (request.expiresIn || 3600); // Default 1 hour

    const paymentRequest = await this.prisma.paymentRequest.create({
      data: {
        amount: request.amount,
        token: request.token,
        description: request.description,
        expiresAt: new Date(expiresAt * 1000),
        status: 'PENDING',
      },
    });

    // Create QR data
    const qrData = JSON.stringify({
      requestId: paymentRequest.id,
      amount: request.amount,
      token: request.token,
      expiresAt,
    });

    return {
      requestId: paymentRequest.id,
      qrData,
      expiresAt,
    };
  }

  async preparePayment(requestId: string, fromAddress: string) {
    const paymentRequest = await this.prisma.paymentRequest.findUnique({
      where: { id: requestId },
    });

    if (!paymentRequest) {
      throw new Error('Payment request not found');
    }

    if (paymentRequest.status !== 'PENDING') {
      throw new Error('Payment request is not pending');
    }

    if (paymentRequest.expiresAt < new Date()) {
      throw new Error('Payment request has expired');
    }

    // Prepare transaction based on token type
    let transactionData;
    switch (paymentRequest.token) {
      case 'cBTC':
        transactionData = this.tokenService.prepareCBTCTransfer(
          fromAddress,
          paymentRequest.amount,
        );
        break;
      case 'ZEST':
        transactionData = this.tokenService.prepareZESTTransfer(
          fromAddress,
          paymentRequest.amount,
        );
        break;
      case 'USDT':
        transactionData = this.tokenService.prepareUSDTTransfer(
          fromAddress,
          paymentRequest.amount,
        );
        break;
      default:
        throw new Error('Unsupported token type');
    }

    return {
      ...transactionData,
      requestId,
    };
  }

  async recordPayment(requestId: string, txHash: string) {
    const paymentRequest = await this.prisma.paymentRequest.update({
      where: { id: requestId },
      data: {
        status: 'COMPLETED',
        txHash,
      },
    });

    // Add to transaction history
    await this.prisma.transaction.create({
      data: {
        type: 'PAYMENT',
        from: paymentRequest.fromAddress || '',
        txHash,
        amount: Number(paymentRequest.amount),
        status: 'COMPLETED',
      },
    });

    return paymentRequest;
  }
}
