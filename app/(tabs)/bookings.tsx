import { useLanguageStore } from '@/store/useLanguageStore';
import { translations } from '@/lib/i18n';
import React, { useState, useEffect, useCallback } from 'react'
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, ActivityIndicator, Alert, TextInput, Modal, KeyboardAvoidingView, Platform } from 'react-native'
import { useRouter, useFocusEffect } from 'expo-router'
import { Colors, Fonts, Spacing, Radius } from '@/constants/theme'
import { fetchMyBookings, Booking, cancelBooking } from '@/lib/api'
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
  const { lang } = useLanguageStore()
  const t = translations[lang]
  const router = useRouter()
  const { user } = useAuthStore()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [cancelModalVisible, setCancelModalVisible] = useState(false)
  const [cancellingBookingId, setCancellingBookingId] = useState<string | null>(null)
  const [cancelReason, setCancelReason] = useState('')
  const [isCancelling, setIsCancelling] = useState(false)

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

  useFocusEffect(
    useCallback(() => {
      load()
    }, [load])
  )

    const onRefresh = () => { setRefreshing(true); load() }

  const openCancelModal = (id: string) => {
    setCancellingBookingId(id)
    setCancelReason('')
    setCancelModalVisible(true)
  }

  const handleCancelSubmit = async () => {
    if (!cancellingBookingId || !cancelReason.trim()) return
    setIsCancelling(true)
    try {
      await cancelBooking(cancellingBookingId, cancelReason)
      setCancelModalVisible(false)
      load() // refresh bookings
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.error || 'Failed to cancel booking')
    } finally {
      setIsCancelling(false)
    }
  }

  const now = new Date()
  const upcoming = bookings.filter((b) => new Date(b.startTime) > now && b.status !== 'CANCELLED' && b.status !== 'COMPLETED')
  const past = bookings.filter((b) => new Date(b.startTime) <= now || b.status === 'CANCELLED' || b.status === 'COMPLETED')

  if (!user) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{t.myBookings}</Text>
        </View>
        <View style={styles.emptyState}>
          <Ionicons name="calendar-outline" size={56} color={Colors.border} />
          <Text style={styles.emptyTitle}>{t.signInToManage}</Text>
          <TouchableOpacity style={styles.ctaBtn} onPress={() => router.push('/(auth)/login')}>
            <Text style={styles.ctaBtnText}>{t.signIn}</Text>
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
        {booking.status === 'PENDING' && (
          <TouchableOpacity style={styles.cancelBtn} onPress={() => openCancelModal(booking.id)}>
            <Text style={styles.cancelBtnText}>{t.cancelBooking}</Text>
          </TouchableOpacity>
        )}
      </View>
    )
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t.myBookings}</Text>
      </View>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
      >
        <Text style={styles.groupLabel}>{t.upcoming}</Text>
        {upcoming.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyCardText}>{t.noUpcoming}</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)')}>
              <Text style={styles.emptyCardCta}>{t.browseServices}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          upcoming.map((b) => <BookingCard key={b.id} booking={b} />)
        )}

        <Text style={[styles.groupLabel, { marginTop: Spacing.xl }]}>{t.past}</Text>
        {past.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyCardText}>{t.noPast}</Text>
          </View>
        ) : (
          past.map((b) => <BookingCard key={b.id} booking={b} />)
        )}
        <View style={{ height: 32 }} />
              <View style={{ height: 32 }} />
      </ScrollView>

      {/* Cancel Modal */}
      <Modal visible={cancelModalVisible} transparent animationType="fade">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t.cancelBooking}</Text>
            <Text style={styles.modalSubtitle}>Please let us know why you are cancelling this appointment.</Text>
            
            <TextInput
              style={styles.textInput}
              placeholder="e.g. Schedule conflict, changed my mind..."
              value={cancelReason}
              onChangeText={setCancelReason}
              multiline
              numberOfLines={3}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalBtnCancel} onPress={() => setCancelModalVisible(false)} disabled={isCancelling}>
                <Text style={styles.modalBtnCancelText}>Keep Booking</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalBtnSubmit, (!cancelReason.trim() || isCancelling) && { opacity: 0.5 }]} 
                onPress={handleCancelSubmit}
                disabled={!cancelReason.trim() || isCancelling}
              >
                {isCancelling ? <ActivityIndicator color={Colors.white} size="small" /> : <Text style={styles.modalBtnSubmitText}>Cancel</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

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
  emptyCardText: { fontFamily: Fonts.body, color: Colors.textMuted, marginTop: 8 },
  emptyCardCta: { fontFamily: Fonts.bodySemibold, color: Colors.primary, marginTop: 12 },
  cancelBtn: { marginTop: Spacing.md, paddingTop: Spacing.md, borderTopWidth: 1, borderTopColor: Colors.border, alignItems: 'center' },
  cancelBtnText: { fontFamily: Fonts.bodySemibold, fontSize: 13, color: Colors.error || '#DC2626' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: Spacing.lg },
  modalContent: { backgroundColor: Colors.surface, borderRadius: Radius.xl, padding: Spacing.xl },
  modalTitle: { fontFamily: Fonts.heading, fontSize: 20, color: Colors.charcoal, marginBottom: 4 },
  modalSubtitle: { fontFamily: Fonts.body, fontSize: 13, color: Colors.textMuted, marginBottom: Spacing.lg },
  textInput: { borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.lg, padding: Spacing.md, fontFamily: Fonts.body, fontSize: 14, minHeight: 80, textAlignVertical: 'top', marginBottom: Spacing.xl },
  modalActions: { flexDirection: 'row', gap: Spacing.md },
  modalBtnCancel: { flex: 1, paddingVertical: 12, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.border, alignItems: 'center' },
  modalBtnCancelText: { fontFamily: Fonts.bodySemibold, color: Colors.charcoal },
  modalBtnSubmit: { flex: 1, paddingVertical: 12, borderRadius: Radius.lg, backgroundColor: Colors.error || '#DC2626', alignItems: 'center' },
  modalBtnSubmitText: { fontFamily: Fonts.bodySemibold, color: Colors.white },
})
