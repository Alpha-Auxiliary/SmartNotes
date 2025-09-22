"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../common/prisma.service");
let NotesService = class NotesService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async list(userId, { q, page, pageSize }) {
        const where = { authorId: userId, deleted: false };
        if (q)
            where.OR = [
                { title: { contains: q, mode: "insensitive" } },
                { content: { contains: q, mode: "insensitive" } },
            ];
        const [items, total] = await Promise.all([
            this.prisma.note.findMany({
                where,
                orderBy: [{ pinned: "desc" }, { updatedAt: "desc" }],
                skip: (page - 1) * pageSize,
                take: pageSize,
                include: { tags: { include: { tag: true } } },
            }),
            this.prisma.note.count({ where }),
        ]);
        return { items, total, page, pageSize };
    }
    async get(userId, id) {
        const note = await this.prisma.note.findUnique({
            where: { id },
            include: { tags: { include: { tag: true } } },
        });
        if (!note || note.authorId !== userId)
            throw new common_1.NotFoundException();
        return note;
    }
    async create(userId, dto) {
        const { title, content = "", tags = [] } = dto;
        if (!title)
            throw new common_1.BadRequestException("title required");
        return this.prisma.$transaction(async (tx) => {
            const note = await tx.note.create({
                data: { authorId: userId, title, content },
            });
            if (tags.length) {
                for (const name of tags) {
                    const tag = await tx.tag.upsert({
                        where: { name },
                        update: {},
                        create: { name },
                    });
                    await tx.noteTag.create({ data: { noteId: note.id, tagId: tag.id } });
                }
            }
            return note;
        });
    }
    async update(userId, id, dto) {
        const note = await this.prisma.note.findUnique({ where: { id } });
        if (!note || note.authorId !== userId)
            throw new common_1.ForbiddenException();
        const { title, content, pinned, archived, tags } = dto;
        const updated = await this.prisma.note.update({
            where: { id },
            data: { title, content, pinned, archived },
        });
        if (Array.isArray(tags)) {
            await this.prisma.noteTag.deleteMany({ where: { noteId: id } });
            for (const name of tags) {
                const tag = await this.prisma.tag.upsert({
                    where: { name },
                    update: {},
                    create: { name },
                });
                await this.prisma.noteTag.create({
                    data: { noteId: id, tagId: tag.id },
                });
            }
        }
        return updated;
    }
    async remove(userId, id) {
        const note = await this.prisma.note.findUnique({ where: { id } });
        if (!note || note.authorId !== userId)
            throw new common_1.ForbiddenException();
        await this.prisma.note.update({
            where: { id },
            data: { deleted: true, deletedAt: new Date() },
        });
        return { ok: true };
    }
};
exports.NotesService = NotesService;
exports.NotesService = NotesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], NotesService);
