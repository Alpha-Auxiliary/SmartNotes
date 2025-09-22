import { Body, Controller, Get, HttpCode, Post, Req, UseGuards } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { AuthGuard } from "@nestjs/passport";
import { Request } from "express";
import { IsEmail, IsString, MinLength } from "class-validator";

class AuthDto {
  @IsEmail() email!: string;
  @IsString() @MinLength(6) password!: string;
}

@Controller("auth")
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post("register")
  register(@Body() dto: AuthDto) {
    return this.auth.register(dto);
  }

  @Post("login")
  @HttpCode(200)
  login(@Body() dto: AuthDto) {
    return this.auth.login(dto);
  }

  @Post("refresh")
  @HttpCode(200)
  refresh(@Body("refreshToken") token: string) {
    return this.auth.refresh(token);
  }
  @Post("logout")
  @HttpCode(200)
  logout(@Req() req: Request, @Body() dto: { refreshToken?: string }) {
  const auth = req.headers.authorization || "";
  const access = auth.startsWith("Bearer ") ? auth.slice(7) : undefined;
  return this.auth.logout(access, dto.refreshToken);
  }
  
}
