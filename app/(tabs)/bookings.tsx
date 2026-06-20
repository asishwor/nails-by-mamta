import React, { useState, useEffect, useCallback } from 'react'
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, ActivityIndicator, Alert } from 'react-native'
import { useRouter } from 'expo-router'
import { Colors, Fonts, Spacing, Radius } from '@/constants/theme'
import { fetchMyBookings, Booking } from '@/lib/api'
import { useAuthStore } from '@/store/useAuthStore'
import { Ionicons } from '@expo/vector-icons'
import { format } from 'date-fns'
import { SafeAreaView } from 'react-native-safe-area-context'

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  PENDING:   { bg: '#FFF7E6', text: '#D97706' },
  CONFIRMED: { bg: '#E6F7EC', text: '#059669' },
  COMPLETED: { bg: '#F3F4F6', text: '#6B7280' },
  CANCELLED: { bg: '#FEE2E2', text: '#DC2626' },
}

export default function BookingsScreen() {
  const router = useRouter()
  const { user } = useAuthStore()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const load = useCallback(async () => {
    if (!user) { setIsLoading(false); return }
    try {
      const data = await fetchMyBookings()
      setBookings(data)
    } catch (e) {
      console.error(e)
    } finally {
      setIsLoading(false)
      setRefreshing(false)
    }
  }, [user])

  useEffect(() => { load() }, [load])

  const onRefresh = () => { setRefreshing(true); load() }

  const now = new Date()
  const upcoming = bookings.filter((b) => new Date(b.startTime) > now && b.status !== 'CANCELLED')
  const past = bookings.filter((b) => new Date(b.startTime) <= now || b.status === 'CANCELLED')

  if (!user) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>My Bookings</Text>
        </View>
        <View style={styles.emptyState}>
          <Ionicons name="calendar-outline" size={56} color={Colors.border} />
          <Text style={styles.emptyTitle}>Sign in to see your bookings</Text>
          <TouchableOpacity style={styles.ctaBtn} onPress={() => router.push('/(auth)/login')}>
            <Text style={styles.ctaBtnText}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    )
  }

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    )
  }

  const BookingCard = ({ booking }: { booking: Booking }) => {
    const colors = STATUS_COLORS[booking.status] || STATUS_COLORS.PENDING
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardService}>{booking.service.name}</Text>
          <View style={[styles.statusBadge, { backgroundColor: colors.bg }]}>
            <Text style={[styles.statusText, { color: colors.text }]}>{booking.status}</Text>
          </View>
        </View>
        <View style={styles.cardMeta}>
          <View style={styles.metaRow}>
            <Ionicons name="calendar-outline" size={14} color={Colors.primary} />
            <Text style={styles.metaText}>{format(new Date(booking.startTime), 'MMMM d, yyyy')}</Text>
          </View>
          <View style={styles.metaRow}>
            <Ionicons name="time-outline" size={14} color={Colors.primary} />
            <Text style={styles.metaText}>
              {format(new Date(booking.startTime), 'h:mm a')} – {format(new Date(booking.endTime), 'h:mm a')}
            </Text>
          </View>
          <View style={styles.metaRow}>
            <Ionicons name="pricetag-outline" size={14} color={Colors.primary} />
            <Text style={styles.metaText}>Rs. {booking.service.price}</Text>
          </View>
        </View>
      </View>
    )
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Bookings</Text>
      </View>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
      >
        <Text style={styles.groupLabel}>Upcoming</Text>
        {upcoming.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyCardText}>No upcoming appointments.</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)')}>
              <Text style={styles.emptyCardCta}>Browse Services →</Text>
            </TouchableOpacity>
          </View>
        ) : (
          upcoming.map((b) => <BookingCard key={b.id} booking={b} />)
        )}

        <Text style={[styles.groupLabel, { marginTop: Spacing.xl }]}>Past</Text>
        {past.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyCardText}>No past appointments yet.</Text>
          </View>
        ) : (
          past.map((b) => <BookingCard key={b.id} booking={b} />)
        )}
        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background },
  header: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, paddingBottom: Spacing.lg },
  headerTitle: { fontFamily: Fonts.heading, fontSize: 32, color: Colors.charcoal },
  content: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xl },
  groupLabel: { fontFamily: Fonts.bodySemibold, fontSize: 13, letterSpacing: 1.5, color: Colors.primary, textTransform: 'uppercase', marginBottom: Spacing.md },
  card: {
    backgroundColor: Colors.surface, borderRadius: Radius.xl, padding: Spacing.md,
    marginBottom: Spacing.md, borderWidth: 1, borderColor: Colors.border,
    shadowColor: Colors.charcoal, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
  cardService: { fontFamily: Fonts.heading, fontSize: 17, color: Colors.charcoal, flex: 1, marginRight: 8 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: Radius.full },
  statusText: { fontFamily: Fonts.bodySemibold, fontSize: 11 },
  cardMeta: { gap: 6 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaText: { fontFamily: Fonts.body, fontSize: 13, color: Colors.textSecondary },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16, paddingBottom: 80 },
  emptyTitle: { fontFamily: Fonts.bodyMedium, fontSize: 16, color: Colors.textSecondary },
  ctaBtn: { backgroundColor: Colors.primary, paddingHorizontal: 32, paddingVertical: 14, borderRadius: Radius.lg, marginTop: 8 },
  ctaBtnText: { fontFamily: Fonts.bodySemibold, fontSize: 15, color: Colors.white },
  emptyCard: { backgroundColor: Colors.surface, borderRadius: Radius.xl, padding: Spacing.lg, alignItems: 'center', borderWidth: 1, borderColor: Colors.border, borderStyle: 'dashed' },
  emptyCardText: { fontFamily: Fonts.body, fontSize: 14, color: Colors.textMuted, marginBottom: 8 },
  emptyCardCta: { fontFamily: Fonts.bodySemibold, fontSize: 14, color: Colors.primary },
})
