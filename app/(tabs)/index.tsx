import { useLanguageStore } from '@/store/useLanguageStore';
import { translations } from '@/lib/i18n';


import { API_BASE, Colors, Fonts, Radius, Spacing } from '@/constants/theme'
import { fetchChatHistory, fetchGallery, fetchServices, fetchSettings, Service } from '@/lib/api'
import { useAuthStore } from '@/store/useAuthStore'
import { useBookingStore } from '@/store/useBookingStore'
import { Ionicons } from '@expo/vector-icons'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { Image } from 'expo-image'
import { useFocusEffect, useRouter } from 'expo-router'
import React, { useEffect, useRef, useState } from 'react'
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

const { width } = Dimensions.get('window')
const SLIDER_WIDTH = width - 88

interface GalleryImage {
  id: string
  url: string
  altText: string | null
}

export default function HomeScreen() {
  const { lang } = useLanguageStore()
  const t = translations[lang]
  const router = useRouter()
  const { user } = useAuthStore()
  const setService = useBookingStore((s) => s.setService)

  const [services, setServices] = useState<Service[]>([])
  const [popularServices, setPopularServices] = useState<Service[]>([])
  const [personalizedServices, setPersonalizedServices] = useState<Service[]>([])
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([])
  const [settings, setSettings] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [activeSlide, setActiveSlide] = useState(0)
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null)

  const fadeAnim = useRef(new Animated.Value(0)).current
  const slideAnim = useRef(new Animated.Value(30)).current
  const sliderRef = useRef<ScrollView>(null)

  // Auto-play popular services slider
  useEffect(() => {
    if (popularServices.length <= 1) return
    let currentIndex = activeSlide
    const interval = setInterval(() => {
      currentIndex = (currentIndex + 1) % popularServices.length
      sliderRef.current?.scrollTo({ x: currentIndex * (SLIDER_WIDTH + 12), animated: true })
    }, 4000)
    return () => clearInterval(interval)
  }, [popularServices.length, activeSlide])

  const loadData = async () => {
    try {
      const [svc, stg, gal] = await Promise.all([
        fetchServices(),
        fetchSettings(),
        fetchGallery()
      ])

      const activeServices = svc.filter((s) => s.isActive)
      setServices(activeServices)
      setSettings(stg)
      setGalleryImages((gal.images || []).slice(0, 4))

      // Smart popularity heuristic: prioritize Acrylic, Gel, Art, Extensions, Ombre, Spa
      // and sort by price descending
      const popular = [...activeServices].sort((a, b) => {
        const keywords = ['acrylic', 'gel', 'art', 'extension', 'ombre', 'spa']
        const aName = a.name.toLowerCase()
        const bName = b.name.toLowerCase()

        const aHasKeyword = keywords.some(kw => aName.includes(kw))
        const bHasKeyword = keywords.some(kw => bName.includes(kw))

        if (aHasKeyword && !bHasKeyword) return -1
        if (!aHasKeyword && bHasKeyword) return 1
        return b.price - a.price
      }).slice(0, 5)

      setPopularServices(popular)

      // Personalized logic
      try {
        const chatKey = `chat_history_${user?.id || 'guest'}`
        const chatStr = await AsyncStorage.getItem(chatKey)
        if (chatStr) {
          const history = JSON.parse(chatStr)
          let allIds: string[] = []
          for (const msg of history) {
            if (msg.suggestedServices && Array.isArray(msg.suggestedServices)) {
              allIds.push(...msg.suggestedServices.map((s: any) => s.id))
            }
          }
          if (allIds.length > 0) {
            const uniqueIds = Array.from(new Set(allIds.reverse())).slice(0, 3)
            setPersonalizedServices(activeServices.filter(s => uniqueIds.includes(s.id)))
          }
        }
      } catch (err) { }

    } catch (e) {
      console.error(e)
    } finally {
      setIsLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    loadData().then(() => {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
      ]).start()
    })
  }, [])

  useFocusEffect(
    React.useCallback(() => {
      const loadPersonalized = async () => {
        try {
          if (user) {
            const apiChat = await fetchChatHistory()
            if (apiChat && apiChat.messages && apiChat.messages.length > 0) {
              await AsyncStorage.setItem(`chat_history_${user.id}`, JSON.stringify(apiChat.messages))
            }
          }
          const chatKey = `chat_history_${user?.id || 'guest'}`
          const chatStr = await AsyncStorage.getItem(chatKey)
          if (chatStr) {
            const history = JSON.parse(chatStr)
            let allIds: string[] = []
            for (const msg of history) {
              if (msg.suggestedServices && Array.isArray(msg.suggestedServices)) {
                allIds.push(...msg.suggestedServices.map((s: any) => s.id))
              }
            }
            if (allIds.length > 0 && services.length > 0) {
              const uniqueIds = Array.from(new Set(allIds.reverse())).slice(0, 3)
              setPersonalizedServices(services.filter(s => uniqueIds.includes(s.id)))
            }
          }
        } catch (err) { }
      }
      loadPersonalized()
    }, [user, services])
  )

  const onRefresh = () => {
    setRefreshing(true)
    loadData()
  }

  const handleBookService = (service: Service) => {
    if (!user) {
      router.push('/(auth)/login')
      return
    }
    setService(service)
    router.push(`/services/${service.id}`)
  }

  const handleScroll = (event: any) => {
    const slideSize = SLIDER_WIDTH + 12 // Card width + margin
    const index = event.nativeEvent.contentOffset.x / slideSize
    setActiveSlide(Math.round(index))
  }

  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    )
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
      >
        {/* Header Block */}
        <Animated.View style={[styles.header, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <View style={styles.headerTop}>
            <Image source={require('../../assets/logo.png')} style={styles.logo} />
            <View style={styles.headerTextContainer}>
              <Text style={styles.headerSubtitleLabel}>✦ Premium Nail Studio</Text>
              <Text style={styles.headerTitleLabel}>Nails by Mamta</Text>
            </View>
          </View>
          {user ? (
            <Text style={styles.welcomeText}>Welcome back, {user.name?.split(' ')[0]} 👋</Text>
          ) : (
            <Text style={styles.welcomeText}>Express your style, designed for you ♡</Text>
          )}
        </Animated.View>


        {personalizedServices.length > 0 && (
          <Animated.View style={[styles.sliderSection, { opacity: fadeAnim, marginBottom: Spacing.xl }]}>
            <View style={[styles.sectionHeader, { paddingLeft: Spacing.md }]}>
              <View>
                <Text style={styles.sectionEyebrow}>✨ Personal Stylist</Text>
                <Text style={styles.sectionTitle}>Personalized For You</Text>
              </View>
            </View>

            <ScrollView
              horizontal
              snapToInterval={SLIDER_WIDTH + 12}
              decelerationRate="fast"
              snapToAlignment="start"
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.sliderContent}
            >
              {personalizedServices.map((service) => (
                <TouchableOpacity
                  key={`personalized-${service.id}`}
                  style={styles.sliderCard}
                  onPress={() => handleBookService(service)}
                  activeOpacity={0.9}
                >
                  <View style={styles.sliderCardImageContainer}>
                    {service.imageUrl ? (
                      <Image
                        source={{ uri: service.imageUrl.startsWith('http') ? service.imageUrl : `${API_BASE}${service.imageUrl}` }}
                        style={styles.sliderCardImage}
                        contentFit="cover"
                      />
                    ) : (
                      <View style={styles.sliderCardPlaceholder}>
                        <Text style={styles.sliderCardPlaceholderText}>💅</Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.sliderCardInfo}>
                    <Text style={styles.sliderCardName}>{service.name}</Text>
                    {service.description && (
                      <Text style={styles.sliderCardDesc} numberOfLines={1}>
                        {service.description}
                      </Text>
                    )}
                    <View style={styles.priceTag}>
                      <Text style={styles.priceText}>Rs. {service.price}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </Animated.View>
        )}

        {/* {t.popularServices} Slider (Hero Section) */}
        {popularServices.length > 0 && (
          <Animated.View style={[styles.sliderSection, { opacity: fadeAnim }]}>
            <View style={[styles.sectionHeader, { paddingLeft: Spacing.md }]}>
              <View>
                <Text style={styles.sectionEyebrow}>♡ Best Sellers</Text>
                <Text style={styles.sectionTitle}>{t.popularServices}</Text>
              </View>
            </View>

            <ScrollView
              ref={sliderRef}
              horizontal
              snapToInterval={SLIDER_WIDTH + 12}
              decelerationRate="fast"
              snapToAlignment="start"
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.sliderContent}
              onScroll={handleScroll}
              scrollEventThrottle={16}
            >
              {popularServices.map((service) => (
                <TouchableOpacity
                  key={service.id}
                  style={styles.sliderCard}
                  onPress={() => handleBookService(service)}
                  activeOpacity={0.9}
                >
                  <View style={styles.sliderCardImageContainer}>
                    {service.imageUrl ? (
                      <Image
                        source={{ uri: service.imageUrl.startsWith('http') ? service.imageUrl : `${API_BASE}${service.imageUrl}` }}
                        style={styles.sliderCardImage}
                        contentFit="cover"
                      />
                    ) : (
                      <View style={styles.sliderCardPlaceholder}>
                        <Text style={styles.sliderCardPlaceholderText}>💅</Text>
                      </View>
                    )}
                    <View style={styles.priceTag}>
                      <Text style={styles.priceText}>Rs. {service.price}</Text>
                    </View>
                  </View>

                  <View style={styles.sliderCardInfo}>
                    <Text style={styles.sliderCardName}>{service.name}</Text>
                    {service.description && (
                      <Text style={styles.sliderCardDesc} numberOfLines={2}>
                        {service.description}
                      </Text>
                    )}
                    <View style={styles.sliderCardFooter}>
                      <View style={styles.durationBadge}>
                        <Ionicons name="time-outline" size={13} color={Colors.primary} />
                        <Text style={styles.durationText}>{service.durationMinutes} min</Text>
                      </View>
                      <View style={styles.bookBtnInline}>
                        <Text style={styles.bookBtnInlineText}>Book</Text>
                        <Ionicons name="arrow-forward" size={13} color={Colors.white} />
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Slide Indicators */}
            <View style={styles.indicators}>
              {popularServices.map((_, idx) => (
                <View
                  key={idx}
                  style={[
                    styles.indicatorDot,
                    activeSlide === idx ? styles.indicatorActive : styles.indicatorInactive
                  ]}
                />
              ))}
            </View>
          </Animated.View>
        )}

        {/* Gallery Preview Section */}
        {galleryImages.length > 0 && (
          <Animated.View style={[styles.section, { opacity: fadeAnim }]}>
            <View style={styles.sectionHeaderRow}>
              <View>
                <Text style={styles.sectionEyebrow}>✦ Portfolio</Text>
                <Text style={styles.sectionTitle}>Recent Masterpieces</Text>
              </View>
              <TouchableOpacity onPress={() => router.push('/(tabs)/gallery')} style={styles.viewAllBtn}>
                <Text style={styles.viewAllText}>View All</Text>
                <Ionicons name="chevron-forward" size={16} color={Colors.primary} />
              </TouchableOpacity>
            </View>

            <View style={styles.galleryGrid}>
              {galleryImages.map((image) => (
                <TouchableOpacity
                  key={image.id}
                  style={styles.galleryCard}
                  onPress={() => setSelectedImage(image)}
                  activeOpacity={0.95}
                >
                  <Image
                    source={{ uri: image.url }}
                    style={styles.galleryImage}
                    contentFit="cover"
                    transition={200}
                  />
                  <View style={styles.galleryOverlay}>
                    <Ionicons name="sparkles" size={18} color={Colors.white} />
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </Animated.View>
        )}

        {/* Service Menu */}
        <Animated.View style={[styles.section, { opacity: fadeAnim }]}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionEyebrow}>💅 The Menu</Text>
            <Text style={styles.sectionTitle}>Our Services</Text>
            <Text style={styles.sectionSubtitle}>Tailored nail designs & care</Text>
          </View>

          <View style={styles.servicesGrid}>
            {services.map((service, i) => (
              <Animated.View
                key={service.id}
                style={[
                  styles.serviceCardContainer,
                  { opacity: fadeAnim, transform: [{ translateY: Animated.multiply(slideAnim, new Animated.Value(1 + i * 0.1)) }] }
                ]}
              >
                <TouchableOpacity
                  style={styles.serviceCard}
                  onPress={() => handleBookService(service)}
                  activeOpacity={0.85}
                >
                  <View style={styles.serviceCardHeader}>
                    {service.imageUrl ? (
                      <Image
                        source={{ uri: service.imageUrl.startsWith('http') ? service.imageUrl : `${API_BASE}${service.imageUrl}` }}
                        style={styles.serviceImage}
                        contentFit="cover"
                      />
                    ) : (
                      <View style={styles.serviceImagePlaceholder}>
                        <Text style={styles.serviceImagePlaceholderText}>💅</Text>
                      </View>
                    )}
                    <View style={styles.servicePriceTag}>
                      <Text style={styles.servicePriceText}>Rs. {service.price}</Text>
                    </View>
                  </View>

                  <View style={styles.serviceInfo}>
                    <Text style={styles.serviceName}>{service.name}</Text>
                    {service.description && (
                      <Text style={styles.serviceDesc} numberOfLines={2}>
                        {service.description}
                      </Text>
                    )}
                    <View style={styles.serviceCardFooter}>
                      <View style={styles.serviceDurationBadge}>
                        <Ionicons name="time-outline" size={13} color={Colors.primary} />
                        <Text style={styles.serviceDurationText}>{service.durationMinutes} Min</Text>
                      </View>
                      <View style={styles.bookBtn}>
                        <Text style={styles.bookBtnText}>{t.bookAppointment}</Text>
                        <Ionicons name="arrow-forward" size={14} color={Colors.white} />
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              </Animated.View>
            ))}
          </View>

        </Animated.View>

        {/* Studio Hours */}
        {settings && (
          <Animated.View style={[styles.section, { opacity: fadeAnim }]}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionEyebrow}>🕒 Availability</Text>
              <Text style={styles.sectionTitle}>Studio Hours</Text>
            </View>
            <View style={styles.hoursCard}>
              {daysOfWeek.map((day, idx) => {
                const dayConfig = settings.weeklySchedule?.[idx.toString()]
                const isActive = dayConfig ? dayConfig.isActive : settings.workingDays?.includes(idx)
                const start = dayConfig?.startTime || settings.startTime || '09:00'
                const end = dayConfig?.endTime || settings.endTime || '18:00'
                const formatT = (t: string) => {
                  const [h, m] = t.split(':').map(Number)
                  const ampm = h >= 12 ? 'PM' : 'AM'
                  const hour = h > 12 ? h - 12 : h || 12
                  return `${hour}:${String(m).padStart(2, '0')} ${ampm}`
                }
                return (
                  <View key={day} style={[styles.hourRow, idx < 6 && styles.hourRowBorder]}>
                    <Text style={[styles.hourDay, isActive && styles.hourDayActive]}>{day}</Text>
                    {isActive ? (
                      <Text style={styles.hourTime}>{formatT(start)} – {formatT(end)}</Text>
                    ) : (
                      <Text style={styles.hourClosed}>Closed</Text>
                    )}
                  </View>
                )
              })}
            </View>
          </Animated.View>
        )}

        {/* Contact info */}
        {settings && (
          <Animated.View style={[styles.section, { opacity: fadeAnim, marginBottom: 20 }]}>
            <View style={styles.contactCard}>
              <Ionicons name="location-outline" size={18} color={Colors.primary} />
              <Text style={styles.contactText}>{settings.contactLocation || 'Boudha, Kathmandu'}</Text>
            </View>
            {settings.contactPhone && (
              <View style={styles.contactCard}>
                <Ionicons name="call-outline" size={18} color={Colors.primary} />
                <Text style={styles.contactText}>{settings.contactPhone}</Text>
              </View>
            )}
          </Animated.View>
        )}
      </ScrollView>

      {/* Full-screen viewer Modal */}
      <Modal visible={!!selectedImage} transparent animationType="fade" onRequestClose={() => setSelectedImage(null)}>
        <View style={styles.modalBg}>
          <TouchableOpacity style={styles.closeBtn} onPress={() => setSelectedImage(null)}>
            <Ionicons name="close" size={28} color={Colors.white} />
          </TouchableOpacity>
          {selectedImage && (
            <Image
              source={{ uri: selectedImage.url }}
              style={styles.fullImage}
              contentFit="contain"
              transition={200}
            />
          )}
        </View>
      </Modal>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scrollView: { flex: 1 },
  content: { paddingBottom: Spacing.xl },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background },

  // Header Style (luxury-themed)
  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.lg,
    backgroundColor: Colors.surface,
    borderBottomLeftRadius: Radius.xl,
    borderBottomRightRadius: Radius.xl,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    shadowColor: Colors.charcoal,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 3,
  },
  headerTop: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  logo: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.surfaceAlt,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  headerTextContainer: {},
  headerSubtitleLabel: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 10,
    letterSpacing: 2,
    color: Colors.primary,
    textTransform: 'uppercase',
  },
  headerTitleLabel: {
    fontFamily: Fonts.heading,
    fontSize: 26,
    color: Colors.charcoal,
    marginTop: 2,
  },
  welcomeText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: Spacing.md,
    fontStyle: 'italic',
  },

  // Sections
  section: { paddingHorizontal: Spacing.lg, marginTop: Spacing.xl },
  sectionHeader: { marginBottom: Spacing.md },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: Spacing.md,
  },
  sectionEyebrow: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 11,
    letterSpacing: 1.5,
    color: Colors.primary,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  sectionTitle: { fontFamily: Fonts.heading, fontSize: 24, color: Colors.charcoal },
  sectionSubtitle: { fontFamily: Fonts.body, fontSize: 13, color: Colors.textMuted, marginTop: 2 },

  // Slider Section
  sliderSection: { marginTop: Spacing.xl },
  sliderContent: { paddingLeft: Spacing.lg, paddingRight: Spacing.lg - 12 },
  sliderCard: {
    width: SLIDER_WIDTH,
    height: 280,
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    marginRight: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    shadowColor: Colors.charcoal,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
    justifyContent: 'flex-end',
  },
  sliderCardImageContainer: { ...StyleSheet.absoluteFill, backgroundColor: Colors.surfaceAlt },
  sliderCardImage: { width: '100%', height: '100%' },
  sliderCardPlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  sliderCardPlaceholderText: { fontSize: 48, opacity: 0.5 },
  priceTag: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: Radius.full,
    alignSelf: 'flex-start',
    marginTop: Spacing.xs,
  },
  priceText: { fontFamily: Fonts.heading, fontSize: 14, color: Colors.primary },
  sliderCardInfo: {
    padding: Spacing.lg,
    paddingTop: Spacing.xxl,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sliderCardName: { fontFamily: Fonts.heading, fontSize: 22, color: Colors.white, marginBottom: 2 },
  sliderCardDesc: { fontFamily: Fonts.body, fontSize: 13, color: 'rgba(255,255,255,0.9)', lineHeight: 18 },
  sliderCardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  durationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.full,
    gap: 4,
  },
  durationText: { fontFamily: Fonts.bodyMedium, fontSize: 11, color: Colors.primaryDark },
  bookBtnInline: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: Radius.full,
    gap: 4,
  },
  bookBtnInlineText: { fontFamily: Fonts.bodySemibold, fontSize: 12, color: Colors.white },

  // Indicators
  indicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 14,
    gap: 6,
  },
  indicatorDot: { height: 6, borderRadius: 3 },
  indicatorActive: { width: 18, backgroundColor: Colors.primary },
  indicatorInactive: { width: 6, backgroundColor: Colors.border },

  // Gallery Grid Preview
  viewAllBtn: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  viewAllText: { fontFamily: Fonts.bodySemibold, fontSize: 13, color: Colors.primary },
  galleryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 4,
  },
  galleryCard: {
    width: (width - Spacing.lg * 2 - 24) / 3,
    height: (width - Spacing.lg * 2 - 24) / 3,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
    position: 'relative',
    backgroundColor: Colors.surface,
  },
  galleryImage: { width: '100%', height: '100%' },
  galleryOverlay: {
    position: 'absolute',
    inset: 0,
    backgroundColor: 'rgba(0,0,0,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    opacity: 0, // shown slightly on hover/active or simple overlay icon
  },

  // Service Card (Menu style matching web)
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 4,
  },
  serviceCardContainer: { marginBottom: Spacing.md },
  serviceCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.charcoal,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    width: (width - Spacing.lg * 2 - 12) / 2,
    elevation: 2,
  },
  serviceCardHeader: { position: 'relative', width: '100%', height: 160 },
  serviceImage: { width: '100%', height: '100%' },
  serviceImagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: Colors.surfaceAlt,
    justifyContent: 'center',
    alignItems: 'center',
  },
  serviceImagePlaceholderText: { fontSize: 40 },
  servicePriceTag: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: Colors.white,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: Radius.full,
    shadowColor: Colors.charcoal,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  servicePriceText: { fontFamily: Fonts.heading, fontSize: 13, color: Colors.primary, fontWeight: 'bold' },

  serviceInfo: { padding: Spacing.md },
  serviceName: { fontFamily: Fonts.heading, fontSize: 20, color: Colors.charcoal, marginBottom: 6 },
  serviceDesc: { fontFamily: Fonts.body, fontSize: 13, color: Colors.textSecondary, lineHeight: 18, marginBottom: 12 },
  serviceCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  serviceDurationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.full,
    gap: 4,
  },
  serviceDurationText: { fontFamily: Fonts.bodyMedium, fontSize: 11, color: Colors.primaryDark },
  bookBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: Radius.full,
    gap: 6,
  },
  bookBtnText: { fontFamily: Fonts.bodySemibold, fontSize: 13, color: Colors.white },

  // Studio Hours Details
  hoursCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    shadowColor: Colors.charcoal,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  hourRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.md, paddingVertical: 12 },
  hourRowBorder: { borderBottomWidth: 1, borderBottomColor: Colors.border },
  hourDay: { fontFamily: Fonts.bodyMedium, fontSize: 14, color: Colors.textMuted, width: 48 },
  hourDayActive: { color: Colors.charcoal },
  hourTime: { fontFamily: Fonts.body, fontSize: 13, color: Colors.textSecondary },
  hourClosed: { fontFamily: Fonts.body, fontSize: 13, color: Colors.textMuted, fontStyle: 'italic' },

  // Contact details
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  contactText: { fontFamily: Fonts.body, fontSize: 14, color: Colors.textSecondary, flex: 1 },

  // Modal Viewer
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', justifyContent: 'center', alignItems: 'center' },
  closeBtn: { position: 'absolute', top: 56, right: 20, zIndex: 10, padding: 8 },
  fullImage: { width, height: width * 1.3 },
})
