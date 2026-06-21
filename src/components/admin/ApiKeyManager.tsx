'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { Trash2, Plus, RefreshCw } from 'lucide-react'

export function ApiKeyManager() {
  const [keys, setKeys] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const [newKey, setNewKey] = useState('')
  const [newProvider, setNewProvider] = useState('GROQ')
  const [searchModel, setSearchModel] = useState('llama-3.1-8b-instant')
  const [chatModel, setChatModel] = useState('llama-3.1-70b-versatile')

  const fetchKeys = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/apikeys')
      const data = await res.json()
      setKeys(data.keys || [])
    } catch (e) {
      toast.error('Failed to load API keys')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchKeys()
  }, [])

  const handleAdd = async () => {
    if (!newKey.trim()) return toast.error('Key is required')
    try {
      const res = await fetch('/api/admin/apikeys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: newProvider,
          key: newKey.trim(),
          models: {
            search: searchModel.trim() || undefined,
            chat: chatModel.trim() || undefined
          },
          isActive: true
        })
      })
      if (!res.ok) throw new Error('Failed to add')
      toast.success('Key added')
      setNewKey('')
      fetchKeys()
    } catch (e) {
      toast.error('Error adding key')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this key?')) return
    try {
      const res = await fetch(`/api/admin/apikeys?id=${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete')
      toast.success('Key deleted')
      fetchKeys()
    } catch (e) {
      toast.error('Error deleting key')
    }
  }

  if (loading) return <div>Loading AI Configuration...</div>

  return (
    <div className="space-y-6">
      <div className="border rounded-xl p-6 bg-slate-50 dark:bg-zinc-800/50">
        <h4 className="font-medium mb-4 flex items-center gap-2">Add New API Key</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="space-y-2">
            <Label>Provider</Label>
            <Select value={newProvider} onValueChange={setNewProvider}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="GROQ">Groq (Recommended)</SelectItem>
                <SelectItem value="GEMINI">Google Gemini</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>API Key</Label>
            <Input type="password" value={newKey} onChange={e => setNewKey(e.target.value)} placeholder="gsk_..." />
          </div>
          <div className="space-y-2">
            <Label>Search Model (Optional)</Label>
            <Input value={searchModel} onChange={e => setSearchModel(e.target.value)} placeholder={newProvider === 'GROQ' ? 'llama-3.1-8b-instant' : 'gemini-2.5-flash'} />
          </div>
          <div className="space-y-2">
            <Label>Chat Model (Optional)</Label>
            <Input value={chatModel} onChange={e => setChatModel(e.target.value)} placeholder={newProvider === 'GROQ' ? 'llama-3.1-70b-versatile' : 'gemini-2.5-pro'} />
          </div>
        </div>
        <Button onClick={handleAdd} className="w-full sm:w-auto"><Plus className="w-4 h-4 mr-2" /> Add Key</Button>
      </div>

      <div className="space-y-4">
        <h4 className="font-medium">Active API Keys</h4>
        {keys.length === 0 ? <p className="text-slate-500 text-sm">No API keys found. AI features will be disabled.</p> : null}
        
        {keys.map(k => (
          <div key={k.id} className="border p-4 rounded-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <div className="font-medium flex items-center gap-2">
                {k.provider}
                {k.blockedUntil && new Date(k.blockedUntil) > new Date() && (
                  <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-bold">Rate Limited</span>
                )}
              </div>
              <div className="text-sm font-mono text-slate-500 mt-1">
                {k.key.substring(0, 4)}...{k.key.substring(k.key.length - 4)}
              </div>
              <div className="text-xs text-slate-400 mt-2 space-y-1">
                <div>Search Model: {k.models?.search || 'Default'}</div>
                <div>Chat Model: {k.models?.chat || 'Default'}</div>
              </div>
            </div>
            <Button variant="destructive" size="sm" onClick={() => handleDelete(k.id)}>
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  )
}
