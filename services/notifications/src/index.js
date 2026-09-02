export class MockNotificationDispatcher {
    async send(payload) {
        const messageId = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
        console.log(`[Notification Dispatcher] Sent ${payload.channel} to ${payload.recipient} using template ${payload.template}`);
        return { success: true, messageId };
    }
}
