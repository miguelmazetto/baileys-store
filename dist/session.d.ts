import type { AuthenticationCreds, SignalDataTypeMap } from '@adiwajshing/baileys';
import { proto } from '@adiwajshing/baileys';
export declare function useSession(sessionId: string): Promise<{
    state: {
        creds: AuthenticationCreds;
        keys: {
            get: (type: keyof SignalDataTypeMap, ids: string[]) => Promise<{
                [key: string]: Uint8Array | import("@adiwajshing/baileys").KeyPair | {
                    [jid: string]: boolean;
                } | proto.Message.IAppStateSyncKeyData | import("@adiwajshing/baileys").LTHashState;
            }>;
            set: (data: any) => Promise<void>;
        };
    };
    saveCreds: () => Promise<void>;
}>;
