import { API_BASE } from '@/constants/theme'
import AsyncStorage from '@react-native-async-storage/async-storage'
import axios from 'axios'
import * as SecureStore from 'expo-secure-store'

export const api = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
})

// Attach token automatically
api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('auth_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Auth APIs
export const loginWithCredentials = async (email: string, password: string) => {
  const { data } = await api.post('/api/mobile/auth/login', { email, password })
  return data
}

export const loginWithGoogle = async (idToken: string) => {
  const { data } = await api.post('/api/mobile/auth/google', { idToken })
  return data
}

// Services
export const fetchServices = async () => {
  try {
    const { data } = await api.get('/api/services')
    await AsyncStorage.setItem('cached_services', JSON.stringify(data.services))
    return data.services as Service[]
  } catch (error) {
    const cached = await AsyncStorage.getItem('cached_services')
    if (cached) {
      return JSON.parse(cached) as Service[]
    }
    throw error
  }
}

export const searchServicesWithAi = async (query: string) => {
  const { data } = await api.post('/api/services/search', { query })
  return data.recommendedIds as string[]
}

export const fetchChatHistory = async () => {
  const { data } = await api.get('/api/chat/history')
  return data
}

export const chatWithAi = async (messages: any[], sessionId?: string, userId?: string, userContext?: any, locale: string = 'en') => {
  const { data } = await api.post('/api/chat', { messages, sessionId, userId, userContext, locale })
  return {
    reply: data.reply as string,
    suggestedServiceIds: (data.suggestedServiceIds || []) as string[],
    userInfo: data.userInfo as any,
    sessionId: data.sessionId as string
  }
}

// Settings (public)
export const fetchSettings = async () => {
  const { data } = await api.get('/api/settings')
  return data.settings
}

// Gallery
export const fetchGallery = async (cursor?: string) => {
  const url = cursor ? `/api/gallery?cursor=${cursor}&limit=20` : '/api/gallery?limit=20'
  const { data } = await api.get(url)
  return data
}

// Bookings (authenticated)
export const fetchMyBookings = async () => {
  const { data } = await api.get('/api/mobile/bookings')
  return data.bookings as Booking[]
}

export const createBooking = async (payload: { serviceId: string; date: string; time: string }) => {
  const { data } = await api.post('/api/mobile/bookings', payload)
  return data.booking as Booking
}

export const cancelBooking = async (id: string, reason: string) => {
  const { data } = await api.post(`/api/mobile/bookings/${id}/cancel`, { reason })
  return data.booking as Booking
}

// Available slots
export const fetchSlots = async (serviceId: string, date: string) => {
  const { data } = await api.get(`/api/slots?serviceId=${serviceId}&date=${date}`)
  return data.slots as string[]
}

// User profile
export const fetchProfile = async () => {
  const { data } = await api.get('/api/mobile/user')
  return data.user as User
}

export const updateProfile = async (payload: { name?: string; phone?: string; address?: string }) => {
  const { data } = await api.put('/api/mobile/user', payload)
  return data.user as User
}

// Types
export interface Service {
  id: string
  name: string
  description: string | null
  price: number
  durationMinutes: number
  imageUrl: string | null
  isActive: boolean
}

export interface Booking {
  id: string
  serviceId: string
  startTime: string
  endTime: string
  status: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED'
  service: Service
  createdAt: string
}

export interface User {
  id: string
  name: string | null
  email: string | null
  role: string
  image: string | null
  phone: string | null
  address: string | null
}
