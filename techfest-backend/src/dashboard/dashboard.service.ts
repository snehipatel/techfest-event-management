import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getAdminStats() {
    const [totalUsers, totalEvents, totalRegistrations, registrationsPerEvent] =
      await Promise.all([
        this.prisma.user.count(),
        this.prisma.event.count(),
        this.prisma.registration.count(),
        this.prisma.registration.groupBy({
          by: ['eventId'],
          _count: { id: true },
          orderBy: { _count: { id: 'desc' } },
        }),
      ]);

    const eventIds = registrationsPerEvent.map((r) => r.eventId);
    const events =
      eventIds.length > 0
        ? await this.prisma.event.findMany({
            where: { id: { in: eventIds } },
            select: { id: true, title: true },
          })
        : [];
    const eventMap = new Map(events.map((e) => [e.id, e.title]));

    const registrationsByEvent = registrationsPerEvent.map((r) => ({
      eventId: r.eventId,
      eventTitle: eventMap.get(r.eventId) ?? null,
      count: r._count.id,
    }));

    return {
      totalUsers,
      totalEvents,
      totalRegistrations,
      registrationsByEvent,
    };
  }
}
