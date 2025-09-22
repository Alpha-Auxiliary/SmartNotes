import { Injectable,UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from "../../common/prisma.service";
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(private prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_SECRET,
      ignoreExpiration: false,
    });
  }

  async validate(payload: any) {
    // 检查是否在黑名单
    if (payload?.jti) {
      const revoked = await this.prisma.revokedToken.findUnique({
        where: { jti: payload.jti },
      });
      if (revoked) {
        throw new UnauthorizedException("Token revoked");
      }
    }
    // 这里返回的对象会被注入到 req.user
    return {
      sub: payload.sub,//返回为sub
      email: payload.email,
      displayName: payload.displayName,
      role: payload.role,
      jti: payload.jti,
    };
  }
}