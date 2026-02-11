import { IsString } from 'class-validator';

export class CreateConversationDto {
  participantsIds: string[];

  @IsString()
  name: string;
}
