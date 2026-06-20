import { prisma } from '../src/utils/prisma'
import bcrypt from 'bcryptjs'

async function main() {
  const adminEmail = 'admin@nailbymamta.com'
  const password = 'mamtanails2026'

  console.log(`Seeding admin user: ${adminEmail}`)

  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail }
  })

  if (existingAdmin) {
    console.log('Admin already exists. Updating password...')
    const hash = await bcrypt.hash(password, 10)
    await prisma.user.update({
      where: { email: adminEmail },
      data: { passwordHash: hash }
    })
    console.log('Password updated.')
  } else {
    const hash = await bcrypt.hash(password, 10)
    await prisma.user.create({
      data: {
        name: 'Mamta Admin',
        email: adminEmail,
        passwordHash: hash,
        role: 'ADMIN'
      }
    })
    console.log('Admin user created successfully.')
  }

  // Also ensure AdminSettings exist
  const settings = await prisma.adminSettings.findFirst()
  if (!settings) {
    await prisma.adminSettings.create({
      data: {
        id: 'default',
        workingDays: [1, 2, 3, 4, 5, 6],
        startTime: '09:00:00',
        endTime: '18:00:00',
        bufferTimeMinutes: 15
      }
    })
    console.log('Default business settings created.')
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
