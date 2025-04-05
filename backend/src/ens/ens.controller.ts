import { Controller, Get, Post, Param, Query, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ENSService } from './ens.service';

@ApiTags('ENS')
@Controller('ens')
export class ENSController {
  constructor(private readonly ensService: ENSService) {}

  @Get('resolve/:name')
  @ApiOperation({ summary: 'Resolve an ENS name to an address' })
  @ApiResponse({ status: 200, description: 'Returns the resolved address.' })
  async resolveName(@Param('name') name: string) {
    return this.ensService.resolveName(name);
  }

  @Get('lookup/:address')
  @ApiOperation({ summary: 'Look up an address to get its ENS name' })
  @ApiResponse({ status: 200, description: 'Returns the ENS name.' })
  async lookupAddress(@Param('address') address: string) {
    return this.ensService.lookupAddress(address);
  }

  @Get('avatar/:nameOrAddress')
  @ApiOperation({ summary: 'Get the avatar for an ENS name or address' })
  @ApiResponse({ status: 200, description: 'Returns the avatar URL.' })
  async getAvatar(@Param('nameOrAddress') nameOrAddress: string) {
    return this.ensService.getAvatar(nameOrAddress);
  }

  @Get('text/:name')
  @ApiOperation({ summary: 'Get a text record for an ENS name' })
  @ApiResponse({ status: 200, description: 'Returns the text record value.' })
  async getTextRecord(@Param('name') name: string, @Query('key') key: string) {
    return this.ensService.getTextRecord(name, key);
  }

  @Post('register')
  @ApiOperation({ summary: 'Prepare an ENS name registration transaction' })
  @ApiResponse({
    status: 200,
    description: 'Returns transaction data for frontend to execute.',
  })
  async registerName(
    @Body('label') label: string,
    @Body('owner') owner: string,
  ) {
    return this.ensService.registerName(label, owner);
  }
}
