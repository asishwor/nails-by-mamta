'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { format } from 'date-fns'

interface CustomerStats {
  total: number
  completed: number
  cancelled: number
  pending: number
  confirmed: number
  revenue: number
}

interface Customer {
  id: string
  name: string
  email: string
  phone: string
  createdAt: string
  stats: CustomerStats
  trustLabel: string
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchCustomers()
  }, [])

  const fetchCustomers = async () => {
    try {
      const res = await fetch('/api/admin/customers')
      const data = await res.json()
      setCustomers(data.customers || [])
    } catch (err) {
      console.error('Failed to fetch customers', err)
    } finally {
      setIsLoading(false)
    }
  }

  const getLabelColor = (label: string) => {
    switch (label) {
      case 'Loyal': return 'bg-emerald-100 text-emerald-800 border-emerald-200'
      case 'High Cancellation': return 'bg-red-100 text-red-800 border-red-200'
      case 'Regular': return 'bg-blue-100 text-blue-800 border-blue-200'
      default: return 'bg-slate-100 text-slate-800 border-slate-200'
    }
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Customers & Loyalty</h1>
          <p className="text-slate-500 mt-2">Track customer booking stats and trust scores</p>
        </div>
      </div>

      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="bg-slate-50/50 border-b border-slate-100">
          <CardTitle>Customer Directory</CardTitle>
          <CardDescription>A list of all users and their booking activity.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center text-slate-500">Loading customers...</div>
          ) : customers.length === 0 ? (
            <div className="p-8 text-center text-slate-500">No customers found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-slate-500 bg-slate-50 uppercase border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4 font-medium">Customer Info</th>
                    <th className="px-6 py-4 font-medium text-center">Status</th>
                    <th className="px-6 py-4 font-medium text-center">Total</th>
                    <th className="px-6 py-4 font-medium text-center text-emerald-600">Completed</th>
                    <th className="px-6 py-4 font-medium text-center text-red-600">Cancelled</th>
                    <th className="px-6 py-4 font-medium text-right">Revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {customers.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-900">{c.name || 'Anonymous'}</div>
                        <div className="text-slate-500">{c.email || c.phone || 'No contact'}</div>
                        <div className="text-xs text-slate-400 mt-1">Joined {format(new Date(c.createdAt), 'MMM yyyy')}</div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getLabelColor(c.trustLabel)}`}>
                          {c.trustLabel}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center font-medium text-slate-700">{c.stats.total}</td>
                      <td className="px-6 py-4 text-center text-emerald-600 font-medium">{c.stats.completed}</td>
                      <td className="px-6 py-4 text-center text-red-600 font-medium">{c.stats.cancelled}</td>
                      <td className="px-6 py-4 text-right font-medium text-slate-900">Rs. {c.stats.revenue}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
