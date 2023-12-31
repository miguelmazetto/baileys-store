"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const library_1 = require("@prisma/client/runtime/library");
const shared_1 = require("../shared");
const utils_1 = require("../utils");
function groupHandler(sessionId, event) {
    const prisma = (0, shared_1.usePrisma)();
    const logger = (0, shared_1.useLogger)();
    let listening = false;
    const upsert = async (groups) => {
        try {
            await Promise.any(groups
                .map((g) => (0, utils_1.transformPrisma)(g))
                .map((data) => prisma.waGroup.upsert({
                select: { pkId: true },
                create: Object.assign(Object.assign({}, data), { sessionId }),
                update: data,
                where: { sessionId_id: { id: data.id, sessionId } },
            })));
        }
        catch (e) {
            logger.error(e, 'An error occurred during groups upsert');
        }
    };
    const update = async (updates) => {
        for (const update of updates) {
            try {
                await prisma.waGroup.update({
                    select: { pkId: true },
                    data: (0, utils_1.transformPrisma)(update),
                    where: { sessionId_id: { id: update.id, sessionId } },
                });
            }
            catch (e) {
                if (e instanceof library_1.PrismaClientKnownRequestError && e.code === 'P2025') {
                    return logger.info({ update }, 'Got update for non-existent group');
                }
                logger.error(e, 'An error occurred during group update');
            }
        }
    };
    const listen = () => {
        if (listening)
            return;
        event.on('groups.upsert', upsert);
        event.on('groups.update', update);
        listening = true;
    };
    const unlisten = () => {
        if (!listening)
            return;
        event.off('groups.upsert', upsert);
        event.off('groups.update', update);
        listening = false;
    };
    return { listen, unlisten };
}
exports.default = groupHandler;
