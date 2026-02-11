export class MessageCreatedEvent {
  constructor(
    public readonly conversationId: string,
    public readonly message: any,
  ) {}
}
