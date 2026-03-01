import {
  Body,
  Controller,
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
import { RegisterForEventDto } from './dto/register-for-event.dto';
import { RegistrationsService } from './registrations.service';

@Controller('registrations')
@UseGuards(JwtAuthGuard)
export class RegistrationsController {
  constructor(private readonly registrationsService: RegistrationsService) {}

  @Post('events/:eventId')
  registerForEvent(
    @Param('eventId', ParseUUIDPipe) eventId: string,
    @Body() dto: RegisterForEventDto,
    @Req() req: { user: JwtPayload },
  ) {
    return this.registrationsService.registerForEvent(
      req.user.sub,
      eventId,
      dto,
    );
  }

  @Patch(':id/approve')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  approve(@Param('id', ParseUUIDPipe) id: string) {
    return this.registrationsService.approveRegistration(id);
  }

  @Patch(':id/reject')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  reject(@Param('id', ParseUUIDPipe) id: string) {
    return this.registrationsService.rejectRegistration(id);
  }

  @Get('events/:eventId')
  getByEvent(@Param('eventId', ParseUUIDPipe) eventId: string) {
    return this.registrationsService.getRegistrationsByEvent(eventId);
  }
}
