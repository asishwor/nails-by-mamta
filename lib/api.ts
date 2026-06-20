import axios from 'axios'
import * as SecureStore from 'expo-secure-store'
import { API_BASE } from '@/constants/theme'

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
  const { data } = await api.get('/api/services')
  return data.services as Service[]
}

export const searchServicesWithAi = async (query: string) => {
  const { data } = await api.post('/api/services/search', { query })
  return data.recommendedIds as string[]
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
