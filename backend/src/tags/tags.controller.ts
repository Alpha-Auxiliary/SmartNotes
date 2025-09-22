import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { TagsService } from './tags.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';


@UseGuards(JwtAuthGuard)
@Controller('tags')
export class TagsController {
constructor(private readonly tags: TagsService) {}


@Get()
all() { return this.tags.all(); }


@Post()
create(@Body('name') name: string) { return this.tags.create(name); }
}