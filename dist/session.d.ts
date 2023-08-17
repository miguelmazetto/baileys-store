import type { AuthenticationCreds, SignalDataTypeMap } from '@whiskeysockets/baileys';
export declare function useSession(sessionId: string): Promise<{
    state: {
        creds: AuthenticationCreds;
        keys: {
            get: <T extends keyof SignalDataTypeMap>(type: T, ids: string[]) => Promise<{
                [key: string]: SignalDataTypeMap[T];
            }>;
            set: (data: any) => Promise<void>;
        };
    };
    saveCreds: () => Promise<void>;
}>;
