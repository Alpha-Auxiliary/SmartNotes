import { Module } from '@nestjs/common';
import { NotesService } from './notes.service';
import { NotesController } from './notes.controller';
import { PrismaService } from '../common/prisma.service';


@Module({ controllers: [NotesController], providers: [NotesService, PrismaService] })
export class NotesModule {}