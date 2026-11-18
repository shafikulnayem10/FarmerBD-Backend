import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { Role } from '../common/enums/role.enum.js';
import { Users } from '../users/entities/users.entity.js';
import { UsersService } from '../users/users.service.js';

@Injectable()
export class AdminSeedService implements OnApplicationBootstrap {
  private readonly logger = new Logger('AdminSeed');

  constructor(
    @InjectRepository(Users)
    private readonly userRepo: Repository<Users>,
    private readonly usersService: UsersService,
    private readonly configService: ConfigService,
  ) {}

  async onApplicationBootstrap() {
    const admins = await this.userRepo.count({ where: { role: Role.ADMIN } });
    if (admins > 0) {
      return;
    }

    const email = this.configService.get<string>('ADMIN_EMAIL');
    const phone = this.configService.get<string>('ADMIN_PHONE');
    const password = this.configService.get<string>('ADMIN_PASSWORD');
    if (!email || !phone || !password) {
      this.logger.warn(
        'No Admin account exists. Set ADMIN_EMAIL, ADMIN_PHONE and ADMIN_PASSWORD in .env to create one.',
      );
      return;
    }

    await this.usersService.createUser({
      fullName: this.configService.get<string>('ADMIN_NAME') || 'System Admin',
      email: email.trim().toLowerCase(),
      phone,
      password: await bcrypt.hash(password, 10),
      role: Role.ADMIN,
    });
    this.logger.log(`Admin account created for ${email}`);
  }
}
