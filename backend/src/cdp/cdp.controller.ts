import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CDPService } from './cdp.service';
import { CreateCDPDto, UpdateCDPDto } from './dto/cdp.dto';

@ApiTags('CDP')
@Controller('cdp')
export class CDPController {
  constructor(private readonly cdpService: CDPService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new CDP' })
  @ApiResponse({ status: 201, description: 'CDP created successfully.' })
  async createCDP(@Body() createCDPDto: CreateCDPDto) {
    return this.cdpService.create(createCDPDto);
  }

  @Get(':owner')
  @ApiOperation({ summary: 'Get CDP by owner address' })
  @ApiResponse({ status: 200, description: 'Returns the CDP details.' })
  async getCDP(@Param('owner') owner: string) {
    return this.cdpService.findByOwner(owner);
  }

  @Get()
  @ApiOperation({ summary: 'Get all CDPs with pagination' })
  @ApiResponse({ status: 200, description: 'Returns a list of CDPs.' })
  async getAllCDPs(@Query('page') page = 1, @Query('limit') limit = 10) {
    return this.cdpService.findAll(page, limit);
  }

  @Get(':owner/interest')
  @ApiOperation({ summary: 'Calculate accrued interest for a CDP' })
  @ApiResponse({ status: 200, description: 'Returns the accrued interest.' })
  async getAccruedInterest(@Param('owner') owner: string) {
    return this.cdpService.calculateInterest(owner);
  }
}
