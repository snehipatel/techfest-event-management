import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { JwtPayload } from '../auth/jwt.strategy';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Role } from '@prisma/client';
import { CreateTaskDto } from './dto/create-task.dto';
import { AssignTaskDto } from './dto/assign-task.dto';
import { UpdateTaskStatusDto } from './dto/update-task-status.dto';
import { TasksService } from './tasks.service';
import { UpdateTaskDto } from './dto/update-task.dto';

@Controller('tasks')
@UseGuards(JwtAuthGuard)
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(
      Role.SUPER_ADMIN,
      Role.ADMIN,
      Role.FACULTY_COORDINATOR,
      Role.CLUB_COORDINATOR,
      Role.TEAM_LEAD,
    )
    @Post()
    create(
      @Body() dto: CreateTaskDto,
      @Req() req: { user: JwtPayload },
    ) {
      return this.tasksService.create(dto, req.user);
    }

  @Get()
  @UseGuards(RolesGuard)
  @Roles(
      Role.SUPER_ADMIN,
      Role.ADMIN,
      Role.FACULTY_COORDINATOR,
      Role.CLUB_COORDINATOR,
      Role.TEAM_LEAD,
    )
    @Get()
    getTasks(@Req() req) {
      return this.tasksService.getVisibleTasks(req.user);
    }

  @Patch(':id/assign')
  assign(
    @Param('id') id: string,
    @Body() dto: AssignTaskDto,
    @Req() req: { user: JwtPayload },
  ) {
    return this.tasksService.assign(id, dto, req.user);
  }

  @Patch(':id/status')
  async updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTaskStatusDto,
    @Req() req: { user: JwtPayload },
  ) {
    return this.tasksService.updateStatus(id, dto, req.user);
  }

  @Get('me')
  getMyTasks(@Req() req: { user: JwtPayload }) {
    return this.tasksService.getTasksByUser(req.user.sub);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateTaskDto,
    @Req() req: { user: JwtPayload },
  ) {
    return this.tasksService.update(id, dto, req.user);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: { user: JwtPayload }) {
    return this.tasksService.remove(id, req.user);
}
}
