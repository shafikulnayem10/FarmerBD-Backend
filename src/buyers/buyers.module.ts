import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from '../users/users.module.js';
import { AddressesController } from './addresses.controller.js';
import { AddressesService } from './addresses.service.js';
import { BuyersController } from './buyers.controller.js';
import { BuyersService } from './buyers.service.js';
import { BuyerProfile } from './entities/buyer-profile.entity.js';
import { DeliveryAddress } from './entities/delivery-address.entity.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([BuyerProfile, DeliveryAddress]),
    UsersModule,
  ],
  controllers: [BuyersController, AddressesController],
  providers: [BuyersService, AddressesService],
  exports: [BuyersService, AddressesService],
})
export class BuyersModule {}