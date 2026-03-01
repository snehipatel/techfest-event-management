import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { RegistrationStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterForEventDto } from './dto/register-for-event.dto';
import { JwtPayload } from '../auth/jwt.strategy';

@Injectable()
export class RegistrationsService {
  constructor(private readonly prisma: PrismaService) {}

  async registerForEvent(userId: string, eventId: string, dto: RegisterForEventDto) {
    const event = await this.prisma.event.findUnique({ where: { id: eventId } });
    if (!event) throw new NotFoundException('Event not found');

    const existing = await this.prisma.registration.findFirst({
      where: { userId, eventId },
    });
    if (existing) throw new ConflictException('Already registered for this event');

    const approvedCount = await this.prisma.registration.count({
      where: { eventId, status: RegistrationStatus.APPROVED },
    });
    if (approvedCount >= event.maxParticipants) {
      throw new BadRequestException('Event has reached max participants');
    }

    if (dto.teamId) {
      const team = await this.prisma.team.findFirst({
        where: { id: dto.teamId, eventId },
      });
      if (!team) throw new NotFoundException('Team not found for this event');
    }

    return this.prisma.registration.create({
      data: {
        userId,
        eventId,
        teamId: dto.teamId,
        status: RegistrationStatus.PENDING,
      },
      include: {
        event: { select: { id: true, title: true } },
        user: { select: { id: true, name: true, email: true } },
      },
    });
  }

  async approveRegistration(registrationId: string) {
    const reg = await this.prisma.registration.findUnique({
      where: { id: registrationId },
      include: { event: true },
    });
    if (!reg) throw new NotFoundException('Registration not found');
    if (reg.status !== RegistrationStatus.PENDING) {
      throw new BadRequestException('Registration is not pending');
    }

    const approvedCount = await this.prisma.registration.count({
      where: { eventId: reg.eventId, status: RegistrationStatus.APPROVED },
    });
    if (approvedCount >= reg.event.maxParticipants) {
      throw new BadRequestException('Event has reached max participants');
    }

    return this.prisma.registration.update({
      where: { id: registrationId },
      data: { status: RegistrationStatus.APPROVED },
      include: {
        event: { select: { id: true, title: true } },
        user: { select: { id: true, name: true, email: true } },
      },
    });
  }

  async rejectRegistration(registrationId: string) {
    const reg = await this.prisma.registration.findUnique({
      where: { id: registrationId },
    });
    if (!reg) throw new NotFoundException('Registration not found');
    if (reg.status !== RegistrationStatus.PENDING) {
      throw new BadRequestException('Registration is not pending');
    }

    return this.prisma.registration.update({
      where: { id: registrationId },
      data: { status: RegistrationStatus.REJECTED },
      include: {
        event: { select: { id: true, title: true } },
        user: { select: { id: true, name: true, email: true } },
      },
    });
  }

  async getRegistrationsByEvent(eventId: string) {
    const event = await this.prisma.event.findUnique({ where: { id: eventId } });
    if (!event) throw new NotFoundException('Event not found');

    return this.prisma.registration.findMany({
      where: { eventId },
      include: {
        user: { select: { id: true, name: true, email: true, role: true } },
        team: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
