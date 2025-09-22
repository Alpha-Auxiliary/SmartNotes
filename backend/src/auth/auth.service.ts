import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { PrismaService } from "../common/prisma.service";
import * as bcrypt from "bcryptjs";
import * as crypto from "crypto";
const ACCESS_TTL = process.env.JWT_EXPIRES_IN || "15m";
const REFRESH_TTL = process.env.REFRESH_EXPIRES_IN || "7d";

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService, private jwt: JwtService) {}
  private genJti() {
    return crypto.randomBytes(16).toString("hex");
  }
  //注册&&登录界面下的红字
  async register({ email, password }: { email: string; password: string }) {
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) throw new ConflictException("该邮箱已被注册");
    const hash = await bcrypt.hash(password, 10);
    const user = await this.prisma.user.create({
      data: { email, passwordHash: hash, displayName: email.split("@")[0] },
    });
    return this.tokensFor(user.id, user.email, user.displayName, user.role);
  }

  async login({ email, password }: { email: string; password: string }) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) throw new UnauthorizedException("该邮箱不存在");
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) throw new UnauthorizedException("密码错误");
    return this.tokensFor(user.id, user.email, user.displayName, user.role);
  }
  //刷新
  async refresh(refreshToken: string) {
    const payload = await this.jwt.verifyAsync(refreshToken, {
      secret: process.env.REFRESH_SECRET,
    });
    const revoked = await this.prisma.revokedToken.findUnique({
      where: { jti: payload.jti },
    });
    if (revoked) throw new UnauthorizedException("错误:rt过期,请重新登录");

    return this.tokensFor(
      payload.sub,
      payload.email,
      payload.displayName,
      payload.role
    );
  }

  async logout(accessToken?: string, refreshToken?: string) {
    // 注意：不需要 verify（可能已过期），只 decode 拿 jti/exp
    const now = new Date();

    for (const [raw, type] of [
      [accessToken, "ACCESS"] as const,
      [refreshToken, "REFRESH"] as const,
    ]) {
      if (!raw) continue;
      const decoded: any = this.jwt.decode(raw);
      const jti = decoded?.jti;
      const exp = decoded?.exp;
      const sub = decoded?.sub;
      if (jti && exp) {
        await this.prisma.revokedToken.upsert({
          where: { jti },
          update: {},
          create: {
            jti,
            type: type as any,
            userId: sub ?? null,
            expiresAt: new Date(exp * 1000),
          },
        });
      }
    }
    return { ok: true, at: now.toISOString() };
  }
  private async tokensFor(
    id: string,
    email: string,
    displayName: string,
    role: string
  ) {
    const ajti = this.genJti();
    const rjti = this.genJti();
    const accessToken = await this.jwt.signAsync(
      { sub: id, email, displayName, role,jti: ajti },
      { secret: process.env.JWT_SECRET, expiresIn: ACCESS_TTL }
    );
    const refreshToken = await this.jwt.signAsync(
      { sub: id, email, displayName, role,jti:rjti },
      { secret: process.env.REFRESH_SECRET, expiresIn: REFRESH_TTL }
    );

    return { accessToken, refreshToken };
  }
}
