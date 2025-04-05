import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ENSService } from '../ens/ens.service';
import { TokenService } from '../token/token.service';
import { ethers } from 'ethers';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { PaymentPaginationDto } from './dto/payment.dto';
import * as ERC20ABI from '../token/abi/ERC20.json';
import { ConfigService } from '@nestjs/config';

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
  private readonly erc20Iface = new ethers.Interface(ERC20ABI.abi);

  constructor(
    private readonly prisma: PrismaService,
    private readonly tokenService: TokenService,
    private readonly ensService: ENSService,
    private readonly configService: ConfigService,
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

    const amount = ethers.parseEther(paymentRequest.amount);

    // Prepare transaction based on token type
    let transactionData;
    switch (paymentRequest.token) {
      case 'cBTC':
        // For native cBTC, we just need to send the amount
        transactionData = {
          to: fromAddress,
          value: amount,
          data: '0x',
        };
        break;
      case 'ZEST':
        transactionData = {
          to: this.configService.get<string>('ZEST_CONTRACT'),
          data: this.erc20Iface.encodeFunctionData('transfer', [
            fromAddress,
            amount,
          ]),
          value: '0',
        };
        break;
      case 'USDT':
        transactionData = {
          to: this.configService.get<string>('USDT_CONTRACT'),
          data: this.erc20Iface.encodeFunctionData('transfer', [
            fromAddress,
            amount,
          ]),
          value: '0',
        };
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

  async getPaymentHistory(query: PaymentPaginationDto) {
    const { page = 1, limit = 10, fromAddress, status } = query;
    const skip = (page - 1) * limit;

    const where = {
      ...(fromAddress && { fromAddress }),
      ...(status && { status }),
    };

    const [payments, total] = await Promise.all([
      this.prisma.paymentRequest.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.paymentRequest.count({ where }),
    ]);

    return {
      payments,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  }

  private generateQRCode(request: any) {
    // Implement QR code generation logic
    return `payment:${request.id}`;
  }
}
