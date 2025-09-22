"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const prisma_service_1 = require("../common/prisma.service");
const bcrypt = __importStar(require("bcryptjs"));
const crypto = __importStar(require("crypto"));
const ACCESS_TTL = process.env.JWT_EXPIRES_IN || "15m";
const REFRESH_TTL = process.env.REFRESH_EXPIRES_IN || "7d";
let AuthService = class AuthService {
    constructor(prisma, jwt) {
        this.prisma = prisma;
        this.jwt = jwt;
    }
    genJti() {
        return crypto.randomBytes(16).toString("hex");
    }
    //注册&&登录界面下的红字
    async register({ email, password }) {
        const existing = await this.prisma.user.findUnique({ where: { email } });
        if (existing)
            throw new common_1.ConflictException("该邮箱已被注册");
        const hash = await bcrypt.hash(password, 10);
        const user = await this.prisma.user.create({
            data: { email, passwordHash: hash, displayName: email.split("@")[0] },
        });
        return this.tokensFor(user.id, user.email, user.displayName, user.role);
    }
    async login({ email, password }) {
        const user = await this.prisma.user.findUnique({ where: { email } });
        if (!user)
            throw new common_1.UnauthorizedException("该邮箱不存在");
        const ok = await bcrypt.compare(password, user.passwordHash);
        if (!ok)
            throw new common_1.UnauthorizedException("密码错误");
        return this.tokensFor(user.id, user.email, user.displayName, user.role);
    }
    //刷新
    async refresh(refreshToken) {
        const payload = await this.jwt.verifyAsync(refreshToken, {
            secret: process.env.REFRESH_SECRET,
        });
        const revoked = await this.prisma.revokedToken.findUnique({
            where: { jti: payload.jti },
        });
        if (revoked)
            throw new common_1.UnauthorizedException("错误:rt过期,请重新登录");
        return this.tokensFor(payload.sub, payload.email, payload.displayName, payload.role);
    }
    async logout(accessToken, refreshToken) {
        // 注意：不需要 verify（可能已过期），只 decode 拿 jti/exp
        const now = new Date();
        for (const [raw, type] of [
            [accessToken, "ACCESS"],
            [refreshToken, "REFRESH"],
        ]) {
            if (!raw)
                continue;
            const decoded = this.jwt.decode(raw);
            const jti = decoded?.jti;
            const exp = decoded?.exp;
            const sub = decoded?.sub;
            if (jti && exp) {
                await this.prisma.revokedToken.upsert({
                    where: { jti },
                    update: {},
                    create: {
                        jti,
                        type: type,
                        userId: sub ?? null,
                        expiresAt: new Date(exp * 1000),
                    },
                });
            }
        }
        return { ok: true, at: now.toISOString() };
    }
    async tokensFor(id, email, displayName, role) {
        const ajti = this.genJti();
        const rjti = this.genJti();
        const accessToken = await this.jwt.signAsync({ sub: id, email, displayName, role, jti: ajti }, { secret: process.env.JWT_SECRET, expiresIn: ACCESS_TTL });
        const refreshToken = await this.jwt.signAsync({ sub: id, email, displayName, role, jti: rjti }, { secret: process.env.REFRESH_SECRET, expiresIn: REFRESH_TTL });
        return { accessToken, refreshToken };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, jwt_1.JwtService])
], AuthService);
