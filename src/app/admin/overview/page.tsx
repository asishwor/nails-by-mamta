'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Sparkles, Users, CalendarDays, Scissors, UserMinus, CheckCircle, XCircle } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

export default function OverviewDashboard() {
  const [data, setData] = useState<any>(null)
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null)
  const [isAiLoading, setIsAiLoading] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/admin/overview')
        const json = await res.json()
        if (json.data) setData(json.data)
      } catch (err) {
        toast.error('Failed to load dashboard data')
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [])

  const generateAiAnalysis = async () => {
    if (!data) return
    setIsAiLoading(true)
    try {
      const res = await fetch('/api/admin/analytics/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dashboardData: data })
      })
      const json = await res.json()
      if (json.analysis) {
        setAiAnalysis(json.analysis)
      } else {
        toast.error(json.error || 'Failed to generate analysis')
      }
    } catch (err) {
      toast.error('Error connecting to AI service')
    } finally {
      setIsAiLoading(false)
    }
  }

  if (isLoading) return <div className="p-8 text-slate-500">Loading Dashboard...</div>
  if (!data) return <div className="p-8 text-red-500">Error loading dashboard</div>

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-light text-slate-800 dark:text-white">Overview Dashboard</h1>
        <p className="text-slate-500 mt-1">High-level metrics and AI-driven insights for your salon.</p>
      </div>

      {/* AI Insights Panel */}
      <Card className="bg-gradient-to-r from-rose-50 to-pink-50 dark:from-rose-900/10 dark:to-pink-900/10 border-rose-100 dark:border-rose-900/50">
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-rose-700 dark:text-rose-400">
            <Sparkles className="w-5 h-5" /> AI Business Analyst
          </CardTitle>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={generateAiAnalysis} 
            disabled={isAiLoading}
            className="border-rose-200 text-rose-700 hover:bg-rose-100"
          >
            {isAiLoading ? 'Analyzing...' : 'Generate Insights'}
          </Button>
        </CardHeader>
        <CardContent>
          {aiAnalysis ? (
            <div className="prose prose-sm dark:prose-invert max-w-none text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
              {aiAnalysis}
            </div>
          ) : (
            <p className="text-slate-500 text-sm italic">Click "Generate Insights" to have Gemini or Groq analyze your recent performance and suggest actionable improvements.</p>
          )}
        </CardContent>
      </Card>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-blue-50 text-blue-500 rounded-lg"><CalendarDays className="w-6 h-6" /></div>
            <div>
              <p className="text-sm text-slate-500 font-medium">Total Bookings</p>
              <h3 className="text-2xl font-bold text-slate-800 dark:text-white">{data.totalBookings}</h3>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-purple-50 text-purple-500 rounded-lg"><Users className="w-6 h-6" /></div>
            <div>
              <p className="text-sm text-slate-500 font-medium">Registered Users</p>
              <h3 className="text-2xl font-bold text-slate-800 dark:text-white">{data.totalUsers - data.guestUsers}</h3>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-orange-50 text-orange-500 rounded-lg"><UserMinus className="w-6 h-6" /></div>
            <div>
              <p className="text-sm text-slate-500 font-medium">Guest Clients</p>
              <h3 className="text-2xl font-bold text-slate-800 dark:text-white">{data.guestUsers}</h3>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-emerald-50 text-emerald-500 rounded-lg"><CheckCircle className="w-6 h-6" /></div>
            <div>
              <p className="text-sm text-slate-500 font-medium">Completed Services</p>
              <h3 className="text-2xl font-bold text-slate-800 dark:text-white">{data.completedBookings}</h3>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-red-50 text-red-500 rounded-lg"><XCircle className="w-6 h-6" /></div>
            <div>
              <p className="text-sm text-slate-500 font-medium">Cancellations</p>
              <h3 className="text-2xl font-bold text-slate-800 dark:text-white">{data.cancelledBookings}</h3>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-pink-50 text-pink-500 rounded-lg"><Scissors className="w-6 h-6" /></div>
            <div>
              <p className="text-sm text-slate-500 font-medium">Total Services Offered</p>
              <h3 className="text-2xl font-bold text-slate-800 dark:text-white">{data.totalServices}</h3>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Card>
        <CardHeader>
          <CardTitle>Bookings Over Time (Last 14 Days)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <Line type="monotone" dataKey="bookings" stroke="#e11d48" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                <CartesianGrid stroke="#ccc" strokeDasharray="5 5" vertical={false} />
                <XAxis dataKey="date" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  labelStyle={{ fontWeight: 'bold', color: '#1e293b' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
