import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ENSService } from './ens.service';

@ApiTags('ENS')
@Controller('ens')
export class ENSController {
  constructor(private readonly ensService: ENSService) {}

  @Get('resolve/:name')
  @ApiOperation({ summary: 'Resolve ENS name to address' })
  @ApiResponse({ status: 200, description: 'Returns the resolved address.' })
  async resolveName(@Param('name') name: string) {
    return this.ensService.resolveName(name);
  }

  @Get('lookup/:address')
  @ApiOperation({ summary: 'Lookup address to get ENS name' })
  @ApiResponse({ status: 200, description: 'Returns the ENS name if found.' })
  async lookupAddress(@Param('address') address: string) {
    return this.ensService.lookupAddress(address);
  }

  @Get('avatar/:nameOrAddress')
  @ApiOperation({ summary: 'Get ENS avatar' })
  @ApiResponse({ status: 200, description: 'Returns the avatar URL if found.' })
  async getAvatar(@Param('nameOrAddress') nameOrAddress: string) {
    return this.ensService.getAvatar(nameOrAddress);
  }

  @Get('text/:name')
  @ApiOperation({ summary: 'Get ENS text record' })
  @ApiResponse({
    status: 200,
    description: 'Returns the text record if found.',
  })
  async getTextRecord(@Param('name') name: string, @Query('key') key: string) {
    return this.ensService.getTextRecord(name, key);
  }
}
