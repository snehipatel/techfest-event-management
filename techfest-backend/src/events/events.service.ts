import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { Req } from '@nestjs/common';
import { JwtPayload } from '../auth/jwt.strategy';

@Injectable()
export class EventsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateEventDto, currentUser: JwtPayload) {
    const event = await this.prisma.event.create({
      data: {
        title: dto.title,
        description: dto.description,
        location: dto.location,
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
        maxParticipants: dto.maxParticipants,
      },
    });
  
    await this.prisma.activityLog.create({
      data: {
        action: "Event Created",
        details: `Event "${event.title}" created`,
        userId: currentUser.sub,
      },
    });
  
    return event;
  }

  async findAll() {
    return this.prisma.event.findMany({
      orderBy: { startDate: 'asc' },
    });
  }

  async findOne(id: string) {
    const event = await this.prisma.event.findUnique({
      where: { id },
      include: {
        _count: { select: { registrations: true } },
      },
    });
    if (!event) throw new NotFoundException('Event not found');
    return event;
  }

  async update(id: string, dto: UpdateEventDto, currentUser: JwtPayload) {
    const event = await this.prisma.event.findUnique({ where: { id } });
    if (!event) throw new NotFoundException('Event not found');

    await this.prisma.activityLog.create({
      data: {
        action: "Event Updated",
        details: `Event "${event.title}" updated`,
        userId: currentUser.sub,
      },
    });

    return this.prisma.event.update({
      where: { id },
      data: {
        ...(dto.title != null && { title: dto.title }),
        ...(dto.description != null && { description: dto.description }),
        ...(dto.location !== undefined && { location: dto.location }),
        ...(dto.startDate != null && { startDate: new Date(dto.startDate) }),
        ...(dto.endDate != null && { endDate: new Date(dto.endDate) }),
        ...(dto.maxParticipants != null && {
          maxParticipants: dto.maxParticipants,
        }),
      },
    });
  }

  async remove(id: string, currentUser: JwtPayload) {
  const event = await this.prisma.event.findUnique({ where: { id } });
  if (!event) throw new NotFoundException('Event not found');

  await this.prisma.event.delete({ where: { id } });

  await this.prisma.activityLog.create({
    data: {
      action: "Event Deleted",
      details: `Event "${event.title}" deleted`,
      userId: currentUser.sub,
    },
  });

  return { message: 'Event deleted' };
}
}
