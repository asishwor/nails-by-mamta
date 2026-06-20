'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ApiKey } from '@prisma/client'
import { format } from 'date-fns'
import { KeyRound, Plus, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

export default function AiKeysPage() {
  const [keys, setKeys] = useState<ApiKey[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [newKey, setNewKey] = useState('')
  const [newProvider, setNewProvider] = useState<String | null>('GEMINI')

  const fetchKeys = async () => {
    try {
      const res = await fetch('/api/admin/settings/ai-keys')
      const data = await res.json()
      if (data.keys) setKeys(data.keys)
    } catch (err) {
      toast.error('Failed to load keys')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchKeys()
  }, [])

  const handleAddKey = async () => {
    if (!newKey.trim()) return toast.error('Key is required')
    try {
      const res = await fetch('/api/admin/settings/ai-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: newProvider, key: newKey.trim() })
      })
      if (!res.ok) throw new Error('Failed to add key')
      toast.success('API Key added successfully')
      setNewKey('')
      fetchKeys()
    } catch (err) {
      toast.error('Error adding key')
    }
  }

  const handleDeleteKey = async (id: string) => {
    if (!confirm('Are you sure you want to delete this key?')) return
    try {
      const res = await fetch(`/api/admin/settings/ai-keys?id=${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete key')
      toast.success('Key deleted')
      fetchKeys()
    } catch (err) {
      toast.error('Error deleting key')
    }
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-light text-slate-800 dark:text-white">AI Providers & Keys</h1>
        <p className="text-slate-500 mt-1">Manage API keys for Gemini and Groq. Keys are rotated automatically round-robin style.</p>
      </div>

      <div className="bg-white dark:bg-zinc-900 border rounded-xl p-6 shadow-sm mb-8">
        <h2 className="text-lg font-medium mb-4 flex items-center gap-2">
          <KeyRound className="w-5 h-5 text-rose-500" />
          Add New Key
        </h2>

        <div className="flex gap-4">
          <Select value={newProvider} onValueChange={setNewProvider}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="GEMINI">Google Gemini</SelectItem>
              <SelectItem value="GROQ">Groq (Llama 3)</SelectItem>
            </SelectContent>
          </Select>
          <Input
            placeholder="Enter API Key..."
            value={newKey}
            onChange={(e) => setNewKey(e.target.value)}
            type="password"
            className="flex-1"
          />
          <Button onClick={handleAddKey}>
            <Plus className="w-4 h-4 mr-2" />
            Add Key
          </Button>
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900 border rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 dark:bg-zinc-800 border-b">
            <tr>
              <th className="px-6 py-3 font-medium text-slate-500">Provider</th>
              <th className="px-6 py-3 font-medium text-slate-500">Key Prefix</th>
              <th className="px-6 py-3 font-medium text-slate-500">Status</th>
              <th className="px-6 py-3 font-medium text-slate-500">Added On</th>
              <th className="px-6 py-3 font-medium text-slate-500 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={5} className="text-center py-8">Loading...</td></tr>
            ) : keys.length === 0 ? (
              <tr><td colSpan={5} className="text-center py-8 text-slate-500">No API keys found. Add one above to enable AI features.</td></tr>
            ) : (
              keys.map((k) => (
                <tr key={k.id} className="border-b last:border-0 hover:bg-slate-50 dark:hover:bg-zinc-800/50">
                  <td className="px-6 py-4 font-medium">{k.provider}</td>
                  <td className="px-6 py-4 font-mono text-xs">{k.key.substring(0, 8)}...</td>
                  <td className="px-6 py-4">
                    {k.blockedUntil && new Date(k.blockedUntil) > new Date() ? (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                        Rate Limited (Blocked)
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                        Active
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-slate-500">
                    {format(new Date(k.createdAt), 'MMM d, yyyy')}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Button variant="ghost" size="icon" onClick={() => handleDeleteKey(k.id)} className="text-red-500 hover:text-red-600 hover:bg-red-50">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
