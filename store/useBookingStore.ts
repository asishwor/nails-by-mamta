import { create } from 'zustand'
import { Service } from '@/lib/api'

interface BookingState {
  selectedService: Service | null
  selectedDate: string | null   // 'yyyy-MM-dd'
  selectedTime: string | null   // 'HH:mm'
  setService: (service: Service) => void
  setDate: (date: string) => void
  setTime: (time: string) => void
  reset: () => void
}

export const useBookingStore = create<BookingState>((set) => ({
  selectedService: null,
  selectedDate: null,
  selectedTime: null,

  setService: (service) => set({ selectedService: service, selectedDate: null, selectedTime: null }),
  setDate: (date) => set({ selectedDate: date, selectedTime: null }),
  setTime: (time) => set({ selectedTime: time }),
  reset: () => set({ selectedService: null, selectedDate: null, selectedTime: null }),
}))
