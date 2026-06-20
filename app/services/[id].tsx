import React, { useEffect, useState } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Colors, Fonts, Spacing, Radius, API_BASE } from '@/constants/theme'
import { fetchServices, Service } from '@/lib/api'
import { useAuthStore } from '@/store/useAuthStore'
import { useBookingStore } from '@/store/useBookingStore'
import { Ionicons } from '@expo/vector-icons'
import { SafeAreaView } from 'react-native-safe-area-context'

export default function ServiceDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const { user } = useAuthStore()
  const { setService } = useBookingStore()
  const [service, setServiceData] = useState<Service | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchServices().then((services) => {
      const found = services.find((s) => s.id === id)
      setServiceData(found || null)
      setIsLoading(false)
    })
  }, [id])

  const handleBook = () => {
    if (!user) {
      router.push('/(auth)/login')
      return
    }
    if (service) {
      setService(service)
      router.push('/booking/slots')
    }
  }

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    )
  }

  if (!service) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={{ fontFamily: Fonts.body, color: Colors.textMuted }}>Service not found</Text>
      </View>
    )
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Back */}
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color={Colors.charcoal} />
        </TouchableOpacity>

        {/* Image */}
        {service.imageUrl ? (
          <Image source={{ uri: service.imageUrl.startsWith('http') ? service.imageUrl : `${API_BASE}${service.imageUrl}` }} style={styles.image} resizeMode="cover" />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Text style={{ fontSize: 64 }}>💅</Text>
          </View>
        )}

        <View style={styles.content}>
          {/* Price badge */}
          <View style={styles.priceRow}>
            <View style={styles.priceBadge}>
              <Text style={styles.priceText}>Rs. {service.price}</Text>
            </View>
            <View style={styles.durationBadge}>
              <Ionicons name="time-outline" size={14} color={Colors.textSecondary} />
              <Text style={styles.durationText}>{service.durationMinutes} min</Text>
            </View>
          </View>

          <Text style={styles.name}>{service.name}</Text>

          {service.description && (
            <>
              <Text style={styles.descLabel}>About this service</Text>
              <Text style={styles.description}>{service.description}</Text>
            </>
          )}

          {/* What to expect */}
          <View style={styles.infoBox}>
            <Text style={styles.infoTitle}>What to expect</Text>
            {[
              { icon: 'checkmark-circle-outline', text: 'Professional nail artist' },
              { icon: 'shield-checkmark-outline', text: 'Premium quality products' },
              { icon: 'time-outline', text: `${service.durationMinutes} minute session` },
              { icon: 'location-outline', text: 'At our studio in Boudha, Kathmandu' },
            ].map((item, i) => (
              <View key={i} style={styles.infoRow}>
                <Ionicons name={item.icon as any} size={16} color={Colors.primary} />
                <Text style={styles.infoText}>{item.text}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Book CTA */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.bookBtn} onPress={handleBook}>
          <Text style={styles.bookBtnText}>Book This Service</Text>
          <Ionicons name="arrow-forward" size={18} color={Colors.white} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background },
  backBtn: { position: 'absolute', top: 12, left: 16, zIndex: 10, backgroundColor: Colors.surface, borderRadius: 20, padding: 8, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 8, elevation: 4 },
  image: { width: '100%', height: 280 },
  imagePlaceholder: { width: '100%', height: 240, backgroundColor: Colors.surfaceAlt, justifyContent: 'center', alignItems: 'center' },
  content: { padding: Spacing.lg },
  priceRow: { flexDirection: 'row', gap: 10, marginBottom: Spacing.md },
  priceBadge: { backgroundColor: Colors.primaryLight, paddingHorizontal: 14, paddingVertical: 6, borderRadius: Radius.full },
  priceText: { fontFamily: Fonts.bodySemibold, fontSize: 15, color: Colors.primaryDark },
  durationBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.surfaceAlt, paddingHorizontal: 12, paddingVertical: 6, borderRadius: Radius.full },
  durationText: { fontFamily: Fonts.body, fontSize: 13, color: Colors.textSecondary },
  name: { fontFamily: Fonts.heading, fontSize: 30, color: Colors.charcoal, marginBottom: Spacing.lg },
  descLabel: { fontFamily: Fonts.bodySemibold, fontSize: 12, letterSpacing: 1, textTransform: 'uppercase', color: Colors.textMuted, marginBottom: 8 },
  description: { fontFamily: Fonts.body, fontSize: 15, color: Colors.textSecondary, lineHeight: 24, marginBottom: Spacing.lg },
  infoBox: { backgroundColor: Colors.surface, borderRadius: Radius.xl, padding: Spacing.md, gap: 12, borderWidth: 1, borderColor: Colors.border },
  infoTitle: { fontFamily: Fonts.bodySemibold, fontSize: 14, color: Colors.charcoal, marginBottom: 4 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  infoText: { fontFamily: Fonts.body, fontSize: 14, color: Colors.textSecondary },
  footer: { padding: Spacing.lg, backgroundColor: Colors.background, borderTopWidth: 1, borderTopColor: Colors.border },
  bookBtn: { backgroundColor: Colors.primary, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10, paddingVertical: 16, borderRadius: Radius.lg },
  bookBtnText: { fontFamily: Fonts.bodySemibold, fontSize: 16, color: Colors.white },
})
