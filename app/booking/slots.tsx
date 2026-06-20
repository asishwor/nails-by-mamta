import React, { useState, useEffect } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native'
import { useRouter } from 'expo-router'
import { Colors, Fonts, Spacing, Radius } from '@/constants/theme'
import { fetchSlots } from '@/lib/api'
import { useBookingStore } from '@/store/useBookingStore'
import { Ionicons } from '@expo/vector-icons'
import { format, addDays, isSameDay } from 'date-fns'
import { SafeAreaView } from 'react-native-safe-area-context'

export default function SlotsScreen() {
  const router = useRouter()
  const { selectedService, selectedDate, selectedTime, setDate, setTime } = useBookingStore()

  const [slots, setSlots] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // Generate next 14 days
  const today = new Date()
  const days = Array.from({ length: 14 }, (_, i) => addDays(today, i))

  useEffect(() => {
    if (selectedService && selectedDate) {
      setIsLoading(true)
      fetchSlots(selectedService.id, selectedDate)
        .then(setSlots)
        .catch(() => setSlots([]))
        .finally(() => setIsLoading(false))
    }
  }, [selectedService, selectedDate])

  const handleDateSelect = (date: Date) => {
    setDate(format(date, 'yyyy-MM-dd'))
  }

  if (!selectedService) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>No service selected.</Text>
        <TouchableOpacity onPress={() => router.replace('/(tabs)')}>
          <Text style={styles.backLink}>Go Home</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color={Colors.charcoal} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Choose a Time</Text>
          <Text style={styles.headerSubtitle}>{selectedService.name}</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* Date Picker */}
        <Text style={styles.sectionLabel}>Select Date</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dateScroll}>
          {days.map((day) => {
            const dateStr = format(day, 'yyyy-MM-dd')
            const isSelected = selectedDate === dateStr
            const isToday = isSameDay(day, today)
            return (
              <TouchableOpacity
                key={dateStr}
                style={[styles.dateCard, isSelected && styles.dateCardSelected]}
                onPress={() => handleDateSelect(day)}
              >
                <Text style={[styles.dayName, isSelected && styles.dateTextSelected]}>
                  {isToday ? 'Today' : format(day, 'EEE')}
                </Text>
                <Text style={[styles.dayNum, isSelected && styles.dateTextSelected]}>
                  {format(day, 'd')}
                </Text>
                <Text style={[styles.dayMonth, isSelected && styles.dateTextSelected]}>
                  {format(day, 'MMM')}
                </Text>
              </TouchableOpacity>
            )
          })}
        </ScrollView>

        {/* Time Slots */}
        {selectedDate && (
          <>
            <Text style={[styles.sectionLabel, { marginTop: Spacing.xl }]}>Available Times</Text>
            {isLoading ? (
              <ActivityIndicator color={Colors.primary} style={{ marginTop: Spacing.lg }} />
            ) : slots.length === 0 ? (
              <View style={styles.noSlots}>
                <Ionicons name="calendar-outline" size={36} color={Colors.border} />
                <Text style={styles.noSlotsText}>No available slots for this day</Text>
              </View>
            ) : (
              <View style={styles.slotsGrid}>
                {slots.map((slot) => {
                  const isSelected = selectedTime === slot
                  const [h, m] = slot.split(':').map(Number)
                  const ampm = h >= 12 ? 'PM' : 'AM'
                  const hour = h > 12 ? h - 12 : h || 12
                  const label = `${hour}:${String(m).padStart(2, '0')} ${ampm}`
                  return (
                    <TouchableOpacity
                      key={slot}
                      style={[styles.slotBtn, isSelected && styles.slotBtnSelected]}
                      onPress={() => setTime(slot)}
                    >
                      <Text style={[styles.slotText, isSelected && styles.slotTextSelected]}>{label}</Text>
                    </TouchableOpacity>
                  )
                })}
              </View>
            )}
          </>
        )}
      </ScrollView>

      {/* CTA */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.continueBtn, (!selectedDate || !selectedTime) && styles.continueBtnDisabled]}
          onPress={() => router.push('/booking/confirm')}
          disabled={!selectedDate || !selectedTime}
        >
          <Text style={styles.continueBtnText}>Review Booking</Text>
          <Ionicons name="arrow-forward" size={18} color={Colors.white} />
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
  headerContent: {},
  headerTitle: { fontFamily: Fonts.heading, fontSize: 22, color: Colors.charcoal },
  headerSubtitle: { fontFamily: Fonts.body, fontSize: 13, color: Colors.textMuted },
  content: { padding: Spacing.lg, paddingBottom: 20 },
  sectionLabel: { fontFamily: Fonts.bodySemibold, fontSize: 12, letterSpacing: 1.2, textTransform: 'uppercase', color: Colors.textMuted, marginBottom: Spacing.sm },
  dateScroll: { marginHorizontal: -Spacing.lg, paddingHorizontal: Spacing.lg },
  dateCard: { width: 62, padding: 10, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.surface, alignItems: 'center', marginRight: 10 },
  dateCardSelected: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  dayName: { fontFamily: Fonts.body, fontSize: 11, color: Colors.textMuted },
  dayNum: { fontFamily: Fonts.heading, fontSize: 22, color: Colors.charcoal, marginVertical: 2 },
  dayMonth: { fontFamily: Fonts.body, fontSize: 11, color: Colors.textMuted },
  dateTextSelected: { color: Colors.white },
  slotsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  slotBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.surface },
  slotBtnSelected: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  slotText: { fontFamily: Fonts.bodyMedium, fontSize: 14, color: Colors.charcoal },
  slotTextSelected: { color: Colors.white },
  noSlots: { alignItems: 'center', gap: 10, paddingVertical: Spacing.xl },
  noSlotsText: { fontFamily: Fonts.body, fontSize: 14, color: Colors.textMuted },
  footer: { padding: Spacing.lg, borderTopWidth: 1, borderTopColor: Colors.border, backgroundColor: Colors.background },
  continueBtn: { backgroundColor: Colors.primary, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10, paddingVertical: 16, borderRadius: Radius.lg },
  continueBtnDisabled: { backgroundColor: Colors.border },
  continueBtnText: { fontFamily: Fonts.bodySemibold, fontSize: 16, color: Colors.white },
})
