"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Repro for notifyJobEvent with 4 channels (2 healthy, 2 failing).
 * - Seed: ch-webhook-primary (9000), ch-webhook-secondary (9001).
 * - Extra: ch-webhook-tertiary (9000), ch-webhook-failing2 (9001).
 *
 * Run: npm run build && node dist/scripts/repro7.js
 * Or use "Debug: Script" (may need to run the built file if ts-node reports type errors).
 */
const db_1 = require("../db/db");
const notificationService_1 = require("../services/notificationService");
const seed_1 = require("../db/seed");
async function main() {
    const db = new db_1.InMemoryDatabase();
    await (0, seed_1.seedDatabase)(db); // adds ch-webhook-primary (9000) and ch-webhook-secondary (9001)
    // Add more channels: one healthy, one failing (endpoint with localhost:9001 fails)
    const extraChannels = [
        { id: 'ch-webhook-tertiary', type: 'webhook', endpoint: 'http://localhost:9000/events-2', active: true },
        { id: 'ch-webhook-failing2', type: 'webhook', endpoint: 'http://localhost:9001/events-2', active: true },
    ];
    for (const ch of extraChannels) {
        await db.insertChannel(ch);
    }
    const service = new notificationService_1.NotificationService(db);
    const payload = {
        event: 'job.completed',
        job: {
            id: 'j1',
            type: 'email',
            status: 'completed',
            priority: 5,
            payload: {},
            attempts: 1,
            maxAttempts: 3,
            createdAt: new Date(),
            updatedAt: new Date(),
        },
        timestamp: new Date(),
    };
    console.log('Calling notifyJobEvent (4 active channels: 2 x localhost:9000, 2 x localhost:9001)...');
    try {
        const results = await service.notifyJobEvent(payload);
        const ok = results.filter(r => r.success);
        const failed = results.filter(r => !r.success);
        console.log('Resolved. Succeeded:', ok.length, 'Failed:', failed.length);
        if (failed.length > 0) {
            console.log('Failures (surfaced to caller):', failed);
        }
    }
    catch (err) {
        console.log('Rejected:', err instanceof Error ? err.message : String(err));
    }
}
main();
//# sourceMappingURL=repro7.js.map