'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { format } from 'date-fns'
import { Plus, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import { ManualBookingDialog } from '@/components/admin/ManualBookingDialog'

export default function AdminBookingsPage() {
  const t = useTranslations('Admin')
  const [bookings, setBookings] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isManualBookingOpen, setIsManualBookingOpen] = useState(false)
  
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [statusFilter, setStatusFilter] = useState('ALL')

  const fetchBookings = async () => {
    setIsLoading(true)
    try {
      const res = await fetch(`/api/admin/bookings?page=${page}&limit=10&status=${statusFilter}`)
      const data = await res.json()
      if (data.bookings) {
        setBookings(data.bookings)
        setTotalPages(data.pagination?.totalPages || 1)
      }
    } catch (err) {
      toast.error(t('failedToLoad'))
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchBookings()
  }, [page, statusFilter])

  const handleStatusChange = async (id: string, status: string) => {
    try {
      const res = await fetch(`/api/admin/bookings/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      })
      if (!res.ok) throw new Error('Failed to update status')
      toast.success(t('statusUpdated'))
      // Refetch to ensure pagination stays correct
      fetchBookings()
    } catch (err) {
      toast.error(t('errorUpdating'))
    }
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-light text-slate-800 dark:text-white">{t('title')}</h1>
          <p className="text-slate-500 mt-1">{t('subtitle')}</p>
        </div>
        <Button onClick={() => setIsManualBookingOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          {t('addAppointment')}
        </Button>
      </div>

      <div className="mb-6">
        <Tabs value={statusFilter} onValueChange={(val) => { setStatusFilter(val); setPage(1); }}>
          <TabsList className="bg-white dark:bg-zinc-900 border">
            <TabsTrigger value="ALL">{t('all')}</TabsTrigger>
            <TabsTrigger value="PENDING">{t('pending')}</TabsTrigger>
            <TabsTrigger value="CONFIRMED">{t('confirmed')}</TabsTrigger>
            <TabsTrigger value="COMPLETED">{t('completed')}</TabsTrigger>
            <TabsTrigger value="CANCELLED">{t('cancelled')}</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="bg-white dark:bg-zinc-900 border rounded-xl overflow-hidden shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('dateTime')}</TableHead>
              <TableHead>{t('client')}</TableHead>
              <TableHead>{t('service')}</TableHead>
              <TableHead>{t('status')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={4} className="text-center py-8">{t('loading')}</TableCell></TableRow>
            ) : bookings.length === 0 ? (
              <TableRow><TableCell colSpan={4} className="text-center py-8 text-slate-500">{t('noBookings')}</TableCell></TableRow>
            ) : (
              bookings.map((booking) => (
                <TableRow key={booking.id}>
                  <TableCell className="font-medium">
                    {format(new Date(booking.startTime), 'MMM d, yyyy h:mm a')}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span>{booking.user?.name}</span>
                      <span className="text-xs text-slate-500">{booking.user?.email}</span>
                      {booking.user?.phone && <span className="text-xs text-slate-500">{booking.user?.phone}</span>}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span>{booking.service?.name}</span>
                      {booking.status === 'CANCELLED' && booking.cancelReason && (
                        <span className="text-xs text-red-500 mt-1">{t('reason')} {booking.cancelReason}</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Select value={booking.status} onValueChange={(val: string | null) => val && handleStatusChange(booking.id, val)}>
                      <SelectTrigger className="w-[140px] h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PENDING">{t('pending')}</SelectItem>
                        <SelectItem value="CONFIRMED">{t('confirmed')}</SelectItem>
                        <SelectItem value="COMPLETED">{t('completed')}</SelectItem>
                        <SelectItem value="CANCELLED">{t('cancelled')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        
        {/* Pagination Controls */}
        {!isLoading && totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t">
            <div className="text-sm text-slate-500">
              {t('pageOf', { page, totalPages })}
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                <ChevronLeft className="w-4 h-4 mr-1" /> {t('previous')}
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                {t('next')} <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </div>

      <ManualBookingDialog 
        isOpen={isManualBookingOpen} 
        onClose={() => setIsManualBookingOpen(false)} 
        onSuccess={fetchBookings} 
      />
    </div>
  )
}
