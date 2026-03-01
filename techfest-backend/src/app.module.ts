import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { EventsModule } from './events/events.module';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis/redis.module';
import { RegistrationsModule } from './registrations/registrations.module';
import { TasksModule } from './tasks/tasks.module';
import { UsersModule } from './users/users.module';
import { InvitesModule } from './invites/invites.module';
import { ActivityLogsModule } from './activity-logs/activity-logs.module';
import { DocumentsModule } from './documents/documents.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    UsersModule,
    EventsModule,
    RegistrationsModule,
    TasksModule,
    DashboardModule,
    RedisModule,
    InvitesModule,
    ActivityLogsModule,
    DocumentsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}