import { IsUUID } from 'class-validator';

export class GetHistoryDto {
  @IsUUID()
  conversationId: string;
}
