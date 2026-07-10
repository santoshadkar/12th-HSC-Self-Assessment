import { PrismaClient } from "@prisma/client";
import { withAccelerate } from "@prisma/extension-accelerate";

function createPrismaClient() {
  return new PrismaClient().$extends(withAccelerate());
}

const globalForPrisma = globalThis as unknown as {
  __hscPrisma?: ReturnType<typeof createPrismaClient>;
};

export const prisma = globalForPrisma.__hscPrisma ?? (globalForPrisma.__hscPrisma = createPrismaClient());
