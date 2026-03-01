import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '@prisma/client';
import { JwtPayload } from '../auth/jwt.strategy';

@Injectable()
export class DocumentsService {
  constructor(private readonly prisma: PrismaService) {}

  async getVisibleDocuments(currentUser: JwtPayload) {
    const user = await this.prisma.user.findUnique({
      where: { id: currentUser.sub },
      select: { id: true, role: true },
    });

    if (!user) throw new NotFoundException('User not found');

    if (user.role === Role.SUPER_ADMIN) {
      return this.prisma.document.findMany({
        include: { uploader: true, team: true },
      });
    }

    if (user.role === Role.VOLUNTEER) {
      return this.prisma.document.findMany({
        where: {
          OR: [
            { uploadedBy: user.id },
            {
              access: {
                some: { userId: user.id },
              },
            },
          ],
        },
      });
    }

    if (user.role === Role.TEAM_LEAD) {
      const teams = await this.prisma.teamMember.findMany({
        where: { userId: user.id },
        select: { teamId: true },
      });

      const teamIds = teams.map(t => t.teamId);

      return this.prisma.document.findMany({
        where: { teamId: { in: teamIds } },
      });
    }

    if (user.role === Role.ADMIN) {
      const teamLeads = await this.prisma.user.findMany({
        where: { reportsToId: user.id },
        select: { id: true },
      });

      const leadIds = teamLeads.map(t => t.id);

      const teams = await this.prisma.teamMember.findMany({
        where: { userId: { in: leadIds } },
        select: { teamId: true },
      });

      const teamIds = teams.map(t => t.teamId);

      return this.prisma.document.findMany({
        where: { teamId: { in: teamIds } },
      });
    }

    return [];
  }

  async getDocumentById(id: string, currentUser: JwtPayload) {
    const doc = await this.prisma.document.findUnique({
      where: { id },
      include: { access: true },
    });

    if (!doc) throw new NotFoundException('Document not found');

    if (currentUser.role === Role.SUPER_ADMIN) return doc;

    const hasAccess =
      doc.uploadedBy === currentUser.sub ||
      doc.access.some(a => a.userId === currentUser.sub);

    if (!hasAccess)
      throw new ForbiddenException('Access denied');

    return doc;
  }
}