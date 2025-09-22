import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { NotesService } from "./notes.service";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { CurrentUser } from "../common/decorators/user.decorator";

@UseGuards(JwtAuthGuard)
@Controller("notes")
export class NotesController {
  constructor(private readonly notes: NotesService) {}

  @Get()
  list(
    @CurrentUser() user: any,
    @Query("q") q?: string,
    @Query("page") page = 1,
    @Query("pageSize") pageSize = 20
  ) {
    return this.notes.list(user.sub, { q, page: +page, pageSize: +pageSize });
  }

  @Get(":id")
  get(@CurrentUser() user: any, @Param("id") id: string) {
    return this.notes.get(user.sub, id);
  }

  @Post()
  create(@CurrentUser() user: any, @Body() dto: any) {
    return this.notes.create(user.sub, dto);
  }

  @Patch(":id")
  update(@CurrentUser() user: any, @Param("id") id: string, @Body() dto: any) {
    return this.notes.update(user.sub, id, dto);
  }

  @Delete(":id")
  remove(@CurrentUser() user: any, @Param("id") id: string) {
    return this.notes.remove(user.sub, id);
  }
}
