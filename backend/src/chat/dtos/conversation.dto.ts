import { IsString, IsArray } from 'class-validator';

export class CreateConversationDto {
  @IsArray()
  participantsIds: string[];

  @IsString()
  name: string;
}
