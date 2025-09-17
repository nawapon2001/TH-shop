import { PrismaClient } from '../generated/prisma'

declare global {
  var prisma: PrismaClient | undefined
}

// Ensure that we have a singleton instance of PrismaClient in development
const prisma = globalThis.prisma || new PrismaClient()

if (process.env.NODE_ENV === 'development') {
  globalThis.prisma = prisma
}

export default prisma
