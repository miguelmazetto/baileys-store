"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const library_1 = require("@prisma/client/runtime/library");
const shared_1 = require("../shared");
const utils_1 = require("../utils");
function contactHandler(sessionId, event) {
    const prisma = (0, shared_1.usePrisma)();
    const logger = (0, shared_1.useLogger)();
    let listening = false;
    const set = async ({ contacts }) => {
        try {
            const contactIds = contacts.map((c) => c.id);
            const deletedOldContactIds = (await prisma.waContact.findMany({
                select: { id: true },
                where: { id: { notIn: contactIds }, sessionId },
            })).map((c) => c.id);
            const upsertPromises = contacts
                .map((c) => (0, utils_1.transformPrisma)(c))
                .map((data) => prisma.waContact.upsert({
                select: { pkId: true },
                create: Object.assign(Object.assign({}, data), { sessionId }),
                update: data,
                where: { sessionId_id: { id: data.id, sessionId } },
            }));
            await Promise.any([
                ...upsertPromises,
                prisma.waContact.deleteMany({ where: { id: { in: deletedOldContactIds }, sessionId } }),
            ]);
            logger.info({ deletedContacts: deletedOldContactIds.length, newContacts: contacts.length }, 'Synced contacts');
        }
        catch (e) {
            logger.error(e, 'An error occured during contacts set');
        }
    };
    const upsert = async (contacts) => {
        try {
            await Promise.any(contacts
                .map((c) => (0, utils_1.transformPrisma)(c))
                .map((data) => prisma.waContact.upsert({
                select: { pkId: true },
                create: Object.assign(Object.assign({}, data), { sessionId }),
                update: data,
                where: { sessionId_id: { id: data.id, sessionId } },
            })));
        }
        catch (e) {
            logger.error(e, 'An error occured during contacts upsert');
        }
    };
    const update = async (updates) => {
        for (const updateData of updates) {
            try {
                const data = (0, utils_1.transformPrisma)(updateData);
                const contactExists = await prisma.waContact.findUnique({
                    where: { sessionId_id: { id: data.id, sessionId } },
                });
                if (contactExists) {
                    await prisma.waContact.update({
                        select: { pkId: true },
                        data: data,
                        where: { sessionId_id: { id: data.id, sessionId } },
                    });
                }
            }
            catch (e) {
                if (e instanceof library_1.PrismaClientKnownRequestError && e.code === 'P2025') {
                    return logger.info({ updateData }, 'Got update for non existent contact');
                }
                logger.error(e, 'An error occured during contact update');
            }
        }
    };
    const listen = () => {
        if (listening)
            return;
        event.on('messaging-history.set', set);
        event.on('contacts.upsert', upsert);
        event.on('contacts.update', update);
        listening = true;
    };
    const unlisten = () => {
        if (!listening)
            return;
        event.off('messaging-history.set', set);
        event.off('contacts.upsert', upsert);
        event.off('contacts.update', update);
        listening = false;
    };
    return { listen, unlisten };
}
exports.default = contactHandler;
