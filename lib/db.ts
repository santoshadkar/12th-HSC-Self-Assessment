import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { __hscPrisma?: PrismaClient };

export const prisma: PrismaClient =
  globalForPrisma.__hscPrisma ?? (globalForPrisma.__hscPrisma = new PrismaClient());
