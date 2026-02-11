import { IsUUID } from 'class-validator';

export class MarkAsReadDto {
  @IsUUID()
  conversationId: string;

  @IsUUID()
  messageId: string;

  @IsUUID()
  userId: string;
}
