'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2 } from 'lucide-react'

export default function SettingsPage() {
  const [settings, setSettings] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isChangingPwd, setIsChangingPwd] = useState(false)

  const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' })

  useEffect(() => {
    fetch('/api/admin/settings')
      .then(res => res.json())
      .then(data => {
        if (data.settings) {
          const s = data.settings;
          if (!s.weeklySchedule || Object.keys(s.weeklySchedule).length === 0) {
            s.weeklySchedule = {};
            for (let i = 0; i < 7; i++) {
              s.weeklySchedule[i.toString()] = {
                isActive: s.workingDays?.includes(i) ?? false,
                startTime: s.startTime || "09:00:00",
                endTime: s.endTime || "18:00:00"
              };
            }
          }
          if (!s.socialLinks) {
            s.socialLinks = {
              instagram: { isActive: true, url: '', label: '@nailbymamta' },
              facebook: { isActive: false, url: '', label: '' },
              tiktok: { isActive: false, url: '', label: '' },
              twitter: { isActive: false, url: '', label: '' },
              youtube: { isActive: false, url: '', label: '' },
            }
          }
          setSettings(s)
        }
        setIsLoading(false)
      })
      .catch(() => {
        toast.error('Failed to load settings')
        setIsLoading(false)
      })
  }, [])

  const handleDayToggle = (dayIndex: number) => {
    setSettings((prev: any) => {
      const schedule = { ...prev.weeklySchedule }
      const dayStr = dayIndex.toString()
      schedule[dayStr] = {
        ...schedule[dayStr],
        isActive: !schedule[dayStr].isActive
      }
      return { ...prev, weeklySchedule: schedule }
    })
  }

  const handleTimeChange = (dayIndex: number, field: 'startTime' | 'endTime', value: string) => {
    setSettings((prev: any) => {
      const schedule = { ...prev.weeklySchedule }
      const dayStr = dayIndex.toString()
      schedule[dayStr] = {
        ...schedule[dayStr],
        [field]: value
      }
      return { ...prev, weeklySchedule: schedule }
    })
  }

  const handleSocialToggle = (platform: string) => {
    setSettings((prev: any) => {
      const social = { ...prev.socialLinks }
      social[platform] = {
        ...(social[platform] || { url: '', label: '' }),
        isActive: !social[platform]?.isActive
      }
      return { ...prev, socialLinks: social }
    })
  }

  const handleSocialChange = (platform: string, field: 'url' | 'label', value: string) => {
    setSettings((prev: any) => {
      const social = { ...prev.socialLinks }
      social[platform] = {
        ...(social[platform] || { isActive: false }),
        [field]: value
      }
      return { ...prev, socialLinks: social }
    })
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      })
      if (!res.ok) throw new Error('Failed to save settings')
      toast.success('Settings saved successfully')
    } catch (err) {
      toast.error('Failed to save settings')
    } finally {
      setIsSaving(false)
    }
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    if (passwords.new !== passwords.confirm) {
      toast.error('New passwords do not match')
      return
    }

    setIsChangingPwd(true)
    try {
      const res = await fetch('/api/admin/settings/password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: passwords.current,
          newPassword: passwords.new
        })
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Failed to change password')
      }

      toast.success('Password changed successfully')
      setPasswords({ current: '', new: '', confirm: '' })
    } catch (err: any) {
      toast.error(err.message || 'Error changing password')
    } finally {
      setIsChangingPwd(false)
    }
  }

  if (isLoading) return <div className="p-8">Loading settings...</div>
  if (!settings) return <div className="p-8">No settings found.</div>

  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-light text-slate-800 dark:text-white">Business Settings</h1>
        <p className="text-slate-500 mt-1">Customize your working hours and availability.</p>
      </div>

      <div className="bg-white dark:bg-zinc-900 border rounded-xl p-6 shadow-sm space-y-8">
        <div>
          <h3 className="text-lg font-medium mb-4">Weekly Schedule</h3>
          <div className="space-y-4">
            {daysOfWeek.map((day, index) => {
              const dayStr = index.toString()
              const dayConfig = settings.weeklySchedule?.[dayStr] || { isActive: false, startTime: '', endTime: '' }
              
              return (
                <div key={day} className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 border rounded-lg bg-slate-50 dark:bg-zinc-800/50">
                  <div className="w-32">
                    <Button 
                      type="button" 
                      variant={dayConfig.isActive ? 'default' : 'outline'}
                      className="w-full justify-start"
                      onClick={() => handleDayToggle(index)}
                    >
                      {dayConfig.isActive ? '✓ ' : ''}{day}
                    </Button>
                  </div>
                  
                  {dayConfig.isActive && (
                    <div className="flex items-center gap-4 flex-1">
                      <div className="flex items-center gap-2">
                        <Label htmlFor={`start-${index}`} className="sr-only">Start Time</Label>
                        <Input 
                          id={`start-${index}`} 
                          type="time" 
                          step="1"
                          value={dayConfig.startTime} 
                          onChange={e => handleTimeChange(index, 'startTime', e.target.value)} 
                          className="w-32"
                        />
                      </div>
                      <span className="text-slate-400">to</span>
                      <div className="flex items-center gap-2">
                        <Label htmlFor={`end-${index}`} className="sr-only">End Time</Label>
                        <Input 
                          id={`end-${index}`} 
                          type="time" 
                          step="1"
                          value={dayConfig.endTime} 
                          onChange={e => handleTimeChange(index, 'endTime', e.target.value)} 
                          className="w-32"
                        />
                      </div>
                    </div>
                  )}
                  {!dayConfig.isActive && (
                    <div className="flex-1 text-slate-400 italic text-sm py-2">
                      Closed
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="buffer">Buffer Time (minutes between appointments)</Label>
          <Input 
            id="buffer" 
            type="number" 
            min="0"
            value={settings.bufferTimeMinutes} 
            onChange={e => setSettings({ ...settings, bufferTimeMinutes: parseInt(e.target.value) })} 
          />
        </div>

        <div className="pt-6 border-t space-y-6">
          <h3 className="text-lg font-medium">Contact Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="contactPhone">WhatsApp Phone Number</Label>
              <Input 
                id="contactPhone" 
                value={settings.contactPhone || ''} 
                onChange={e => setSettings({ ...settings, contactPhone: e.target.value })} 
                placeholder="+977 984010613"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contactLocation">Location Name / Address</Label>
              <Input 
                id="contactLocation" 
                value={settings.contactLocation || ''} 
                onChange={e => setSettings({ ...settings, contactLocation: e.target.value })} 
                placeholder="Boudha, Kathmandu"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="googleMapsLink">Google Maps Link</Label>
              <Input 
                id="googleMapsLink" 
                value={settings.googleMapsLink || ''} 
                onChange={e => setSettings({ ...settings, googleMapsLink: e.target.value })} 
                placeholder="https://maps.app.goo.gl/..."
              />
            </div>
          </div>
        </div>

        <div className="pt-6 border-t space-y-6">
          <h3 className="text-lg font-medium">Social Links</h3>
          <div className="space-y-4">
            {['instagram', 'facebook', 'tiktok', 'twitter', 'youtube'].map((platform) => {
              const config = (settings.socialLinks?.[platform] as any) || { isActive: false, url: '', label: '' }
              const isActive = Boolean(config.isActive)
              return (
                <div key={platform} className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 border rounded-lg bg-slate-50 dark:bg-zinc-800/50">
                  <div className="w-32 capitalize font-medium">
                    <Button 
                      type="button" 
                      variant={isActive ? 'default' : 'outline'}
                      className="w-full justify-start capitalize"
                      onClick={() => handleSocialToggle(platform)}
                    >
                      {isActive ? '✓ ' : ''}{platform}
                    </Button>
                  </div>
                  
                  {isActive && (
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 flex-1">
                      <div className="flex-1 w-full space-y-1">
                        <Label htmlFor={`${platform}-label`} className="text-xs text-slate-500">Display Label</Label>
                        <Input 
                          id={`${platform}-label`} 
                          value={config.label || ''} 
                          onChange={e => handleSocialChange(platform, 'label', e.target.value)} 
                          placeholder="@handle or Name"
                        />
                      </div>
                      <div className="flex-[2] w-full space-y-1">
                        <Label htmlFor={`${platform}-url`} className="text-xs text-slate-500">Profile URL</Label>
                        <Input 
                          id={`${platform}-url`} 
                          value={config.url || ''} 
                          onChange={e => handleSocialChange(platform, 'url', e.target.value)} 
                          placeholder="https://..."
                        />
                      </div>
                    </div>
                  )}
                  {!isActive && (
                    <div className="flex-1 text-slate-400 italic text-sm py-2">
                      Disabled — click to enable
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        <div className="pt-6 border-t">
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-light text-slate-800 dark:text-white mb-4">Security</h2>
        <form onSubmit={handlePasswordChange} className="bg-white dark:bg-zinc-900 border rounded-xl p-6 shadow-sm space-y-6">
          <div className="space-y-2 max-w-sm">
            <Label htmlFor="currentPwd">Current Password</Label>
            <Input 
              id="currentPwd" 
              type="password" 
              required
              value={passwords.current}
              onChange={e => setPasswords({ ...passwords, current: e.target.value })}
            />
          </div>
          <div className="space-y-2 max-w-sm">
            <Label htmlFor="newPwd">New Password</Label>
            <Input 
              id="newPwd" 
              type="password" 
              required
              minLength={6}
              value={passwords.new}
              onChange={e => setPasswords({ ...passwords, new: e.target.value })}
            />
          </div>
          <div className="space-y-2 max-w-sm">
            <Label htmlFor="confirmPwd">Confirm New Password</Label>
            <Input 
              id="confirmPwd" 
              type="password" 
              required
              minLength={6}
              value={passwords.confirm}
              onChange={e => setPasswords({ ...passwords, confirm: e.target.value })}
            />
          </div>
          <div className="pt-2">
            <Button type="submit" variant="destructive" disabled={isChangingPwd}>
              {isChangingPwd && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update Password
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
