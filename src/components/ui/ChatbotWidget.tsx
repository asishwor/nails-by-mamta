'use client'

import { useState, useRef, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { MessageCircle, X, Send, Sparkles, ChevronRight, ChevronLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useTranslations } from 'next-intl'

const PRESETS = [
  "What are you getting your nails done for?",
  "I need something elegant for a wedding.",
  "What styles are best for everyday office work?",
  "Recommend a bold party look."
]

type Message = {
  id: string
  role: 'user' | 'assistant'
  content: string
  suggestedServiceIds?: string[]
}

export function ChatbotWidget() {
  const t = useTranslations('Chatbot')
  const [isOpen, setIsOpen] = useState(false)
  const [hasOpened, setHasOpened] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { data: session } = useSession()
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Onboarding state
  const [services, setServices] = useState<any[]>([])
  const [isPersonalized, setIsPersonalized] = useState(false)
  const [onboardingStep, setOnboardingStep] = useState(1)
  const totalSteps = 3
  
  const [formData, setFormData] = useState({
    name: '',
    job: '',
    smallChildren: '',
    householdWork: '',
    typeOnComputer: '',
    sports: '',
    previousExperience: '',
    maintenanceFrequency: '',
    comfortVsFashion: '',
    naturalNailCondition: '',
    heavyHandUsage: '',
    workplaceRules: '',
    preferredStyle: ''
  })

  useEffect(() => {
    // Fetch services catalog for suggestions
    fetch('/api/services').then(r => r.json()).then(d => {
      if (d.services) setServices(d.services)
    }).catch(console.error)
  }, [])

  useEffect(() => {
    // Load Chat History
    async function loadChat() {
      if (session?.user) {
        try {
          const res = await fetch('/api/chat/history')
          const data = await res.json()
          if (data.messages && data.messages.length > 0) {
            setMessages(data.messages)
            if (data.sessionId) localStorage.setItem('ai_session_id', data.sessionId)
          }
        } catch (e) {}
      } else {
        const localMsgs = localStorage.getItem('ai_chat_history')
        if (localMsgs) {
          try { setMessages(JSON.parse(localMsgs)) } catch(e){}
        }
      }
    }
    loadChat()
  }, [session])

  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem('ai_chat_history', JSON.stringify(messages))
    }
  }, [messages])

  useEffect(() => {
    // Check if already personalized
    const saved = localStorage.getItem('ai_user_info')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        if (parsed.job || parsed.name) {
          setIsPersonalized(true)
          setFormData(prev => ({ ...prev, ...parsed }))
          if (messages.length === 0) {
            setMessages([{
              id: 'welcome',
              role: 'assistant',
              content: `Hi ${parsed.name || ''}! I am your Personal Stylist 💅. Based on your lifestyle profile, how can I help you find the perfect nail style today?`
            }])
          }
          return
        }
      } catch (e) {}
    }
    
    // Default initial message if not personalized
    const localMsgs = localStorage.getItem('ai_chat_history')
    if (messages.length === 0 && !localMsgs) {
      setMessages([{
        id: 'welcome',
        role: 'assistant',
        content: t('personalizeSub') || 'Hi! I am your Personal Stylist 💅. Please tell me a bit about yourself so I can give you the best recommendations!'
      }])
    }
  }, [messages.length, t])

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  const append = async (text: string) => {
    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: text }
    setMessages(prev => [...prev, userMsg])
    setIsLoading(true)

    try {
      const sessionId = localStorage.getItem('ai_session_id') || undefined
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          messages: [...messages, userMsg],
          sessionId,
          userId: (session?.user as any)?.id,
          userContext: isPersonalized ? formData : undefined,
          locale: typeof document !== 'undefined' ? document.documentElement.lang : 'en'
        })
      })
      const data = await res.json()
      if (data.reply) {
        setMessages(prev => [...prev, {
          id: Date.now().toString() + '1',
          role: 'assistant',
          content: data.reply,
          suggestedServiceIds: data.suggestedServiceIds
        }])
        
        if (data.sessionId) {
          localStorage.setItem('ai_session_id', data.sessionId)
        }
        if (data.userInfo) {
          const currentStr = localStorage.getItem('ai_user_info') || '{}'
          const current = JSON.parse(currentStr)
          const merged = { ...current, ...data.userInfo }
          // Remove null/undefined/empty
          Object.keys(merged).forEach(k => {
            if (!merged[k as keyof typeof merged]) delete merged[k as keyof typeof merged]
          })
          localStorage.setItem('ai_user_info', JSON.stringify(merged))
        }
      }
    } catch (e) {
      setMessages(prev => [...prev, {
        id: Date.now().toString() + '1',
        role: 'assistant',
        content: 'Sorry, I am having trouble connecting right now.'
      }])
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return
    const text = input.trim()
    setInput('')
    append(text)
  }

  const handleNextStep = () => {
    if (onboardingStep < totalSteps) {
      setOnboardingStep(prev => prev + 1)
    }
  }

  const handlePrevStep = () => {
    if (onboardingStep > 1) {
      setOnboardingStep(prev => prev - 1)
    }
  }

  const handleStartChat = async (e: React.FormEvent) => {
    e.preventDefault()
    if (onboardingStep < totalSteps) {
      handleNextStep()
      return
    }
    
    setIsPersonalized(true)
    const currentStr = localStorage.getItem('ai_user_info') || '{}'
    const current = JSON.parse(currentStr)
    const newProfile = { ...current, ...formData }
    localStorage.setItem('ai_user_info', JSON.stringify(newProfile))
    
    // If logged in, save to database
    if ((session?.user as any)?.id) {
      try {
        await fetch('/api/user/profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lifestyleProfile: newProfile })
        })
      } catch (err) {
        console.error('Failed to save profile to DB', err)
      }
    }
    
    setMessages([{
      id: 'welcome',
      role: 'assistant',
      content: `Hi ${formData.name || ''}! I am your Personal Stylist 💅. Based on your preferences, how can I help you find the perfect nail style today?`
    }])
  }

  const toggleChat = () => {
    setIsOpen(!isOpen)
    if (!isOpen) setHasOpened(true)
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* Chat Window */}
      {isOpen && (
        <div className="bg-white dark:bg-zinc-900 border rounded-2xl shadow-2xl w-[350px] max-h-[500px] flex flex-col overflow-hidden mb-4 animate-in slide-in-from-bottom-5">
          {/* Header */}
          <div className="bg-primary text-primary-foreground p-4 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              <span className="font-semibold">{t('title') || 'Personal Stylist'}</span>
            </div>
            <button onClick={toggleChat} className="text-primary-foreground/80 hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content Area */}
          {!isPersonalized ? (
            <div className="flex-1 overflow-y-auto p-4 bg-slate-50 dark:bg-zinc-900/50">
              <div className="bg-white dark:bg-zinc-800 p-4 rounded-xl shadow-sm border border-slate-100 dark:border-zinc-700">
                <div className="flex justify-between items-center mb-1">
                  <h3 className="font-semibold text-md">{t('personalize')}</h3>
                  <span className="text-xs text-slate-400">Step {onboardingStep}/{totalSteps}</span>
                </div>
                <p className="text-xs text-slate-500 mb-4">{t('personalizeSub')}</p>
                
                <form onSubmit={handleStartChat} className="space-y-3">
                  {onboardingStep === 1 && (
                    <div className="space-y-3 animate-in fade-in slide-in-from-right-4">
                      <div className="space-y-1">
                        <label className="text-xs font-medium">Your Name</label>
                        <Input 
                          value={formData.name} 
                          onChange={e => setFormData(f => ({ ...f, name: e.target.value }))} 
                          placeholder="Jane Doe" 
                          required 
                          className="h-8 text-sm"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-medium">What is your job/profession?</label>
                        <Input 
                          value={formData.job} 
                          onChange={e => setFormData(f => ({ ...f, job: e.target.value }))} 
                          placeholder="E.g., Nurse, Desk job, Student..." 
                          className="h-8 text-sm"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-medium">Do you have small children?</label>
                        <Select value={formData.smallChildren} onValueChange={v => setFormData(f => ({ ...f, smallChildren: v || '' }))}>
                          <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Select..." /></SelectTrigger>
                          <SelectContent><SelectItem value="Yes">Yes</SelectItem><SelectItem value="No">No</SelectItem></SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-medium">Do you do heavy household work?</label>
                        <Select value={formData.householdWork} onValueChange={v => setFormData(f => ({ ...f, householdWork: v || '' }))}>
                          <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Select..." /></SelectTrigger>
                          <SelectContent><SelectItem value="Yes">Yes</SelectItem><SelectItem value="No">No</SelectItem></SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}

                  {onboardingStep === 2 && (
                    <div className="space-y-3 animate-in fade-in slide-in-from-right-4">
                      <div className="space-y-1">
                        <label className="text-xs font-medium">Do you type on a computer frequently?</label>
                        <Select value={formData.typeOnComputer} onValueChange={v => setFormData(f => ({ ...f, typeOnComputer: v || '' }))}>
                          <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Select..." /></SelectTrigger>
                          <SelectContent><SelectItem value="Yes">Yes</SelectItem><SelectItem value="No">No</SelectItem></SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-medium">Do you play any sports?</label>
                        <Select value={formData.sports} onValueChange={v => setFormData(f => ({ ...f, sports: v || '' }))}>
                          <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Select..." /></SelectTrigger>
                          <SelectContent><SelectItem value="Yes">Yes</SelectItem><SelectItem value="No">No</SelectItem></SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-medium">Are you heavy-handed? (Prone to breaking things)</label>
                        <Select value={formData.heavyHandUsage} onValueChange={v => setFormData(f => ({ ...f, heavyHandUsage: v || '' }))}>
                          <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Select..." /></SelectTrigger>
                          <SelectContent><SelectItem value="Yes">Yes</SelectItem><SelectItem value="No">No</SelectItem></SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-medium">Condition of natural nails?</label>
                        <Select value={formData.naturalNailCondition} onValueChange={v => setFormData(f => ({ ...f, naturalNailCondition: v || '' }))}>
                          <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Select..." /></SelectTrigger>
                          <SelectContent><SelectItem value="Strong">Strong</SelectItem><SelectItem value="Weak/Brittle">Weak/Brittle</SelectItem><SelectItem value="Damaged">Damaged</SelectItem></SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}

                  {onboardingStep === 3 && (
                    <div className="space-y-3 animate-in fade-in slide-in-from-right-4">
                      <div className="space-y-1">
                        <label className="text-xs font-medium">Comfort vs Fashion?</label>
                        <Select value={formData.comfortVsFashion} onValueChange={v => setFormData(f => ({ ...f, comfortVsFashion: v || '' }))}>
                          <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Select..." /></SelectTrigger>
                          <SelectContent><SelectItem value="Comfort First">Comfort First</SelectItem><SelectItem value="Fashion First">Fashion First</SelectItem><SelectItem value="Balanced">Balanced</SelectItem></SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-medium">Strict workplace rules for nails?</label>
                        <Select value={formData.workplaceRules} onValueChange={v => setFormData(f => ({ ...f, workplaceRules: v || '' }))}>
                          <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Select..." /></SelectTrigger>
                          <SelectContent><SelectItem value="Yes (Need Natural/Short)">Yes (Need Natural/Short)</SelectItem><SelectItem value="No Rules">No Rules</SelectItem></SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-medium">How often can you maintain your nails?</label>
                        <Select value={formData.maintenanceFrequency} onValueChange={v => setFormData(f => ({ ...f, maintenanceFrequency: v || '' }))}>
                          <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Select..." /></SelectTrigger>
                          <SelectContent><SelectItem value="Every 2 Weeks">Every 2 Weeks</SelectItem><SelectItem value="Once a Month">Once a Month</SelectItem><SelectItem value="Rarely">Rarely</SelectItem></SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2 mt-4">
                    {onboardingStep > 1 && (
                      <Button type="button" variant="outline" onClick={handlePrevStep} className="h-9 w-10 p-0"><ChevronLeft className="h-4 w-4" /></Button>
                    )}
                    <Button type="submit" className="flex-1 h-9">
                      {onboardingStep < totalSteps ? 'Next' : t('startChat') || 'Start Chat'}
                      {onboardingStep < totalSteps && <ChevronRight className="h-4 w-4 ml-1" />}
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          ) : (
            <>
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[300px]">
                {messages.map((m) => (
                  <div key={m.id} className={cn("flex w-full flex-col", m.role === 'user' ? "items-end" : "items-start")}>
                    <div className={cn(
                      "max-w-[80%] rounded-2xl px-4 py-2 text-sm",
                      m.role === 'user' 
                        ? "bg-primary text-primary-foreground rounded-tr-none" 
                        : "bg-slate-100 dark:bg-zinc-800 text-slate-800 dark:text-slate-200 rounded-tl-none"
                    )}>
                      {m.content}
                    </div>
                    {m.suggestedServiceIds && m.suggestedServiceIds.length > 0 && (
                      <div className="mt-3 flex flex-col gap-2 w-[220px]">
                        <span className="text-xs text-slate-500">{t('suggestedServices') || 'Suggested for you:'}</span>
                        {m.suggestedServiceIds.map(id => {
                          const svc = services.find(s => s.id === id)
                          if (!svc) return null
                          return (
                            <button 
                              key={id}
                              onClick={() => window.dispatchEvent(new CustomEvent('openBooking', { detail: { serviceId: id } }))}
                              className="text-left bg-white dark:bg-zinc-800 border border-primary/20 p-3 rounded-xl hover:border-primary hover:shadow-md transition-all shadow-sm group"
                            >
                              <div className="font-semibold text-sm text-slate-800 dark:text-slate-200">{svc.name}</div>
                              {svc.description && <div className="text-[11px] text-muted-foreground mt-1 line-clamp-2">{svc.description}</div>}
                              <div className="mt-2 text-xs font-bold text-primary flex items-center justify-between">
                                <span>Rs. {svc.price}</span>
                                <span className="bg-primary/10 px-2 py-1 rounded-md group-hover:bg-primary group-hover:text-white transition-colors">Book</span>
                              </div>
                            </button>
                          )
                        })}
                      </div>
                    )}
                  </div>
                ))}
                {isLoading && (
                  <div className="flex w-full justify-start">
                    <div className="bg-slate-100 dark:bg-zinc-800 rounded-2xl rounded-tl-none px-4 py-2 flex items-center gap-1">
                      <div className="w-2 h-2 bg-primary/40 rounded-full animate-bounce" />
                      <div className="w-2 h-2 bg-primary/40 rounded-full animate-bounce [animation-delay:-.15s]" />
                      <div className="w-2 h-2 bg-primary/40 rounded-full animate-bounce [animation-delay:-.3s]" />
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Presets */}
              {messages.length <= 2 && (
                <div className="px-4 pb-2 flex flex-wrap gap-2">
                  {PRESETS.map((p, i) => (
                    <button 
                      key={i}
                      onClick={() => append(p)}
                      className="text-xs bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 px-3 py-1.5 rounded-full text-left transition-colors"
                    >
                      {p}
                    </button>
                  ))}
                </div>
              )}

              {/* Input */}
              <form onSubmit={handleSubmit} className="p-3 border-t flex gap-2 items-center bg-white dark:bg-zinc-900">
                <Input
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  placeholder={t('placeholder') || "Ask about nail styles..."}
                  className="flex-1 rounded-full border-slate-200 dark:border-zinc-800"
                  disabled={isLoading}
                />
                <Button type="submit" size="icon" className="rounded-full shrink-0" disabled={isLoading || !input.trim()}>
                  <Send className="w-4 h-4" />
                </Button>
              </form>
            </>
          )}
        </div>
      )}

      {/* Floating Button */}
      <button 
        onClick={toggleChat}
        className="w-14 h-14 bg-primary text-primary-foreground rounded-full flex items-center justify-center shadow-xl hover:scale-105 transition-transform relative"
      >
        {!hasOpened && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500"></span>
          </span>
        )}
        {isOpen ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
      </button>
    </div>
  )
}
