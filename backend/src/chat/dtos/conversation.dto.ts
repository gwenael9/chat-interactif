import { IsString, IsArray, IsUUID } from 'class-validator';

export class CreateConversationDto {
  @IsArray()
  @IsUUID('4', { each: true })
  participantsIds: string[];

  @IsString()
  name: string;
}
