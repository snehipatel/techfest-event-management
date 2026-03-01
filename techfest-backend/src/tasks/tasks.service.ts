import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { Prisma, TaskStatus, Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { AssignTaskDto } from './dto/assign-task.dto';
import { UpdateTaskStatusDto } from './dto/update-task-status.dto';
import { JwtPayload } from '../auth/jwt.strategy';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

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
    await this.prisma.activityLog.create({
      data: {
        action: "Task Created",
        details: `Task ${dto.title} created`,
        userId: dto.assignedTo, 
      },
    });

    const event = await this.prisma.event.findUnique({
      where: { id: dto.eventId },
    });
    if (!event) throw new NotFoundException('Event not found');
  
    const user = await this.prisma.user.findUnique({
      where: { id: dto.assignedTo },
    });
    if (!user) throw new NotFoundException('User not found');
  
    const task = await this.prisma.task.create({
      data: {
        title: dto.title,
        description: dto.description,
        deadline: new Date(dto.deadline),
        eventId: dto.eventId,
        assignedTo: dto.assignedTo,
      },
    });
  
    // 📧 SEND EMAIL
    if (this.transporter) {
      try {
        await this.transporter.sendMail({
          from: this.config.get('SMTP_FROM'),
          to: user.email,
          subject: `New Task Assigned: ${dto.title}`,
          html: `
            <h2>You have been assigned a new task</h2>
            <p><strong>Title:</strong> ${dto.title}</p>
            <p><strong>Description:</strong> ${dto.description}</p>
            <p><strong>Deadline:</strong> ${new Date(dto.deadline).toLocaleString()}</p>
            <p><strong>Event:</strong> ${event.title}</p>
            <br/>
            <p>Please log in to the portal to view details.</p>
          `,
        });
      } catch (err) {
        console.error('Email failed:', err);
      }
    }

    await this.prisma.activityLog.create({
      data: {
        action: "Task Created",
        details: `Task "${dto.title}" created for ${user.name}`,
        userId: currentUser.sub, // 🔥 who created the task
      },
    });
  
    return task;
  }

  async assign(taskId: string, dto: AssignTaskDto, currentUser: JwtPayload) {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
    });
    if (!task) throw new NotFoundException('Task not found');
  
    const user = await this.prisma.user.findUnique({
      where: { id: dto.assignedTo },
    });
    if (!user) throw new NotFoundException('User not found');
  
    const updatedTask = await this.prisma.task.update({
      where: { id: taskId },
      data: { assignedTo: dto.assignedTo },
    });
  
    // 📧 SEND EMAIL
    if (this.transporter) {
      await this.transporter.sendMail({
        from: this.config.get('SMTP_FROM'),
        to: user.email,
        subject: `Task Assigned to You`,
        html: `
          <h2>You have been assigned a task</h2>
          <p><strong>Task:</strong> ${task.title}</p>
          <p>Please log in to check details.</p>
        `,
      });
    }

    await this.prisma.activityLog.create({
      data: {
        action: "Task Assigned",
        details: `Task "${task.title}" assigned to ${user.name}`,
        userId: currentUser.sub,
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
      if (task.assignedTo !== user.sub) {
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

  async getAllTasks() {
    return this.prisma.task.findMany({
      include: {
        user: true,
        event: true,
      },
    });
  }

  async getTasksByUser(userId: string) {
    return this.prisma.task.findMany({
      where: { assignedTo: userId },
      include: {
        event: { select: { id: true, title: true } },
      },
      orderBy: { deadline: 'asc' },
    });
  }
}
