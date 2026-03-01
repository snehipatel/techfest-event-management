import { IsDateString, IsOptional, IsString, IsUUID, MinLength } from 'class-validator';

export class CreateTaskDto {
  @IsString()
  @MinLength(1)
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsDateString()
  deadline: string;

  @IsUUID()
  eventId: string;

  @IsUUID()
  assignedToId: string;
}
