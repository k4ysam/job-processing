import { InMemoryDatabase } from '../db/db';
import {
  DispatchResult,
  NotificationChannel,
  NotificationPayload,
} from '../types';
import { logger } from '../utils/logger';

export class NotificationService {
  constructor(private readonly db: InMemoryDatabase) {}

  private async sendToChannel(
    channel: NotificationChannel,
    payload: NotificationPayload
  ): Promise<DispatchResult> {
    logger.debug(`Sending notification to channel ${channel.id} (${channel.type})`);

    await new Promise<void>((resolve, reject) =>
      setTimeout(() => {
        if (channel.endpoint.includes('localhost:9001')) {
          reject(new Error(`Channel ${channel.id}: connection refused`));
        } else {
          resolve();
        }
      }, 20)
    );

    logger.info(`Notification dispatched to ${channel.id}`);
    return { channelId: channel.id, success: true };
  }

  async dispatch(payload: NotificationPayload): Promise<DispatchResult[]> {
    const allChannels = await this.db.findAllChannels();
    const active = allChannels.filter(ch => ch.active);

    if (active.length === 0) {
      logger.warn('No active notification channels configured');
      return [];
    }

    logger.info(`Dispatching "${payload.event}" to ${active.length} channel(s)`);

    const results = await Promise.all(
      active.map(ch =>
        this.sendToChannel(ch, payload).catch(err => {
          logger.error(`Channel ${ch.id} failed`, err);
          const result: DispatchResult = { channelId: ch.id, success: false, error: String(err) };
          return result;
        })
      )
    );

    const failed = results.filter(r => !r.success);
    if (failed.length > 0) {
      logger.warn(`${failed.length} of ${results.length} channels failed`);
    }

    return results;
  }

  async notifyJobEvent(payload: NotificationPayload): Promise<DispatchResult[]> {
    const channels = await this.db.findAllChannels();
    const active = channels.filter(c => c.active);

    if (active.length === 0) {
      logger.warn('No active notification channels configured');
      return [];
    }

    const settled = await Promise.allSettled(active.map(ch => this.sendToChannel(ch, payload)));
    const results: DispatchResult[] = settled.map((outcome, i) => {
      if (outcome.status === 'fulfilled') {
        return outcome.value;
      }
      const ch = active[i];
      logger.error(`Channel ${ch.id} failed`, outcome.reason);
      return { channelId: ch.id, success: false, error: String(outcome.reason) };
    });
    const failed = results.filter(r => !r.success);
    if (failed.length > 0) {
      logger.warn(`${failed.length} of ${results.length} channels failed`);
    }
    return results;
  }
  
} 
