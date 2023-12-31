"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const runtime_1 = require("@prisma/client/runtime");
const shared_1 = require("../shared");
const utils_1 = require("../utils");
function chatHandler(sessionId, event) {
    const prisma = (0, shared_1.usePrisma)();
    const logger = (0, shared_1.useLogger)();
    let listening = false;
    const set = async ({ chats, isLatest }) => {
        try {
            await prisma.$transaction(async (tx) => {
                if (isLatest)
                    await tx.waChat.deleteMany({ where: { sessionId } });
                const existingIds = (await tx.waChat.findMany({
                    select: { id: true },
                    where: { id: { in: chats.map((c) => c.id) }, sessionId },
                })).map((i) => i.id);
                const chatsAdded = (await tx.waChat.createMany({
                    data: chats
                        .filter((c) => !existingIds.includes(c.id))
                        .map((c) => (Object.assign(Object.assign({}, (0, utils_1.transformPrisma)(c)), { sessionId }))),
                })).count;
                logger.info({ chatsAdded }, 'Synced chats');
            });
        }
        catch (e) {
            logger.error(e, 'An error occured during chats set');
        }
    };
    const upsert = async (chats) => {
        try {
            await Promise.any(chats
                .map((c) => (0, utils_1.transformPrisma)(c))
                .map((data) => prisma.waChat.upsert({
                select: { pkId: true },
                create: Object.assign(Object.assign({}, data), { sessionId }),
                update: data,
                where: { sessionId_id: { id: data.id, sessionId } },
            })));
        }
        catch (e) {
            logger.error(e, 'An error occured during chats upsert');
        }
    };
    const update = async (updates) => {
        for (const updateData of updates) {
            try {
                const data = (0, utils_1.transformPrisma)(updateData);
                const chatExists = await prisma.waChat.findUnique({
                    where: { sessionId_id: { id: data.id, sessionId } },
                });
                if (chatExists) {
                    await prisma.waChat.update({
                        select: { pkId: true },
                        data: Object.assign(Object.assign({}, data), { unreadCount: typeof data.unreadCount === 'number'
                                ? data.unreadCount > 0
                                    ? { increment: data.unreadCount }
                                    : { set: data.unreadCount }
                                : undefined }),
                        where: { sessionId_id: { id: data.id, sessionId } },
                    });
                }
            }
            catch (e) {
                if (e instanceof runtime_1.PrismaClientKnownRequestError && e.code === 'P2025') {
                    return logger.info({ updateData }, 'Got update for non-existent chat');
                }
                logger.error(e, 'An error occurred during chat update');
            }
        }
    };
    const del = async (ids) => {
        try {
            await prisma.waChat.deleteMany({
                where: { id: { in: ids } },
            });
        }
        catch (e) {
            logger.error(e, 'An error occured during chats delete');
        }
    };
    const listen = () => {
        if (listening)
            return;
        event.on('messaging-history.set', set);
        event.on('chats.upsert', upsert);
        event.on('chats.update', update);
        event.on('chats.delete', del);
        listening = true;
    };
    const unlisten = () => {
        if (!listening)
            return;
        event.off('messaging-history.set', set);
        event.off('chats.upsert', upsert);
        event.off('chats.update', update);
        event.off('chats.delete', del);
        listening = false;
    };
    return { listen, unlisten };
}
exports.default = chatHandler;
