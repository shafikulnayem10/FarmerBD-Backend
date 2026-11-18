import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TransporterProfile } from './entities/transporter-profile.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([TransporterProfile])],
  exports: [TypeOrmModule],
})
export class TransportersModule {}
