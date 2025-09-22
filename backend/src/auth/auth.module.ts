import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { AuthService } from "./auth.service";
import { AuthController } from "./auth.controller";
import { UsersModule } from "../users/users.module";
import { JwtStrategy } from "./strategies/jwt.strategy";
import { PrismaService } from "../common/prisma.service";

@Module({
  imports: [
    UsersModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: process.env.JWT_EXPIRES_IN || "15m" }
    }), PassportModule], // ← 加上 PassportModule
  providers: [AuthService, JwtStrategy, PrismaService], // ← 注册 PrismaService
  controllers: [AuthController],
})
export class AuthModule {}
