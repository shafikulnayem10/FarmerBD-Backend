import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  @Get()
  @ApiOperation({ summary: 'Check that the API is running' })
  check() {
    return {
      status: 'ok',
      service: 'farmerbd-backend',
      timestamp: new Date().toISOString(),
    };
  }
}