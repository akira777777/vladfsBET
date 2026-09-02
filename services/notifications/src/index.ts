export interface SendNotificationPayload {
  userId: string;
  template: string;
  channel: "EMAIL" | "IN_APP" | "PUSH" | "SMS";
  recipient: string;
  subject?: string;
  variables: Record<string, string | number | boolean>;
}

export interface NotificationDispatcherInterface {
  send(payload: SendNotificationPayload): Promise<{ success: boolean; messageId: string }>;
}

export class MockNotificationDispatcher implements NotificationDispatcherInterface {
  async send(payload: SendNotificationPayload): Promise<{ success: boolean; messageId: string }> {
    const messageId = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    console.log(`[Notification Dispatcher] Sent ${payload.channel} to ${payload.recipient} using template ${payload.template}`);
    return { success: true, messageId };
  }
}
