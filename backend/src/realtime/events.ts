import { EventEmitter } from "node:events";

export interface RealtimeMessage {
  type: "notification" | "otp" | "number" | "order" | "topup" | "refund";
  data: unknown;
}

type Listener = (message: RealtimeMessage) => void;

/**
 * In-memory per-user realtime event hub (single backend instance).
 * Emitted events are pushed to subscribed SSE clients. If Redis is added
 * later, swap this for a Redis pub/sub channel keyed by user id.
 */
class RealtimeHub {
  private emitter = new EventEmitter();

  subscribe(userId: string, listener: Listener): () => void {
    const channel = `user:${userId}`;
    this.emitter.on(channel, listener);
    return () => {
      this.emitter.off(channel, listener);
    };
  }

  emitToUser(userId: string, type: RealtimeMessage["type"], data: unknown) {
    this.emitter.emit(`user:${userId}`, { type, data } satisfies RealtimeMessage);
  }
}

export const realtime = new RealtimeHub();
