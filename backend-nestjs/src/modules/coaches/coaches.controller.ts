import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  Request,
} from "@nestjs/common";
import { CoachesService } from "./coaches.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";

@Controller("coaches")
export class CoachesController {
  constructor(private readonly coachesService: CoachesService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() createCoachDto: any, @Request() req: any) {
    return this.coachesService.create(createCoachDto, req.user.id);
  }

  @Get()
  findAll(@Query() query: any) {
    return this.coachesService.findAll(query);
  }

  @Get("search")
  search(@Query() searchDto: any) {
    return this.coachesService.search(searchDto);
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.coachesService.findOne(id);
  }

  @Patch(":id")
  @UseGuards(JwtAuthGuard)
  update(@Param("id") id: string, @Body() updateCoachDto: any) {
    return this.coachesService.update(id, updateCoachDto);
  }

  @Delete(":id")
  @UseGuards(JwtAuthGuard)
  remove(@Param("id") id: string) {
    return this.coachesService.remove(id);
  }

  @Patch(":id/status")
  @UseGuards(JwtAuthGuard)
  updateStatus(@Param("id") id: string, @Body("status") status: string) {
    return this.coachesService.updateStatus(id, status);
  }

  @Post(":id/apply")
  @UseGuards(JwtAuthGuard)
  applyToProgram(@Param("id") coachId: string, @Body() applicationDto: any) {
    return this.coachesService.applyToProgram(coachId, applicationDto);
  }
}
