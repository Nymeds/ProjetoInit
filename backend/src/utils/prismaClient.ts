// src/utils/prismaClient.ts
import { PrismaClient } from '../../generated/prisma/index.js'  // se o "package.json" tem "type": "module"

export const prisma = new PrismaClient()
