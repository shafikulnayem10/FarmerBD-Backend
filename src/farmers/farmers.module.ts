import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FarmerProfile } from './entities/farmer-profile.entity.js';
import { FarmersController } from './farmers.controller.js';
import { FarmersService } from './farmers.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([FarmerProfile])],
  controllers: [FarmersController],
  providers: [FarmersService],
  exports: [FarmersService],
})
export class FarmersModule {}