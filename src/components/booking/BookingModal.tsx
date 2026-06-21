'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Calendar } from '@/components/ui/calendar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { format } from 'date-fns'
import { toast } from 'sonner'
import { Loader2, Calendar as CalendarIcon, Clock, User, CheckCircle2 } from 'lucide-react'
import { useSession } from 'next-auth/react'

interface Service {
  id: string
  name: string
  price: number
  durationMinutes: number
}

interface BookingModalProps {
  isOpen: boolean
  onClose: () => void
  service: Service | null
}

const variants = {
  enter: (direction: number) => {
    return {
      x: direction > 0 ? 100 : -100,
      opacity: 0
    }
  },
  center: {
    zIndex: 1,
    x: 0,
    opacity: 1
  },
  exit: (direction: number) => {
    return {
      zIndex: 0,
      x: direction < 0 ? 100 : -100,
      opacity: 0
    }
  }
}

export function BookingModal({ isOpen, onClose, service }: BookingModalProps) {
  const { data: session, status } = useSession()
  const [step, setStep] = useState(1)
  const [direction, setDirection] = useState(1)

  const [date, setDate] = useState<Date | undefined>(undefined)
  const [slots, setSlots] = useState<string[]>([])
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  const [isLoadingSlots, setIsLoadingSlots] = useState(false)

  const [formData, setFormData] = useState({ name: '', email: '', phone: '', address: '' })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [lifestyleData, setLifestyleData] = useState({ job: '', smallChildren: '', householdWork: '', typeOnComputer: '', sports: '', heavyHandUsage: '', naturalNailCondition: '', comfortVsFashion: '', workplaceRules: '', maintenanceFrequency: '' })

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setDate(undefined)
      setSelectedTime(null)
      
      let aiInfo: any = {}
      let needsPers = true
      try {
        const stored = localStorage.getItem('ai_user_info')
        if (stored) {
          aiInfo = JSON.parse(stored)
          if (aiInfo.job || aiInfo.name) needsPers = false
        }
      } catch (e) {}

      setStep(needsPers ? 0 : 1)

      setFormData({ 
        name: session?.user?.name || aiInfo.name || '', 
        email: session?.user?.email || '', 
        phone: aiInfo.phone || '', 
        address: aiInfo.address || '' 
      })
    }
  }, [isOpen, session])
  
  const handleSaveLifestyle = async () => {
    const currentStr = localStorage.getItem('ai_user_info') || '{}'
    const current = JSON.parse(currentStr)
    const newProfile = { ...current, ...lifestyleData }
    localStorage.setItem('ai_user_info', JSON.stringify(newProfile))
    
    if ((session?.user as any)?.id) {
      try {
        await fetch('/api/user/profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lifestyleProfile: newProfile })
        })
      } catch (err) {}
    }
    setDirection(1)
    setStep(1)
  }


  // Fetch slots when date changes
  useEffect(() => {
    async function fetchSlots() {
      if (!date || !service) return
      setIsLoadingSlots(true)
      setSelectedTime(null)
      try {
        const dateStr = format(date, 'yyyy-MM-dd')
        const res = await fetch(`/api/slots?date=${dateStr}&serviceId=${service.id}`)
        const data = await res.json()
        if (data.slots) {
          setSlots(data.slots)
        } else {
          setSlots([])
        }
      } catch (err) {
        toast.error('Failed to load availability')
      } finally {
        setIsLoadingSlots(false)
      }
    }
    fetchSlots()
  }, [date, service])

  const nextStep = () => {
    setDirection(1)
    setStep((prev) => prev + 1)
  }

  const prevStep = () => {
    setDirection(-1)
    setStep((prev) => prev - 1)
  }

  const handleContinueFromStep1 = async () => {
    if (status === 'authenticated') {
      // Direct booking for logged-in users
      if (!service || !date || !selectedTime) return
      setIsSubmitting(true)
      try {
        // Check profile completion first
        const profileRes = await fetch('/api/user/profile')
        const profileData = await profileRes.json()

        if (!profileData.isProfileComplete) {
          toast.error('Please complete your profile (Phone & Address) to book.')
          window.location.href = '/profile/complete'
          return
        }

        const res = await fetch('/api/bookings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            serviceId: service.id,
            date: format(date, 'yyyy-MM-dd'),
            time: selectedTime,
            name: session.user?.name || 'User',
            email: session.user?.email,
          })
        })
        if (!res.ok) throw new Error('Booking failed')
        setDirection(1)
        setStep(3) // Jump straight to success
      } catch (err) {
        toast.error('Could not complete your booking. Please try again.')
      } finally {
        setIsSubmitting(false)
      }
    } else {
      nextStep() // Go to guest form
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!service || !date || !selectedTime) return

    setIsSubmitting(true)
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceId: service.id,
          date: format(date, 'yyyy-MM-dd'),
          time: selectedTime,
          ...formData
        })
      })

      if (!res.ok) throw new Error('Booking failed')
      
      nextStep() // Go to success step
    } catch (err) {
      toast.error('Could not complete your booking. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!service) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] overflow-hidden bg-white/90 backdrop-blur-xl border-white/20">
        <DialogHeader>
          <DialogTitle className="text-2xl font-light text-slate-800">
            {step === 3 ? 'Booking Confirmed' : `Book ${service.name}`}
          </DialogTitle>
          <DialogDescription>
            {step === 0 && 'Tell us a bit about your lifestyle for better recommendations.'}
            {step === 1 && 'Select a date and time for your appointment.'}
            {step === 2 && 'Please provide your details to confirm.'}
            {step === 3 && 'We look forward to seeing you!'}
          </DialogDescription>
        </DialogHeader>

        <div className="relative h-[400px] mt-4">
          <AnimatePresence initial={false} custom={direction}>
            {step === 0 && (
              <motion.div
                key="step0"
                custom={direction}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className="absolute inset-0 flex flex-col gap-4 overflow-y-auto pr-2 pb-10 px-2"
              >
                <div className="p-4 bg-primary/5 rounded-lg border border-primary/10 mb-2">
                  <h3 className="font-semibold text-lg mb-1">Personalize your experience</h3>
                  <p className="text-sm text-muted-foreground mb-4">Help us tailor this service and future recommendations to your lifestyle.</p>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>What is your job/profession?</Label>
                      <Input value={lifestyleData.job} onChange={e => setLifestyleData({...lifestyleData, job: e.target.value})} placeholder="Nurse, desk job, etc..." />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Small children?</Label>
                        <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm" value={lifestyleData.smallChildren} onChange={e => setLifestyleData({...lifestyleData, smallChildren: e.target.value})}>
                          <option value="">Select...</option>
                          <option value="Yes">Yes</option>
                          <option value="No">No</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label>Heavy chores?</Label>
                        <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm" value={lifestyleData.householdWork} onChange={e => setLifestyleData({...lifestyleData, householdWork: e.target.value})}>
                          <option value="">Select...</option>
                          <option value="Yes">Yes</option>
                          <option value="No">No</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label>Type frequently?</Label>
                        <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm" value={lifestyleData.typeOnComputer} onChange={e => setLifestyleData({...lifestyleData, typeOnComputer: e.target.value})}>
                          <option value="">Select...</option>
                          <option value="Yes">Yes</option>
                          <option value="No">No</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label>Play sports?</Label>
                        <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm" value={lifestyleData.sports} onChange={e => setLifestyleData({...lifestyleData, sports: e.target.value})}>
                          <option value="">Select...</option>
                          <option value="Yes">Yes</option>
                          <option value="No">No</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label>Heavy-handed?</Label>
                        <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm" value={lifestyleData.heavyHandUsage} onChange={e => setLifestyleData({...lifestyleData, heavyHandUsage: e.target.value})}>
                          <option value="">Select...</option>
                          <option value="Yes">Yes</option>
                          <option value="No">No</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label>Nail condition?</Label>
                        <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm" value={lifestyleData.naturalNailCondition} onChange={e => setLifestyleData({...lifestyleData, naturalNailCondition: e.target.value})}>
                          <option value="">Select...</option>
                          <option value="Strong">Strong</option>
                          <option value="Weak/Brittle">Weak/Brittle</option>
                          <option value="Damaged">Damaged</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label>Comfort vs Fashion?</Label>
                        <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm" value={lifestyleData.comfortVsFashion} onChange={e => setLifestyleData({...lifestyleData, comfortVsFashion: e.target.value})}>
                          <option value="">Select...</option>
                          <option value="Comfort First">Comfort First</option>
                          <option value="Fashion First">Fashion First</option>
                          <option value="Balanced">Balanced</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label>Workplace rules?</Label>
                        <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm" value={lifestyleData.workplaceRules} onChange={e => setLifestyleData({...lifestyleData, workplaceRules: e.target.value})}>
                          <option value="">Select...</option>
                          <option value="Yes">Yes</option>
                          <option value="No Rules">No Rules</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {step === 0 && (
            <div className="w-full flex justify-between">
               <Button variant="ghost" onClick={() => { setDirection(1); setStep(1); }}>Skip</Button>
               <Button onClick={handleSaveLifestyle}>Save & Continue</Button>
            </div>
          )}
          {step === 1 && (
              <motion.div
                key="step1"
                custom={direction}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className="absolute inset-0 flex flex-col gap-4 overflow-y-auto pr-2 pb-10"
              >
                <div className="flex justify-center border-b pb-4">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                    className="rounded-md border shadow-sm bg-white"
                  />
                </div>

                {date && (
                  <div className="flex flex-col gap-3">
                    <h4 className="text-sm font-medium flex items-center gap-2">
                      <Clock className="w-4 h-4" /> Available Times
                    </h4>
                    {isLoadingSlots ? (
                      <div className="flex justify-center p-4"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
                    ) : slots.length > 0 ? (
                      <div className="grid grid-cols-3 gap-2">
                        {slots.map((time) => (
                          <Button
                            key={time}
                            variant={selectedTime === time ? 'default' : 'outline'}
                            className="w-full"
                            onClick={() => setSelectedTime(time)}
                          >
                            {time}
                          </Button>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground text-center p-4">No slots available for this date.</p>
                    )}
                  </div>
                )}
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                custom={direction}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className="absolute inset-0 flex flex-col gap-4 overflow-y-auto px-1"
              >
                <form id="booking-form" onSubmit={handleSubmit} className="flex flex-col gap-4">
                  <div className="p-4 bg-muted/50 rounded-lg text-sm flex flex-col gap-1 mb-2">
                    <p className="font-medium">{service.name} (Rs. {service.price})</p>
                    <p className="text-muted-foreground flex items-center gap-2">
                      <CalendarIcon className="w-3.5 h-3.5" />
                      {date ? format(date, 'MMMM d, yyyy') : ''} at {selectedTime}
                    </p>
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input id="name" required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} placeholder="Jane Doe" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" required value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} placeholder="jane@example.com" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input id="phone" type="tel" required value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} placeholder="+1 234 567 890" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="address">Address</Label>
                    <Input id="address" required value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} placeholder="123 Main St, City, Zip" />
                  </div>
                </form>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step3"
                custom={direction}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.4, ease: 'backOut' }}
                className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-center px-6"
              >
                <motion.div 
                  initial={{ scale: 0 }} 
                  animate={{ scale: 1 }} 
                  transition={{ delay: 0.2, type: 'spring' }}
                >
                  <CheckCircle2 className="w-20 h-20 text-green-500" />
                </motion.div>
                <h3 className="text-xl font-semibold mt-4">You're all set!</h3>
                <p className="text-muted-foreground text-sm">
                  We've sent a confirmation email to {formData.email} with your appointment details.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="flex justify-between mt-6 border-t pt-4 bg-white/90">
          {step === 0 && (
              <motion.div
                key="step0"
                custom={direction}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className="absolute inset-0 flex flex-col gap-4 overflow-y-auto pr-2 pb-10 px-2"
              >
                <div className="p-4 bg-primary/5 rounded-lg border border-primary/10 mb-2">
                  <h3 className="font-semibold text-lg mb-1">Personalize your experience</h3>
                  <p className="text-sm text-muted-foreground mb-4">Help us tailor this service and future recommendations to your lifestyle.</p>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>What is your job/profession?</Label>
                      <Input value={lifestyleData.job} onChange={e => setLifestyleData({...lifestyleData, job: e.target.value})} placeholder="Nurse, desk job, etc..." />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Small children?</Label>
                        <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm" value={lifestyleData.smallChildren} onChange={e => setLifestyleData({...lifestyleData, smallChildren: e.target.value})}>
                          <option value="">Select...</option>
                          <option value="Yes">Yes</option>
                          <option value="No">No</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label>Heavy chores?</Label>
                        <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm" value={lifestyleData.householdWork} onChange={e => setLifestyleData({...lifestyleData, householdWork: e.target.value})}>
                          <option value="">Select...</option>
                          <option value="Yes">Yes</option>
                          <option value="No">No</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label>Type frequently?</Label>
                        <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm" value={lifestyleData.typeOnComputer} onChange={e => setLifestyleData({...lifestyleData, typeOnComputer: e.target.value})}>
                          <option value="">Select...</option>
                          <option value="Yes">Yes</option>
                          <option value="No">No</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label>Play sports?</Label>
                        <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm" value={lifestyleData.sports} onChange={e => setLifestyleData({...lifestyleData, sports: e.target.value})}>
                          <option value="">Select...</option>
                          <option value="Yes">Yes</option>
                          <option value="No">No</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label>Heavy-handed?</Label>
                        <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm" value={lifestyleData.heavyHandUsage} onChange={e => setLifestyleData({...lifestyleData, heavyHandUsage: e.target.value})}>
                          <option value="">Select...</option>
                          <option value="Yes">Yes</option>
                          <option value="No">No</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label>Nail condition?</Label>
                        <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm" value={lifestyleData.naturalNailCondition} onChange={e => setLifestyleData({...lifestyleData, naturalNailCondition: e.target.value})}>
                          <option value="">Select...</option>
                          <option value="Strong">Strong</option>
                          <option value="Weak/Brittle">Weak/Brittle</option>
                          <option value="Damaged">Damaged</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label>Comfort vs Fashion?</Label>
                        <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm" value={lifestyleData.comfortVsFashion} onChange={e => setLifestyleData({...lifestyleData, comfortVsFashion: e.target.value})}>
                          <option value="">Select...</option>
                          <option value="Comfort First">Comfort First</option>
                          <option value="Fashion First">Fashion First</option>
                          <option value="Balanced">Balanced</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label>Workplace rules?</Label>
                        <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm" value={lifestyleData.workplaceRules} onChange={e => setLifestyleData({...lifestyleData, workplaceRules: e.target.value})}>
                          <option value="">Select...</option>
                          <option value="Yes">Yes</option>
                          <option value="No Rules">No Rules</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {step === 0 && (
            <div className="w-full flex justify-between">
               <Button variant="ghost" onClick={() => { setDirection(1); setStep(1); }}>Skip</Button>
               <Button onClick={handleSaveLifestyle}>Save & Continue</Button>
            </div>
          )}
          {step === 1 && (
            <div className="w-full flex justify-end">
               <Button onClick={handleContinueFromStep1} disabled={!date || !selectedTime || isSubmitting}>
                 {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                 Continue
               </Button>
            </div>
          )}
          {step === 2 && (
            <>
              <Button variant="ghost" onClick={prevStep} disabled={isSubmitting}>Back</Button>
              <Button type="submit" form="booking-form" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Confirm Booking
              </Button>
            </>
          )}
          {step === 3 && (
            <div className="w-full flex justify-center">
              <Button variant="outline" className="w-full" onClick={onClose}>Done</Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
