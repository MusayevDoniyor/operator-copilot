import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { User } from './interfaces';

@Injectable()
export class AuthService {
  private readonly users: User[] = [
    {
      id: '1',
      username: 'admin',
      password: bcrypt.hashSync('admin123', 10),
      role: 'ADMIN',
      isOnline: true,
      status: 'available',
      createdAt: new Date(),
    },
    {
      id: '2',
      username: 'otabeklv',
      password: bcrypt.hashSync('qwerty_654321', 10),
      role: 'OPERATOR',
      isOnline: true,
      status: 'available',
      createdAt: new Date(),
    },
    {
      id: '3',
      username: 'operator2',
      password: bcrypt.hashSync('op123', 10),
      role: 'OPERATOR',
      isOnline: true,
      status: 'available',
      createdAt: new Date(),
    },
    {
      id: '4',
      username: 'operator3',
      password: bcrypt.hashSync('op123', 10),
      role: 'OPERATOR',
      isOnline: true,
      status: 'available',
      createdAt: new Date(),
    },
  ];

  async validateUser(username: string, password: string): Promise<User | null> {
    const user = this.users.find((u) => u.username === username);
    if (user && (await bcrypt.compare(password, user.password))) {
      return user;
    }
    return null;
  }

  async login(user: User) {
    const payload = {
      username: user.username,
      sub: user.id,
      role: user.role,
    };
    return {
      accessToken: this.sign(payload),
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        isOnline: user.isOnline,
        status: user.status,
        createdAt: user.createdAt,
      },
    };
  }

  private sign(payload: any): string {
    const jwtService = new JwtService();
    return jwtService.sign(payload);
  }

  getUserById(id: string): User | undefined {
    return this.users.find((u) => u.id === id);
  }

  getUserByUsername(username: string): User | undefined {
    return this.users.find((u) => u.username === username);
  }

  getAllOperators(): User[] {
    return this.users.filter((u) => u.role === 'OPERATOR');
  }

  getAllUsers(): User[] {
    return [...this.users];
  }

  updateUserStatus(id: string, status: User['status']) {
    const user = this.users.find((u) => u.id === id);
    if (user) {
      user.status = status;
      return user;
    }
    return undefined;
  }
}
