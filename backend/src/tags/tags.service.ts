import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';


@Injectable()
export class TagsService {
constructor(private prisma: PrismaService) {}
all() { return this.prisma.tag.findMany({ orderBy: { name: 'asc' } }); }
create(name: string) {
if (!name) throw new BadRequestException('name required');
return this.prisma.tag.create({ data: { name } });
}
}