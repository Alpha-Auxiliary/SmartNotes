import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { NotesModule } from './notes/notes.module';
import { TagsModule } from './tags/tags.module';


@Module({
imports: [AuthModule, UsersModule, NotesModule, TagsModule],
})
export class AppModule {}