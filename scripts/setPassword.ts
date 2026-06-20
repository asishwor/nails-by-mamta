import { PrismaClient } from '@prisma/client'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import bcrypt from 'bcryptjs'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  const hash = await bcrypt.hash('mamtanails2026', 10)
  
  const settings = await prisma.adminSettings.findFirst()
  if (settings) {
    await prisma.adminSettings.update({
      where: { id: settings.id },
      data: { passwordHash: hash }
    })
    console.log('Password set for existing settings')
  } else {
    await prisma.adminSettings.create({
      data: {
        id: 'default',
        workingDays: [1, 2, 3, 4, 5, 6],
        startTime: '09:00:00',
        endTime: '18:00:00',
        bufferTimeMinutes: 15,
        passwordHash: hash
      }
    })
    console.log('Created default settings with password')
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
