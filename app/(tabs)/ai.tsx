import React, { useState } from 'react'
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert, Dimensions, Image } from 'react-native'
import { Colors, Fonts, Spacing, Radius, API_BASE } from '@/constants/theme'
import { fetchServices, searchServicesWithAi, Service } from '@/lib/api'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useBookingStore } from '@/store/useBookingStore'
import { useAuthStore } from '@/store/useAuthStore'

const { width } = Dimensions.get('window')

const EXAMPLE_PROMPTS = [
  { text: "Wedding look for a pink pastel dress", icon: "💅" },
  { text: "Professional & clean office nails", icon: "✨" },
  { text: "Bold & vibrant party styles", icon: "🔥" },
  { text: "Subtle and cute spring vibes", icon: "🌸" },
]

export default function AiSearchScreen() {
  const router = useRouter()
  const { user } = useAuthStore()
  const setBookingService = useBookingStore((s) => s.setService)

  const [query, setQuery] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [recommendations, setRecommendations] = useState<Service[]>([])
  const [hasSearched, setHasSearched] = useState(false)

  const handleSearch = async (searchQuery: string) => {
    const activeQuery = searchQuery.trim()
    if (!activeQuery) {
      Alert.alert('Empty query', 'Please type or select a style description first!')
      return
    }

    setQuery(activeQuery)
    setIsLoading(true)
    setHasSearched(true)

    try {
      // 1. Fetch matching recommended IDs from AI API
      const recommendedIds = await searchServicesWithAi(activeQuery)
      
      // 2. Fetch all services to match details
      const allServices = await fetchServices()
      
      // 3. Filter and order recommended services
      const matched = recommendedIds
        .map((id) => allServices.find((s) => s.id === id && s.isActive))
        .filter((s): s is Service => !!s)

      setRecommendations(matched)
    } catch (e: any) {
      console.error(e)
      Alert.alert('AI Assistant Error', 'Failed to process recommendations. Please verify your AI API key settings.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleBook = (service: Service) => {
    if (!user) {
      router.push('/(auth)/login')
      return
    }
    setBookingService(service)
    router.push(`/services/${service.id}`)
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Ionicons name="sparkles" size={24} color={Colors.primary} />
          </View>
          <Text style={styles.title}>AI Styling Assistant</Text>
          <Text style={styles.subtitle}>
            Describe your event, outfit, or mood, and our AI will recommend the perfect nail services for you.
          </Text>
        </View>

        {/* Input Card */}
        <View style={styles.card}>
          <TextInput
            style={styles.input}
            placeholder="E.g., I need something elegant for a formal gala, wearing a black velvet gown..."
            placeholderTextColor={Colors.textMuted}
            value={query}
            onChangeText={setQuery}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />

          <TouchableOpacity
            style={styles.searchBtn}
            onPress={() => handleSearch(query)}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            {isLoading ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <>
                <Text style={styles.searchBtnText}>Analyze Style</Text>
                <Ionicons name="color-wand-outline" size={18} color={Colors.white} />
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Example Prompts */}
        {!hasSearched && (
          <View style={styles.examplesContainer}>
            <Text style={styles.sectionTitle}>Try these ideas</Text>
            <View style={styles.promptGrid}>
              {EXAMPLE_PROMPTS.map((prompt) => (
                <TouchableOpacity
                  key={prompt.text}
                  style={styles.promptCard}
                  onPress={() => handleSearch(prompt.text)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.promptIcon}>{prompt.icon}</Text>
                  <Text style={styles.promptText} numberOfLines={2}>
                    {prompt.text}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Recommendations */}
        {hasSearched && (
          <View style={styles.resultsContainer}>
            <View style={styles.resultsHeader}>
              <Text style={styles.sectionTitle}>AI Recommendations</Text>
              <TouchableOpacity
                onPress={() => {
                  setHasSearched(false)
                  setRecommendations([])
                  setQuery('')
                }}
              >
                <Text style={styles.clearBtn}>Reset</Text>
              </TouchableOpacity>
            </View>

            {isLoading ? (
              <View style={styles.loaderBox}>
                <ActivityIndicator size="large" color={Colors.primary} />
                <Text style={styles.loaderText}>Consulting digital catalog...</Text>
              </View>
            ) : recommendations.length > 0 ? (
              recommendations.map((service) => (
                <TouchableOpacity
                  key={service.id}
                  style={styles.serviceCard}
                  onPress={() => handleBook(service)}
                  activeOpacity={0.9}
                >
                  {service.imageUrl ? (
                    <Image
                      source={{ uri: service.imageUrl.startsWith('http') ? service.imageUrl : `${API_BASE}${service.imageUrl}` }}
                      style={styles.serviceImage}
                    />
                  ) : (
                    <View style={styles.servicePlaceholder}>
                      <Text style={styles.placeholderIcon}>💅</Text>
                    </View>
                  )}
                  <View style={styles.serviceInfo}>
                    <Text style={styles.serviceName}>{service.name}</Text>
                    <Text style={styles.serviceDesc} numberOfLines={2}>
                      {service.description}
                    </Text>
                    <View style={styles.serviceFooter}>
                      <View style={styles.durationBadge}>
                        <Ionicons name="time-outline" size={13} color={Colors.textMuted} />
                        <Text style={styles.durationText}>{service.durationMinutes} min</Text>
                      </View>
                      <View style={styles.priceTag}>
                        <Text style={styles.priceText}>Rs. {service.price}</Text>
                      </View>
                    </View>
                  </View>
                  <View style={styles.bookBtn}>
                    <Text style={styles.bookBtnText}>Book</Text>
                    <Ionicons name="arrow-forward" size={14} color={Colors.white} />
                  </View>
                </TouchableOpacity>
              ))
            ) : (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyIcon}>🔍</Text>
                <Text style={styles.emptyTitle}>No exact matches found</Text>
                <Text style={styles.emptySubtitle}>
                  Try describing your preference differently or search for keywords like "acrylic", "art", or "gel".
                </Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: Radius.md,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  title: {
    fontFamily: Fonts.heading,
    fontSize: 28,
    color: Colors.charcoal,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontFamily: Fonts.body,
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: Spacing.sm,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.charcoal,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
    marginBottom: Spacing.xl,
  },
  input: {
    fontFamily: Fonts.body,
    fontSize: 15,
    color: Colors.charcoal,
    height: 80,
    backgroundColor: Colors.surfaceAlt,
    borderRadius: Radius.sm,
    padding: Spacing.sm,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.sm,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  searchBtnText: {
    fontFamily: Fonts.bodySemibold,
    fontSize: 15,
    color: Colors.white,
  },
  examplesContainer: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontFamily: Fonts.heading,
    fontSize: 20,
    color: Colors.charcoal,
    marginBottom: Spacing.md,
  },
  promptGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  promptCard: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    padding: Spacing.md,
    width: (width - Spacing.lg * 2 - 12) / 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    shadowColor: Colors.charcoal,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  promptIcon: {
    fontSize: 20,
  },
  promptText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 12,
    color: Colors.textSecondary,
    flex: 1,
    lineHeight: 16,
  },
  resultsContainer: {
    marginTop: Spacing.xs,
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  clearBtn: {
    fontFamily: Fonts.bodySemibold,
    fontSize: 14,
    color: Colors.primary,
  },
  loaderBox: {
    paddingVertical: 40,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loaderText: {
    fontFamily: Fonts.body,
    fontSize: 14,
    color: Colors.textMuted,
  },
  serviceCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    marginBottom: Spacing.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.charcoal,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  serviceImage: {
    width: '100%',
    height: 160,
  },
  servicePlaceholder: {
    width: '100%',
    height: 160,
    backgroundColor: Colors.surfaceAlt,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderIcon: {
    fontSize: 48,
  },
  serviceInfo: {
    padding: Spacing.md,
  },
  serviceName: {
    fontFamily: Fonts.heading,
    fontSize: 18,
    color: Colors.charcoal,
    marginBottom: 4,
  },
  serviceDesc: {
    fontFamily: Fonts.body,
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
    marginBottom: 12,
  },
  serviceFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  durationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  durationText: {
    fontFamily: Fonts.body,
    fontSize: 12,
    color: Colors.textMuted,
  },
  priceTag: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  priceText: {
    fontFamily: Fonts.bodySemibold,
    fontSize: 13,
    color: Colors.primaryDark,
  },
  bookBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.primary,
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.md,
    paddingVertical: 12,
    borderRadius: Radius.sm,
  },
  bookBtnText: {
    fontFamily: Fonts.bodySemibold,
    fontSize: 14,
    color: Colors.white,
  },
  emptyBox: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    padding: Spacing.xl,
    alignItems: 'center',
    textAlign: 'center',
  },
  emptyIcon: {
    fontSize: 40,
    marginBottom: Spacing.sm,
  },
  emptyTitle: {
    fontFamily: Fonts.heading,
    fontSize: 18,
    color: Colors.charcoal,
    marginBottom: Spacing.xs,
  },
  emptySubtitle: {
    fontFamily: Fonts.body,
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
})
