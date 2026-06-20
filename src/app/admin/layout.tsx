'use client'

import { CalendarDays, Image as ImageIcon, KeyRound, LayoutDashboard, LogOut, Scissors, Settings } from 'lucide-react'
import { signOut } from 'next-auth/react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ReactNode } from 'react'

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname()

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/login' })
  }

  const navLinks = [
    { href: '/admin/overview', label: 'Overview', icon: LayoutDashboard },
    { href: '/admin', label: 'Bookings', icon: CalendarDays },
    { href: '/admin/services', label: 'Services', icon: Scissors },
    { href: '/admin/gallery', label: 'Gallery', icon: ImageIcon },
    { href: '/admin/settings/ai-keys', label: 'AI Keys', icon: KeyRound },
    { href: '/admin/settings', label: 'Settings', icon: Settings }
  ]

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-zinc-950">
      {/* Sidebar */}
      <aside className="w-64 bg-white dark:bg-zinc-900 border-r shadow-sm hidden md:flex flex-col">
        <div className="p-6 border-b flex items-center justify-center">
          <Image src="/logo.png" alt="Nails By Mamta Logo" width={140} height={48} className="object-contain" />
        </div>
        <nav className="flex-1 p-4 space-y-2">
          {navLinks.map((link) => {
            const Icon = link.icon
            const isActive = pathname === link.href
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive
                    ? 'bg-rose-50 text-rose-600 dark:bg-zinc-800 dark:text-white font-semibold'
                    : 'text-slate-600 hover:bg-rose-50 hover:text-rose-600 dark:text-slate-400 dark:hover:bg-zinc-800 dark:hover:text-white font-medium'
                  }`}
              >
                <Icon className="w-5 h-5" />
                <span>{link.label}</span>
              </Link>
            )
          })}
        </nav>
        <div className="p-4 border-t space-y-2">
          <Link href="/" className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors w-full">
            <span className="font-medium">Live Site</span>
          </Link>
          <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-3 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors w-full text-left">
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Log out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}
