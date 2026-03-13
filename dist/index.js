"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = require("./db/db");
const seed_1 = require("./db/seed");
const server_1 = require("./api/server");
const logger_1 = require("./utils/logger");
const PORT = parseInt(process.env.PORT ?? '3000', 10);
async function main() {
    const db = new db_1.InMemoryDatabase();
    logger_1.logger.info('Seeding database...');
    await (0, seed_1.seedDatabase)(db);
    logger_1.logger.info(`Seeded ${db.getJobCount()} jobs`);
    const app = (0, server_1.createApp)(db);
    app.listen(PORT, () => {
        logger_1.logger.info(`Flowmatic listening on http://localhost:${PORT}`);
        logger_1.logger.info('Routes: GET /health  |  GET/POST /api/jobs  |  GET /api/jobs/:id');
    });
}
main().catch(err => {
    logger_1.logger.error('Fatal startup error', err);
    process.exit(1);
});
//# sourceMappingURL=index.js.map