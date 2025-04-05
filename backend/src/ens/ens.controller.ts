import { Controller, Get, Post, Param, Query, Body } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';
import { ENSService } from './ens.service';

@ApiTags('ENS')
@Controller('ens')
export class ENSController {
  constructor(private readonly ensService: ENSService) {}

  @Get('resolve/:name')
  @ApiOperation({ summary: 'Resolve an ENS name to an address' })
  @ApiResponse({ status: 200, description: 'Returns the resolved address.' })
  @ApiParam({
    name: 'name',
    description: 'The ENS name to resolve (e.g., "vitalik.zest")',
    example: 'vitalik.zest',
  })
  async resolveName(@Param('name') name: string) {
    return this.ensService.resolveName(name);
  }

  @Get('lookup/:address')
  @ApiOperation({ summary: 'Look up an address to get its ENS name' })
  @ApiResponse({ status: 200, description: 'Returns the ENS name.' })
  @ApiParam({
    name: 'address',
    description: 'The Ethereum address to look up',
    example: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
  })
  async lookupAddress(@Param('address') address: string) {
    return this.ensService.lookupAddress(address);
  }

  @Get('avatar/:nameOrAddress')
  @ApiOperation({ summary: 'Get the avatar for an ENS name or address' })
  @ApiResponse({ status: 200, description: 'Returns the avatar URL.' })
  @ApiParam({
    name: 'nameOrAddress',
    description: 'ENS name or Ethereum address',
    example: 'vitalik.zest',
  })
  async getAvatar(@Param('nameOrAddress') nameOrAddress: string) {
    return this.ensService.getAvatar(nameOrAddress);
  }

  @Get('text/:name')
  @ApiOperation({ summary: 'Get a text record for an ENS name' })
  @ApiResponse({ status: 200, description: 'Returns the text record value.' })
  @ApiParam({
    name: 'name',
    description: 'The ENS name to query',
    example: 'vitalik.zest',
  })
  @ApiQuery({
    name: 'key',
    description: 'The text record key to retrieve',
    example: 'url',
  })
  async getTextRecord(@Param('name') name: string, @Query('key') key: string) {
    return this.ensService.getTextRecord(name, key);
  }

  @Post('register')
  @ApiOperation({ summary: 'Prepare an ENS name registration transaction' })
  @ApiResponse({
    status: 200,
    description: 'Returns transaction data for frontend to execute.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        label: {
          type: 'string',
          description:
            'The label to register (e.g., "vitalik" for vitalik.eth)',
          example: 'vitalik',
        },
        owner: {
          type: 'string',
          description: 'The Ethereum address that will own the name',
          example: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
        },
      },
      required: ['label', 'owner'],
    },
  })
  async registerName(
    @Body('label') label: string,
    @Body('owner') owner: string,
  ) {
    return this.ensService.registerName(label, owner);
  }
}
