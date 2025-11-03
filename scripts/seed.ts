
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // Create test user for application testing
  const testUserEmail = 'john@doe.com'
  const testUserPassword = 'johndoe123'
  
  // Check if test user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email: testUserEmail }
  })

  if (!existingUser) {
    const hashedPassword = await bcrypt.hash(testUserPassword, 10)
    
    await prisma.user.create({
      data: {
        email: testUserEmail,
        password: hashedPassword,
        firstName: 'John',
        lastName: 'Doe',
        name: 'John Doe',
      }
    })
    
    console.log('Test user created successfully')
  } else {
    console.log('Test user already exists')
  }
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
