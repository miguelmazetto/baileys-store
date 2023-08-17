import type { BaileysEventEmitter } from '@whiskeysockets/baileys';
export default function groupHandler(sessionId: string, event: BaileysEventEmitter): {
    listen: () => void;
    unlisten: () => void;
};
