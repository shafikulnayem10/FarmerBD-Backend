import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from '../users/users.module.js';
import { BuyersController } from './buyers.controller.js';
import { BuyersService } from './buyers.service.js';
import { BuyerProfile } from './entities/buyer-profile.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([BuyerProfile]), UsersModule],
  controllers: [BuyersController],
  providers: [BuyersService],
  exports: [BuyersService],
})
export class BuyersModule {}