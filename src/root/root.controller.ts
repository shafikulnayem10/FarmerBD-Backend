import { Controller, Get } from '@nestjs/common';

@Controller()
export class RootController {
  @Get()
  getWelcome() {
    return {
      success: true,
      message: 'Welcome to FarmerBD API!',
      description:
        'A platform connecting farmers directly with buyers across Bangladesh.',
      version: '1.0.0',
      status: 'running',
      timestamp: new Date().toISOString(),
    };
  }
}