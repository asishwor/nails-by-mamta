import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/utils/prisma'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { LayoutDashboard, Sparkles, User as UserIcon } from 'lucide-react'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect('/login')
  }

  // Redirect admins to the admin dashboard
  if ((session.user as any).role === 'ADMIN') {
    redirect('/admin')
  }

  const user = await prisma.user.findUnique({
    where: { id: (session.user as any).id },
    select: { phone: true, address: true }
  })

  // Enforce profile completion
  if (!user?.phone || !user?.address) {
    redirect('/profile/complete')
  }

  return (
    <div className="min-h-screen bg-[#FAF5EE] text-[#16110F]">
      {/* Simple Header for Client Dashboard */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-primary/10 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="flex gap-1.5 bg-primary/10 p-2 rounded-full">
              <Sparkles className="w-4 h-4 text-primary" />
            </div>
            <span className="font-heading text-xl tracking-tight">Nails By Mamta</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="ghost" className="text-sm font-medium">
                <LayoutDashboard className="w-4 h-4 mr-2" />
                Bookings
              </Button>
            </Link>
            <Link href="/dashboard/profile">
              <Button variant="ghost" className="text-sm font-medium">
                <UserIcon className="w-4 h-4 mr-2" />
                Profile
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-6 md:p-8">
        {children}
      </main>
    </div>
  )
}
