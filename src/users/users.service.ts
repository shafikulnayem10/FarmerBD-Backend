import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateUserDto } from './dtos/create-user.dto.js';
import { Users } from './entities/users.entity.js';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(Users) private readonly userRepo: Repository<Users>,
  ) {}

  async createUser(user: CreateUserDto): Promise<Users> {
    const existing = await this.userRepo.findOne({
      where: [{ email: user.email }, { phone: user.phone }],
    });
    if (existing) {
      throw new ConflictException(
        existing.email === user.email
          ? 'Email is already registered'
          : 'Phone number is already registered',
      );
    }

    const newUser = this.userRepo.create(user);
    return await this.userRepo.save(newUser);
  }

  async getUserById(id: string): Promise<Users | null> {
    return await this.userRepo.findOne({ where: { id } });
  }

  async getUserByEmailWithPassword(email: string): Promise<Users | null> {
    return await this.userRepo.findOne({
      where: { email },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        role: true,
        status: true,
        password: true,
      },
    });
  }

  async getUserByIdWithPassword(id: string): Promise<Users | null> {
    return await this.userRepo.findOne({
      where: { id },
      select: { id: true, password: true },
    });
  }

  async updatePassword(id: string, hashedPassword: string): Promise<void> {
    await this.userRepo.update(id, { password: hashedPassword });
  }
}