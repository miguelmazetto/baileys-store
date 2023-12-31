import type { PrismaClient } from '@prisma/client';
import type { SocketConfig } from '@whiskeysockets/baileys';
export declare function setPrisma(prismaClient: PrismaClient): void;
export declare function setLogger(pinoLogger?: SocketConfig['logger']): void;
export declare function usePrisma(): PrismaClient;
export declare function useLogger(): SocketConfig['logger'];
