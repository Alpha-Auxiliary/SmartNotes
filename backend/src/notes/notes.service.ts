import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../common/prisma.service";

@Injectable()
export class NotesService {
  constructor(private prisma: PrismaService) {}

  async list(
    userId: string,
    { q, page, pageSize }: { q?: string; page: number; pageSize: number }
  ) {
    const where: any = { authorId: userId, deleted: false };
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

  async get(userId: string, id: string) {
    const note = await this.prisma.note.findUnique({
      where: { id },
      include: { tags: { include: { tag: true } } },
    });
    if (!note || note.authorId !== userId) throw new NotFoundException();
    return note;
  }

  async create(userId: string, dto: any) {
    const { title, content = "", tags = [] } = dto;
    if (!title) throw new BadRequestException("title required");
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

  async update(userId: string, id: string, dto: any) {
    const note = await this.prisma.note.findUnique({ where: { id } });
    if (!note || note.authorId !== userId) throw new ForbiddenException();
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

  async remove(userId: string, id: string) {
    const note = await this.prisma.note.findUnique({ where: { id } });
    if (!note || note.authorId !== userId) throw new ForbiddenException();
    await this.prisma.note.update({
      where: { id },
      data: { deleted: true, deletedAt: new Date() },
    });
    return { ok: true };
  }
}
