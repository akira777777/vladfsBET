export interface SendNotificationPayload {
    userId: string;
    template: string;
    channel: "EMAIL" | "IN_APP" | "PUSH" | "SMS";
    recipient: string;
    subject?: string;
    variables: Record<string, string | number | boolean>;
}
export interface NotificationDispatcherInterface {
    send(payload: SendNotificationPayload): Promise<{
        success: boolean;
        messageId: string;
    }>;
}
export declare class MockNotificationDispatcher implements NotificationDispatcherInterface {
    send(payload: SendNotificationPayload): Promise<{
        success: boolean;
        messageId: string;
    }>;
}
