import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/utils/prisma'
import { format } from 'date-fns'
import { Calendar, Clock, MapPin } from 'lucide-react'

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user) return null

  const bookings = await prisma.booking.findMany({
    where: { userId: (session.user as any).id },
    include: { service: true },
    orderBy: { startTime: 'desc' }
  })

  const now = new Date()
  const upcomingBookings = bookings.filter(b => b.startTime > now && b.status !== 'CANCELLED')
  const pastBookings = bookings.filter(b => b.startTime <= now || b.status === 'CANCELLED')

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl font-heading text-slate-800 mb-2">Welcome back, {session.user.name?.split(' ')[0]}!</h1>
        <p className="text-slate-600">Here is your appointment history and upcoming bookings.</p>
      </div>

      <div className="space-y-6">
        <h2 className="text-2xl font-heading text-primary border-b border-primary/10 pb-2">Upcoming Appointments</h2>
        {upcomingBookings.length === 0 ? (
          <div className="p-8 bg-white/50 backdrop-blur-md rounded-2xl border border-primary/10 text-center">
            <p className="text-slate-500">You don't have any upcoming appointments.</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {upcomingBookings.map((booking) => (
              <div key={booking.id} className="bg-white p-6 rounded-2xl shadow-sm border border-primary/20 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="font-heading text-xl">{booking.service.name}</h3>
                  <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-semibold tracking-wider">
                    {booking.status}
                  </span>
                </div>
                <div className="space-y-3 text-slate-600 text-sm">
                  <p className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-primary" />
                    {format(new Date(booking.startTime), 'MMMM d, yyyy')}
                  </p>
                  <p className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-primary" />
                    {format(new Date(booking.startTime), 'h:mm a')} - {format(new Date(booking.endTime), 'h:mm a')}
                  </p>
                  <p className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-primary" />
                    Studio Location
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-6">
        <h2 className="text-2xl font-heading text-slate-700 border-b border-slate-200 pb-2">Past Appointments</h2>
        {pastBookings.length === 0 ? (
          <div className="p-8 bg-white/50 backdrop-blur-md rounded-2xl border border-slate-200 text-center">
            <p className="text-slate-500">No past appointments yet.</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {pastBookings.map((booking) => (
              <div key={booking.id} className="bg-slate-50 p-6 rounded-2xl border border-slate-200 opacity-80">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="font-heading text-lg text-slate-700">{booking.service.name}</h3>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold tracking-wider ${booking.status === 'CANCELLED' ? 'bg-red-100 text-red-700' : 'bg-slate-200 text-slate-700'}`}>
                    {booking.status}
                  </span>
                </div>
                <div className="space-y-2 text-slate-500 text-sm">
                  <p className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    {format(new Date(booking.startTime), 'MMMM d, yyyy')}
                  </p>
                  <p className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    {format(new Date(booking.startTime), 'h:mm a')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
