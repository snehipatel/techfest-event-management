import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ActivityLogsService {
  constructor(private prisma: PrismaService) {}

  async getAll() {
    const logs = await this.prisma.activityLog.findMany({
      include: {
        user: {
          select: { name: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return logs.map((log) => ({
      id: log.id,
      action: log.action,
      details: log.details,
      user: log.user.name,
      createdAt: log.createdAt,
    }));
  }

  async create(action: string, userId: string, details: string) {
    return this.prisma.activityLog.create({
      data: { action, userId, details },
    });
  }
}