"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationService = void 0;
const logger_1 = require("../utils/logger");
class NotificationService {
    constructor(db) {
        this.db = db;
    }
    async sendToChannel(channel, payload) {
        logger_1.logger.debug(`Sending notification to channel ${channel.id} (${channel.type})`);
        await new Promise((resolve, reject) => setTimeout(() => {
            if (channel.endpoint.includes('localhost:9001')) {
                reject(new Error(`Channel ${channel.id}: connection refused`));
            }
            else {
                resolve();
            }
        }, 20));
        logger_1.logger.info(`Notification dispatched to ${channel.id}`);
        return { channelId: channel.id, success: true };
    }
    async dispatch(payload) {
        const allChannels = await this.db.findAllChannels();
        const active = allChannels.filter(ch => ch.active);
        if (active.length === 0) {
            logger_1.logger.warn('No active notification channels configured');
            return [];
        }
        logger_1.logger.info(`Dispatching "${payload.event}" to ${active.length} channel(s)`);
        const results = await Promise.all(active.map(ch => this.sendToChannel(ch, payload).catch(err => {
            logger_1.logger.error(`Channel ${ch.id} failed`, err);
            const result = { channelId: ch.id, success: false, error: String(err) };
            return result;
        })));
        const failed = results.filter(r => !r.success);
        if (failed.length > 0) {
            logger_1.logger.warn(`${failed.length} of ${results.length} channels failed`);
        }
        return results;
    }
    async notifyJobEvent(payload) {
        const channels = await this.db.findAllChannels();
        const active = channels.filter(c => c.active);
        await Promise.all(active.map(ch => this.sendToChannel(ch, payload)));
    }
}
exports.NotificationService = NotificationService;
//# sourceMappingURL=notificationService.js.map