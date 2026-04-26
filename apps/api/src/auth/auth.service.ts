import { Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcryptjs";
import { User } from "./interfaces/user.interface";
import { UserRole } from "@sadoo/types";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class AuthService {
  private readonly users: User[];

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {
    this.users = [
      {
        id: "1",
        username: this.configService.get<string>("ADMIN_USERNAME", "admin"),
        password: bcrypt.hashSync(
          this.configService.get<string>("ADMIN_PASSWORD", "admin123"),
          10,
        ),
        role: UserRole.ADMIN,
        isOnline: true,
        status: "available",
        createdAt: new Date(),
      },
      {
        id: "2",
        username: "otabeklv",
        password: bcrypt.hashSync("qwerty_654321", 10),
        role: UserRole.OPERATOR,
        isOnline: true,
        status: "available",
        createdAt: new Date(),
      },
      {
        id: "3",
        username: "operator2",
        password: bcrypt.hashSync("op123", 10),
        role: UserRole.OPERATOR,
        isOnline: true,
        status: "available",
        createdAt: new Date(),
      },
      {
        id: "4",
        username: "operator3",
        password: bcrypt.hashSync("op123", 10),
        role: UserRole.OPERATOR,
        isOnline: true,
        status: "available",
        createdAt: new Date(),
      },
    ];
  }

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
    return this.jwtService.sign(payload);
  }

  getUserById(id: string): User | undefined {
    return this.users.find((u) => u.id === id);
  }

  getUserByUsername(username: string): User | undefined {
    return this.users.find((u) => u.username === username);
  }

  getAllOperators(): User[] {
    return this.users.filter((u) => u.role === UserRole.OPERATOR);
  }

  getAllUsers(): User[] {
    return [...this.users];
  }

  updateUserStatus(id: string, status: User["status"]) {
    const user = this.users.find((u) => u.id === id);
    if (user) {
      user.status = status;
      return user;
    }
    return undefined;
  }
}
