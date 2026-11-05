import {ForbiddenException,Injectable,UnauthorizedException,} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Role } from '../common/enums/role.enum.js';
import { UserStatus } from '../common/enums/user-status.enum.js';
import { UsersService } from '../users/users.service.js';
import type { AuthUser } from './interfaces/auth-user.interface.js';

interface JwtPayload {
  id: string;
  email: string;
  role: Role;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private readonly usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: configService.getOrThrow<string>('JWT_SECRET'),
      ignoreExpiration: false,
    });
  }

  async validate(payload: JwtPayload): Promise<AuthUser> {
    const user = await this.usersService.getUserById(payload.id);
    if (!user) {
      throw new UnauthorizedException('User no longer exists');
    }
    if (user.status !== UserStatus.ACTIVE) {
      throw new ForbiddenException('Account is suspended');
    }
    return { id: user.id, email: user.email, role: user.role };
  }
}