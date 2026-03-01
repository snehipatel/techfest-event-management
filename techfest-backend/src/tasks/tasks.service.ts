import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { Prisma, TaskStatus, Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { AssignTaskDto } from './dto/assign-task.dto';
import { UpdateTaskStatusDto } from './dto/update-task-status.dto';
import { JwtPayload } from '../auth/jwt.strategy';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { UpdateTaskDto } from './dto/update-task.dto';

@Injectable()
export class TasksService {
  private transporter: nodemailer.Transporter | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {
    const host = this.config.get('SMTP_HOST');
    const port = this.config.get('SMTP_PORT');
    const user = this.config.get('SMTP_USER');
    const pass = this.config.get('SMTP_PASS');

    if (host && user && pass) {
      this.transporter = nodemailer.createTransport({
        host,
        port: port ? parseInt(port, 10) : 587,
        secure: port === '465',
        auth: { user, pass },
      });
    }
  }

  async create(dto: CreateTaskDto, currentUser: JwtPayload) {
    const creator = await this.prisma.user.findUnique({
      where: { id: currentUser.sub },
    });
  
    const targetUser = await this.prisma.user.findUnique({
      where: { id: dto.assignedToId },
      select: {
        id: true,
        role: true,
        reportsToId: true,
        name: true,
      },
    });
  
    if (!creator || !targetUser)
      throw new NotFoundException('User not found');
  
    // 🔒 ROLE ENFORCEMENT
  
    if (creator.role === Role.VOLUNTEER) {
      throw new ForbiddenException('Volunteers cannot assign tasks');
    }
  
    if (creator.role === Role.TEAM_LEAD && targetUser.role !== Role.VOLUNTEER) {
      throw new ForbiddenException(
        'Team Leads can assign only to Volunteers',
      );
    }
  
    if (creator.role === Role.ADMIN && targetUser.role !== Role.TEAM_LEAD) {
      throw new ForbiddenException(
        'Admins can assign only to Team Leads',
      );
    }
  
    // 🔒 OPTIONAL: strict hierarchy validation
    if (targetUser.reportsToId !== creator.id && creator.role !== Role.SUPER_ADMIN) {
      throw new ForbiddenException(
        'You can assign tasks only to your subordinates',
      );
    }
  
    const task = await this.prisma.task.create({
      data: {
        title: dto.title,
        description: dto.description,
        deadline: new Date(dto.deadline),
        eventId: dto.eventId,
        assignedToId: targetUser.id,
        assignedById: creator.id,
      },
    });
  
    await this.prisma.activityLog.create({
      data: {
        action: 'Task Created',
        details: `Task "${dto.title}" assigned to ${targetUser.name}`,
        userId: creator.id,
      },
    });
  
    return task;
  }

  async getAllTasks() {
    return this.prisma.task.findMany({
      include: {
        assignedTo: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
        assignedBy: {
          select: {
            id: true,
            name: true,
          },
        },
        event: {
          select: {
            id: true,
            title: true,
          },
        },
      },
      orderBy: { deadline: 'asc' },
    });
  }

  async assign(taskId: string, dto: AssignTaskDto, currentUser: JwtPayload) {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
    });
  
    if (!task) throw new NotFoundException('Task not found');
  
    const creator = await this.prisma.user.findUnique({
      where: { id: currentUser.sub },
    });
  
    const targetUser = await this.prisma.user.findUnique({
      where: { id: dto.assignedToId },
      select: {
        id: true,
        role: true,
        reportsToId: true,
        name: true,
      },
    });
  
    if (!creator || !targetUser)
      throw new NotFoundException('User not found');
  
    // 🔒 Same hierarchy rules
    if (creator.role === Role.VOLUNTEER)
      throw new ForbiddenException('Volunteers cannot assign');
  
    if (creator.role === Role.TEAM_LEAD && targetUser.role !== Role.VOLUNTEER)
      throw new ForbiddenException('Team Lead → Volunteer only');
  
    if (creator.role === Role.ADMIN && targetUser.role !== Role.TEAM_LEAD)
      throw new ForbiddenException('Admin → Team Lead only');
  
    const updatedTask = await this.prisma.task.update({
      where: { id: taskId },
      data: {
        assignedToId: targetUser.id,
        assignedById: creator.id,
      },
    });
  
    return updatedTask;
  }

  async updateStatus(
    id: string,
    dto: UpdateTaskStatusDto,
    user: JwtPayload,
  ) {
    const task = await this.prisma.task.findUnique({
      where: { id },
    });
  
    if (!task) {
      throw new NotFoundException('Task not found');
    }
  
    // 🔒 Volunteers can only update their own tasks, and only to COMPLETED
    if (user.role === Role.VOLUNTEER) {
      if (task.assignedToId !== user.sub) {
        throw new ForbiddenException('You cannot update this task');
      }

      if (dto.status !== TaskStatus.COMPLETED) {
        throw new ForbiddenException('Volunteers can only mark tasks as completed');
      }
    }

    await this.prisma.activityLog.create({
      data: {
        action: "Task Status Updated",
        details: `Task "${task.title}" marked as ${dto.status}`,
        userId: user.sub,
      },
    });
  
    return this.prisma.task.update({
      where: { id },
      data: {
        status: dto.status,
        completedAt: dto.status === 'COMPLETED' ? new Date() : null,
      } as Prisma.TaskUpdateInput,
    });
  }

  async getVisibleTasks(currentUser: JwtPayload) {
    const user = await this.prisma.user.findUnique({
      where: { id: currentUser.sub },
      select: { id: true, role: true },
    });
  
    if (!user) throw new NotFoundException('User not found');
  
    // 🔥 SUPER ADMIN → everything
    if (user.role === Role.SUPER_ADMIN) {
      return this.prisma.task.findMany({
        include: {
          assignedTo: {
            select: {
              id: true,
              name: true,
              role: true,   // ✅ IMPORTANT
            },
          },
          assignedBy: {
            select: {
              id: true,
              name: true,
            },
          },
          event: true,
        },
      });
    }
    
  
    // 🔥 VOLUNTEER → only own tasks
    if (user.role === Role.VOLUNTEER) {
      return this.prisma.task.findMany({
        where: { assignedToId: user.id },
        include: {
          assignedBy: true,
          event: true,
        },
      });
    }
  
    // 🔥 TEAM LEAD → their volunteers' tasks
    if (user.role === Role.TEAM_LEAD) {
      const volunteers = await this.prisma.user.findMany({
        where: { reportsToId: user.id },
        select: { id: true },
      });
  
      const volunteerIds = volunteers.map(v => v.id);
  
      return this.prisma.task.findMany({
        where: {
          assignedToId: {
            in: volunteerIds,
          },
        },
        include: {
          assignedTo: true,
          event: true,
        },
      });
    }
  
    // 🔥 ADMIN → their team leads + their volunteers
    if (user.role === Role.ADMIN) {
      const teamLeads = await this.prisma.user.findMany({
        where: { reportsToId: user.id },
        select: { id: true },
      });
  
      const teamLeadIds = teamLeads.map(t => t.id);
  
      const volunteers = await this.prisma.user.findMany({
        where: {
          reportsToId: {
            in: teamLeadIds,
          },
        },
        select: { id: true },
      });
  
      const allIds = [
        ...teamLeadIds,
        ...volunteers.map(v => v.id),
      ];
  
      return this.prisma.task.findMany({
        where: {
          assignedToId: {
            in: allIds,
          },
        },
        include: {
          assignedTo: true,
          event: true,
        },
      });
    }
  
    return [];
  }

  async remove(id: string, currentUser: JwtPayload) {
    const task = await this.prisma.task.findUnique({ where: { id } });
  
    if (!task) throw new NotFoundException("Task not found");
  
    if (
      currentUser.role !== Role.SUPER_ADMIN &&
      currentUser.role !== Role.ADMIN
    ) {
      throw new ForbiddenException("Only Admin or Super Admin can delete tasks");
    }
  
    await this.prisma.task.delete({ where: { id } });
  
    return { message: "Task deleted" };
  }

  async update(id: string, dto: UpdateTaskDto, currentUser: JwtPayload) {
    const task = await this.prisma.task.findUnique({ where: { id } });
  
    if (!task) throw new NotFoundException("Task not found");
  
    if (
      currentUser.role !== Role.SUPER_ADMIN &&
      currentUser.role !== Role.ADMIN
    ) {
      throw new ForbiddenException("Only Admin or Super Admin can edit tasks");
    }
  
    return this.prisma.task.update({
      where: { id },
      data: {
        ...(dto.title && { title: dto.title }),
        ...(dto.description && { description: dto.description }),
        ...(dto.deadline && { deadline: new Date(dto.deadline) }),
        ...(dto.assignedToId && { assignedToId: dto.assignedToId }), // ✅ THIS IS CRITICAL
      },
    });
  }

  async getTasksByUser(userId: string) {
    return this.prisma.task.findMany({
      where: { assignedToId: userId },
      include: {
        event: { select: { id: true, title: true } },
      },
      orderBy: { deadline: 'asc' },
    });
  }
}
