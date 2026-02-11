import { IsUUID } from 'class-validator';

export class JoinRoomDto {
  @IsUUID()
  conversationId: string;
}
