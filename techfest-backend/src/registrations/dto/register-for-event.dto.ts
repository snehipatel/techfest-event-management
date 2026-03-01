import { IsOptional, IsUUID } from 'class-validator';

export class RegisterForEventDto {
  @IsOptional()
  @IsUUID()
  teamId?: string;
}
