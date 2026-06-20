'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, UserCheck } from 'lucide-react'
import { useSession } from 'next-auth/react'

export default function ProfileCompletionPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [formData, setFormData] = useState({ phone: '', address: '' })
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
      return
    }

    if (status === 'authenticated') {
      fetch('/api/user/profile')
        .then(res => res.json())
        .then(data => {
          if (data.isProfileComplete) {
            router.push('/dashboard')
          } else if (data.user) {
            setFormData({
              phone: data.user.phone || '',
              address: data.user.address || ''
            })
            setIsLoading(false)
          }
        })
        .catch(() => {
          setIsLoading(false)
        })
    }
  }, [status, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)

    try {
      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (!res.ok) {
        throw new Error('Failed to update profile')
      }

      toast.success('Profile completed successfully!')
      router.push('/dashboard')
    } catch (err) {
      toast.error('Could not update profile. Please try again.')
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF5EE]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FAF5EE] flex flex-col justify-center py-12 px-6 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center text-primary">
            <UserCheck className="w-8 h-8" />
          </div>
        </div>
        <h2 className="mt-2 text-3xl font-heading tracking-tight text-slate-900">
          Complete Your Profile
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          Please provide your contact details to enable bookings.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white/80 backdrop-blur-xl py-8 px-6 shadow sm:rounded-3xl border border-primary/10 sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <div className="mt-2">
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  required
                  placeholder="+1 (555) 000-0000"
                  value={formData.phone}
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  className="bg-white"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="address">Address</Label>
              <div className="mt-2">
                <Input
                  id="address"
                  name="address"
                  required
                  placeholder="123 Main St, City, State"
                  value={formData.address}
                  onChange={e => setFormData({ ...formData, address: e.target.value })}
                  className="bg-white"
                />
              </div>
            </div>

            <div className="pt-2">
              <Button type="submit" className="w-full rounded-full" disabled={isSaving}>
                {isSaving ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : null}
                Save & Continue
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
