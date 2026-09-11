import { Controller, Get, Post, Body, Req, UseGuards, Query, Param } from '@nestjs/common';
import { PropertiesService } from './properties.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Request } from 'express';

@Controller('api/properties')
export class PropertiesController {
  constructor(private readonly propertiesService: PropertiesService) {}

  @Get('search')
  async search(@Query() query: any) {
    const data = await this.propertiesService.searchProperties(query);
    return { data };
  }

  @Get(':id')
  async getOne(@Param('id') id: string) {
    const data = await this.propertiesService.getProperty(id);
    return { data };
  }
}

@Controller('api/hosts/properties')
export class HostPropertiesController {
  constructor(private readonly propertiesService: PropertiesService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  async getHostProperties(@Req() req: Request & { user: { userId: string } }) {
    const properties = await this.propertiesService.getHostProperties(req.user.userId);
    return { data: { properties } };
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  async createProperty(@Req() req: Request & { user: { userId: string } }, @Body() body: any) {
    const property = await this.propertiesService.createProperty(req.user.userId, body);
    return { data: { property } };
  }
}
