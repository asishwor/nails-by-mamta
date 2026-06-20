import React, { useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, Animated, Easing } from 'react-native'
import { useRouter } from 'expo-router'
import { Colors, Fonts, Spacing, Radius } from '@/constants/theme'
import { createBooking } from '@/lib/api'
import { useBookingStore } from '@/store/useBookingStore'
import { Ionicons } from '@expo/vector-icons'
import { format, parse } from 'date-fns'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRef, useEffect } from 'react'

export default function ConfirmScreen() {
  const router = useRouter()
  const { selectedService, selectedDate, selectedTime, reset } = useBookingStore()
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const scaleAnim = useRef(new Animated.Value(0)).current

  const playSuccess = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 5,
      tension: 100,
      useNativeDriver: true,
    }).start()
  }

  const formatTime = (t: string) => {
    const [h, m] = t.split(':').map(Number)
    const ampm = h >= 12 ? 'PM' : 'AM'
    const hour = h > 12 ? h - 12 : h || 12
    return `${hour}:${String(m).padStart(2, '0')} ${ampm}`
  }

  const handleConfirm = async () => {
    if (!selectedService || !selectedDate || !selectedTime) return
    setIsLoading(true)
    try {
      await createBooking({ serviceId: selectedService.id, date: selectedDate, time: selectedTime })
      setIsSuccess(true)
      playSuccess()
      reset()
    } catch (e: any) {
      Alert.alert('Booking Failed', e?.response?.data?.error || 'Please try again')
    } finally {
      setIsLoading(false)
    }
  }

  if (!selectedService || !selectedDate || !selectedTime) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>Booking info missing.</Text>
        <TouchableOpacity onPress={() => router.replace('/(tabs)')}>
          <Text style={styles.backLink}>Go Home</Text>
        </TouchableOpacity>
      </View>
    )
  }

  if (isSuccess) {
    return (
      <SafeAreaView style={styles.successContainer} edges={['top', 'bottom']}>
        <Animated.View style={[styles.successContent, { transform: [{ scale: scaleAnim }] }]}>
          <View style={styles.successIcon}>
            <Ionicons name="checkmark" size={48} color={Colors.white} />
          </View>
          <Text style={styles.successTitle}>Booking Confirmed!</Text>
          <Text style={styles.successSubtitle}>
            Your appointment for {selectedService?.name} has been submitted.{'\n'}We'll confirm shortly.
          </Text>
          <TouchableOpacity style={styles.doneBtn} onPress={() => { router.replace('/(tabs)/bookings') }}>
            <Text style={styles.doneBtnText}>View My Bookings</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.replace('/(tabs)')}>
            <Text style={styles.homeLink}>Back to Home</Text>
          </TouchableOpacity>
        </Animated.View>
      </SafeAreaView>
    )
  }

  const parsedDate = parse(selectedDate!, 'yyyy-MM-dd', new Date())

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color={Colors.charcoal} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Review Booking</Text>
      </View>

      <View style={styles.content}>
        {/* Summary Card */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Service</Text>
          <Text style={styles.cardService}>{selectedService.name}</Text>

          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <View style={styles.detailItem}>
              <Ionicons name="calendar-outline" size={16} color={Colors.primary} />
              <View>
                <Text style={styles.detailLabel}>Date</Text>
                <Text style={styles.detailValue}>{format(parsedDate, 'MMMM d, yyyy')}</Text>
              </View>
            </View>
            <View style={styles.detailItem}>
              <Ionicons name="time-outline" size={16} color={Colors.primary} />
              <View>
                <Text style={styles.detailLabel}>Time</Text>
                <Text style={styles.detailValue}>{formatTime(selectedTime)}</Text>
              </View>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <View style={styles.detailItem}>
              <Ionicons name="pricetag-outline" size={16} color={Colors.primary} />
              <View>
                <Text style={styles.detailLabel}>Price</Text>
                <Text style={styles.detailValue}>Rs. {selectedService.price}</Text>
              </View>
            </View>
            <View style={styles.detailItem}>
              <Ionicons name="hourglass-outline" size={16} color={Colors.primary} />
              <View>
                <Text style={styles.detailLabel}>Duration</Text>
                <Text style={styles.detailValue}>{selectedService.durationMinutes} min</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.noteBox}>
          <Ionicons name="information-circle-outline" size={16} color={Colors.primary} />
          <Text style={styles.noteText}>Payment is due at the studio. Your booking will be confirmed by the team.</Text>
        </View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirm} disabled={isLoading}>
          {isLoading ? (
            <ActivityIndicator color={Colors.white} />
          ) : (
            <>
              <Text style={styles.confirmBtnText}>Confirm Booking</Text>
              <Ionicons name="checkmark" size={18} color={Colors.white} />
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { fontFamily: Fonts.body, color: Colors.textMuted, marginBottom: 12 },
  backLink: { fontFamily: Fonts.bodySemibold, color: Colors.primary },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border },
  headerTitle: { fontFamily: Fonts.heading, fontSize: 22, color: Colors.charcoal },
  content: { flex: 1, padding: Spacing.lg },
  card: { backgroundColor: Colors.surface, borderRadius: Radius.xl, padding: Spacing.lg, borderWidth: 1, borderColor: Colors.border, shadowColor: Colors.charcoal, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 12, elevation: 3 },
  cardLabel: { fontFamily: Fonts.bodySemibold, fontSize: 11, letterSpacing: 1.2, textTransform: 'uppercase', color: Colors.textMuted, marginBottom: 4 },
  cardService: { fontFamily: Fonts.heading, fontSize: 26, color: Colors.charcoal },
  divider: { height: 1, backgroundColor: Colors.border, marginVertical: Spacing.md },
  detailRow: { flexDirection: 'row', gap: Spacing.lg },
  detailItem: { flex: 1, flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  detailLabel: { fontFamily: Fonts.body, fontSize: 11, color: Colors.textMuted },
  detailValue: { fontFamily: Fonts.bodySemibold, fontSize: 15, color: Colors.charcoal },
  noteBox: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: Colors.primaryLight + '40', borderRadius: Radius.lg, padding: Spacing.md, marginTop: Spacing.md },
  noteText: { fontFamily: Fonts.body, fontSize: 13, color: Colors.textSecondary, flex: 1, lineHeight: 20 },
  footer: { padding: Spacing.lg, borderTopWidth: 1, borderTopColor: Colors.border, backgroundColor: Colors.background },
  confirmBtn: { backgroundColor: Colors.primary, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10, paddingVertical: 16, borderRadius: Radius.lg },
  confirmBtnText: { fontFamily: Fonts.bodySemibold, fontSize: 16, color: Colors.white },
  successContainer: { flex: 1, backgroundColor: Colors.background, justifyContent: 'center', alignItems: 'center' },
  successContent: { alignItems: 'center', paddingHorizontal: Spacing.xl },
  successIcon: { width: 96, height: 96, borderRadius: 48, backgroundColor: Colors.success, justifyContent: 'center', alignItems: 'center', marginBottom: Spacing.xl, shadowColor: Colors.success, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 20 },
  successTitle: { fontFamily: Fonts.heading, fontSize: 32, color: Colors.charcoal, marginBottom: 12, textAlign: 'center' },
  successSubtitle: { fontFamily: Fonts.body, fontSize: 15, color: Colors.textSecondary, lineHeight: 24, textAlign: 'center', marginBottom: Spacing.xl },
  doneBtn: { backgroundColor: Colors.primary, paddingHorizontal: 40, paddingVertical: 14, borderRadius: Radius.lg, marginBottom: 16 },
  doneBtnText: { fontFamily: Fonts.bodySemibold, fontSize: 15, color: Colors.white },
  homeLink: { fontFamily: Fonts.body, fontSize: 14, color: Colors.textMuted },
})
