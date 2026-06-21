import { useLanguageStore } from '@/store/useLanguageStore';
import { translations } from '@/lib/i18n';


import { API_BASE, Colors, Fonts, Radius, Spacing } from '@/constants/theme'
import { chatWithAi, fetchChatHistory, fetchServices, Service } from '@/lib/api'
import { Language } from '@/lib/i18n'
import { useAuthStore } from '@/store/useAuthStore'
import { useBookingStore } from '@/store/useBookingStore'
import { Ionicons } from '@expo/vector-icons'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useRouter } from 'expo-router'
import { useEffect, useRef, useState } from 'react'
import { ActivityIndicator, Dimensions, Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

const { width } = Dimensions.get('window')

const PRESETS = [
  "What are you getting your nails done for?",
  "I need something elegant for a wedding.",
  "What styles are best for everyday office work?",
  "Recommend a bold party look."
]

type ChatMessage = {
  id: string
  role: 'user' | 'assistant'
  content: string
  suggestedServices?: Service[]
}

export default function AiChatScreen() {
  const router = useRouter()
  const { user } = useAuthStore()
  const setBookingService = useBookingStore((s) => s.setService)

  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [allServices, setAllServices] = useState<Service[]>([])
  const { lang } = useLanguageStore()
  const t = translations[lang]
  const scrollViewRef = useRef<ScrollView>(null)

  // Onboarding state
  const [isPersonalized, setIsPersonalized] = useState(false)
  const [onboardingStep, setOnboardingStep] = useState(1)
  const [formData, setFormData] = useState({
    name: user?.name || '',
    job: '',
    smallChildren: '',
    householdWork: '',
    typeOnComputer: '',
    sports: '',
    previousExperience: '',
    maintenanceFrequency: '',
    comfortVsFashion: '',
    naturalNailCondition: '',
    heavyHandUsage: '',
    workplaceRules: '',
    preferredStyle: ''
  })

  // Load chat history and services on mount
  useEffect(() => {
    const loadInit = async () => {
      try {
        // const l = await AsyncStorage.getItem('app_language')
        // if (l === 'ne' || l === 'en') setLang(l)

        const services = await fetchServices()
        setAllServices(services)

        const savedInfo = await AsyncStorage.getItem('ai_user_info')
        if (savedInfo) {
          const parsed = JSON.parse(savedInfo)
          if (parsed.job || parsed.name) {
            setIsPersonalized(true)
            setFormData(prev => ({ ...prev, ...parsed }))
          }
        }

        if (user) {
          const apiChat = await fetchChatHistory()
          if (apiChat && apiChat.messages && apiChat.messages.length > 0) {
            setMessages(apiChat.messages)
            if (apiChat.sessionId) {
              await AsyncStorage.setItem('ai_session_id', apiChat.sessionId)
            }
          }
        } else {
          const savedChat = await AsyncStorage.getItem(`chat_history_guest`)
          if (savedChat) {
            setMessages(JSON.parse(savedChat))
          }
        }
      } catch (e) {
        console.error('Failed to init chat', e)
      }
    }
    loadInit()
  }, [user])

  useEffect(() => {
    if (isPersonalized && messages.length === 0) {
      setMessages([
        {
          id: 'welcome',
          role: 'assistant',
          content: `Hi ${formData.name || ''}! I am the Personal Stylist 💅. How can I help you find the perfect nail style today?`
        }
      ])
    }
  }, [isPersonalized])

  // Save chat history on update
  useEffect(() => {
    if (messages.length > 0) {
      AsyncStorage.setItem(`chat_history_${user?.id || 'guest'}`, JSON.stringify(messages))
    }
  }, [messages, user])

  const appendMessage = async (text: string) => {
    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', content: text }
    const updatedMessages = [...messages, userMsg]
    setMessages(updatedMessages)
    setIsLoading(true)

    // Scroll to bottom
    setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100)

    try {
      const chatPayload = updatedMessages.map(m => ({ role: m.role, content: m.content }))
      const sessionId = await AsyncStorage.getItem('ai_session_id') || undefined
      const { reply, suggestedServiceIds, userInfo, sessionId: newSessionId } = await chatWithAi(chatPayload, sessionId, user?.id, isPersonalized ? formData : undefined)

      if (newSessionId) {
        await AsyncStorage.setItem('ai_session_id', newSessionId)
      }

      if (userInfo) {
        const saved = await AsyncStorage.getItem('ai_user_info')
        const current = saved ? JSON.parse(saved) : {}
        const merged = { ...current, ...userInfo }
        Object.keys(merged).forEach(k => {
          if (!merged[k]) delete merged[k]
        })
        await AsyncStorage.setItem('ai_user_info', JSON.stringify(merged))
      }

      const matchedServices = suggestedServiceIds
        .map((id: string) => allServices.find(s => s.id === id))
        .filter((s: Service | undefined): s is Service => !!s)

      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: reply,
        suggestedServices: matchedServices
      }])
    } catch (e) {
      console.error(e)
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I am having trouble connecting right now. Please try again.'
      }])
    } finally {
      setIsLoading(false)
      setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100)
    }
  }

  const handleStartChat = async () => {
    setIsPersonalized(true)
    const saved = await AsyncStorage.getItem('ai_user_info')
    const current = saved ? JSON.parse(saved) : {}
    await AsyncStorage.setItem('ai_user_info', JSON.stringify({ ...current, ...formData }))
  }

  const handleSend = () => {
    const activeQuery = input.trim()
    if (!activeQuery || isLoading) return
    setInput('')
    appendMessage(activeQuery)
  }

  const handleBook = (service: Service) => {
    if (!user) {
      router.push('/(auth)/login')
      return
    }
    setBookingService(service)
    router.push(`/booking/slots`)
  }

  const renderServiceCard = (service: Service) => (
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
          <Text style={styles.priceText}>Rs. {service.price}</Text>
          <View style={styles.bookBtnSmall}>
            <Text style={styles.bookBtnTextSmall}>Book</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  )

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTitleContainer}>
            <Ionicons name="sparkles" size={24} color={Colors.primary} />
            <Text style={styles.title}>AI Stylist</Text>
          </View>
          <TouchableOpacity onPress={() => setMessages([{ id: 'welcome', role: 'assistant', content: 'Chat cleared. How can I help?' }])}>
            <Text style={styles.clearBtn}>Clear Chat</Text>
          </TouchableOpacity>
        </View>

        {/* Main Content Area */}
        {!isPersonalized ? (
          <ScrollView contentContainerStyle={styles.onboardingContent}>
            <View style={styles.onboardingCard}>
              <Text style={styles.onboardingTitle}>{t.personalize}</Text>
              <Text style={styles.onboardingSub}>Step {onboardingStep}/3. {t.personalizeSub}</Text>

              {onboardingStep === 1 && (
                <>
                  <Text style={styles.label}>Your Name</Text>
                  <TextInput style={styles.onboardingInput} placeholder="Jane Doe" placeholderTextColor={Colors.textMuted} value={formData.name} onChangeText={(t) => setFormData(f => ({ ...f, name: t }))} />

                  <Text style={styles.label}>What is your job/profession?</Text>
                  <TextInput style={styles.onboardingInput} placeholder="Nurse, Student..." placeholderTextColor={Colors.textMuted} value={formData.job} onChangeText={(t) => setFormData(f => ({ ...f, job: t }))} />

                  <Text style={styles.label}>Do you have small children?</Text>
                  <View style={styles.chipGroup}>
                    {['Yes', 'No'].map(val => (
                      <TouchableOpacity key={val} style={[styles.chip, formData.smallChildren === val && styles.chipActive]} onPress={() => setFormData(f => ({ ...f, smallChildren: val }))}>
                        <Text style={[styles.chipText, formData.smallChildren === val && styles.chipTextActive]}>{val}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <Text style={styles.label}>Heavy household work?</Text>
                  <View style={styles.chipGroup}>
                    {['Yes', 'No'].map(val => (
                      <TouchableOpacity key={val} style={[styles.chip, formData.householdWork === val && styles.chipActive]} onPress={() => setFormData(f => ({ ...f, householdWork: val }))}>
                        <Text style={[styles.chipText, formData.householdWork === val && styles.chipTextActive]}>{val}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </>
              )}

              {onboardingStep === 2 && (
                <>
                  <Text style={styles.label}>Type on computer frequently?</Text>
                  <View style={styles.chipGroup}>
                    {['Yes', 'No'].map(val => (
                      <TouchableOpacity key={val} style={[styles.chip, formData.typeOnComputer === val && styles.chipActive]} onPress={() => setFormData(f => ({ ...f, typeOnComputer: val }))}>
                        <Text style={[styles.chipText, formData.typeOnComputer === val && styles.chipTextActive]}>{val}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <Text style={styles.label}>Play sports?</Text>
                  <View style={styles.chipGroup}>
                    {['Yes', 'No'].map(val => (
                      <TouchableOpacity key={val} style={[styles.chip, formData.sports === val && styles.chipActive]} onPress={() => setFormData(f => ({ ...f, sports: val }))}>
                        <Text style={[styles.chipText, formData.sports === val && styles.chipTextActive]}>{val}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <Text style={styles.label}>Heavy-handed? (Prone to breaking)</Text>
                  <View style={styles.chipGroup}>
                    {['Yes', 'No'].map(val => (
                      <TouchableOpacity key={val} style={[styles.chip, formData.heavyHandUsage === val && styles.chipActive]} onPress={() => setFormData(f => ({ ...f, heavyHandUsage: val }))}>
                        <Text style={[styles.chipText, formData.heavyHandUsage === val && styles.chipTextActive]}>{val}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <Text style={styles.label}>Condition of natural nails?</Text>
                  <View style={styles.chipGroup}>
                    {['Strong', 'Brittle', 'Damaged'].map(val => (
                      <TouchableOpacity key={val} style={[styles.chip, formData.naturalNailCondition === val && styles.chipActive]} onPress={() => setFormData(f => ({ ...f, naturalNailCondition: val }))}>
                        <Text style={[styles.chipText, formData.naturalNailCondition === val && styles.chipTextActive]}>{val}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </>
              )}

              {onboardingStep === 3 && (
                <>
                  <Text style={styles.label}>Comfort vs Fashion?</Text>
                  <View style={styles.chipGroup}>
                    {['Comfort', 'Fashion', 'Balanced'].map(val => (
                      <TouchableOpacity key={val} style={[styles.chip, formData.comfortVsFashion === val && styles.chipActive]} onPress={() => setFormData(f => ({ ...f, comfortVsFashion: val }))}>
                        <Text style={[styles.chipText, formData.comfortVsFashion === val && styles.chipTextActive]}>{val}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <Text style={styles.label}>Strict workplace rules?</Text>
                  <View style={styles.chipGroup}>
                    {['Yes', 'No Rules'].map(val => (
                      <TouchableOpacity key={val} style={[styles.chip, formData.workplaceRules === val && styles.chipActive]} onPress={() => setFormData(f => ({ ...f, workplaceRules: val }))}>
                        <Text style={[styles.chipText, formData.workplaceRules === val && styles.chipTextActive]}>{val}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <Text style={styles.label}>Maintenance Frequency?</Text>
                  <View style={styles.chipGroup}>
                    {['2 Weeks', 'Monthly', 'Rarely'].map(val => (
                      <TouchableOpacity key={val} style={[styles.chip, formData.maintenanceFrequency === val && styles.chipActive]} onPress={() => setFormData(f => ({ ...f, maintenanceFrequency: val }))}>
                        <Text style={[styles.chipText, formData.maintenanceFrequency === val && styles.chipTextActive]}>{val}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </>
              )}

              <View style={{ flexDirection: 'row', gap: 10, marginTop: 24 }}>
                {onboardingStep > 1 && (
                  <TouchableOpacity style={[styles.startChatBtn, { flex: 1, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.primary, borderRadius: 50, paddingVertical: 10, paddingHorizontal: 32, }]} onPress={() => setOnboardingStep(s => s - 1)}>
                    <Text style={[styles.startChatBtnText, { color: Colors.primary }]}>Back</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity style={[styles.startChatBtn, { flex: 2 }]} onPress={() => {
                  if (onboardingStep < 3) setOnboardingStep(s => s + 1)
                  else handleStartChat()
                }}>
                  <Text style={styles.startChatBtnText}>{onboardingStep < 3 ? 'Next' : t.startChat}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        ) : (
          <>
            {/* Chat Area */}
            <ScrollView
              ref={scrollViewRef}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              {messages.map((m) => (
                <View key={m.id} style={[
                  styles.messageBubble,
                  m.role === 'user' ? styles.messageUser : styles.messageAssistant
                ]}>
                  <Text style={[
                    styles.messageText,
                    m.role === 'user' ? styles.messageTextUser : styles.messageTextAssistant
                  ]}>{m.content}</Text>

                  {m.suggestedServices && m.suggestedServices.length > 0 && (
                    <View style={styles.suggestionsContainer}>
                      <Text style={styles.suggestionsTitle}>Suggested for you:</Text>
                      {m.suggestedServices.map(renderServiceCard)}
                    </View>
                  )}
                </View>
              ))}

              {isLoading && (
                <View style={[styles.messageBubble, styles.messageAssistant]}>
                  <ActivityIndicator size="small" color={Colors.primary} />
                </View>
              )}
            </ScrollView>

            {/* Presets - only show if very few messages */}
            {messages.length <= 2 && !isLoading && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.presetsScroll} contentContainerStyle={styles.presetsContent}>
                {PRESETS.map((p, i) => (
                  <TouchableOpacity key={i} style={styles.presetChip} onPress={() => appendMessage(p)}>
                    <Text style={styles.presetText}>{p}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}

            {/* Input Area */}
            <View style={styles.inputArea}>
              <TextInput
                style={styles.textInput}
                placeholder="Ask for style advice..."
                placeholderTextColor={Colors.textMuted}
                value={input}
                onChangeText={setInput}
                multiline
                maxLength={200}
              />
              <TouchableOpacity
                style={[styles.sendBtn, (!input.trim() || isLoading) && styles.sendBtnDisabled]}
                onPress={handleSend}
                disabled={!input.trim() || isLoading}
              >
                <Ionicons name="send" size={18} color={Colors.white} />
              </TouchableOpacity>
            </View>
          </>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  title: {
    fontFamily: Fonts.heading,
    fontSize: 24,
  },
  clearBtn: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 14,
    color: Colors.textMuted,
  },
  scrollContent: {
    padding: Spacing.xl,
    paddingBottom: Spacing.xxl,
  },
  messageBubble: {
    maxWidth: '85%',
    padding: Spacing.md,
    borderRadius: Radius.lg,
    marginBottom: Spacing.md,
  },
  messageUser: {
    alignSelf: 'flex-end',
    backgroundColor: Colors.primary,
    borderTopRightRadius: 4,
  },
  messageAssistant: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.white,
    borderTopLeftRadius: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  messageText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 15,
  },
  messageTextUser: {
    color: Colors.white,
  },
  messageTextAssistant: {
  },
  suggestionsContainer: {
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  suggestionsTitle: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 13,
    color: Colors.textMuted,
    marginBottom: Spacing.sm,
  },
  serviceCard: {
    flexDirection: 'row',
    backgroundColor: Colors.background,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    marginBottom: Spacing.sm,
    width: width * 0.65,
  },
  serviceImage: {
    width: 70,
    height: '100%',
    backgroundColor: Colors.surface,
  },
  servicePlaceholder: {
    width: 70,
    height: '100%',
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderIcon: {
    fontSize: 24,
  },
  serviceInfo: {
    flex: 1,
    padding: Spacing.sm,
  },
  serviceName: {
    fontFamily: Fonts.bodySemibold,
    fontSize: 14,
    marginBottom: 2,
  },
  serviceDesc: {
    fontFamily: Fonts.body,
    fontSize: 12,
    marginBottom: Spacing.sm,
  },
  serviceFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 13,
    color: Colors.primary,
  },
  bookBtnSmall: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  bookBtnTextSmall: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 11,
    color: Colors.white,
  },
  presetsScroll: {
    maxHeight: 60,
  },
  presetsContent: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  presetChip: {
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  presetText: {
    fontFamily: Fonts.body,
    fontSize: 13,
    color: Colors.black,
  },
  inputArea: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingBottom: Platform.OS === 'ios' ? Spacing.xl : Spacing.md,
  },
  textInput: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Platform.OS === 'ios' ? 12 : 8,
    fontFamily: Fonts.body,
    fontSize: 15,
    maxHeight: 100,
  },
  sendBtn: {
    backgroundColor: Colors.primary,
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: Spacing.md,
  },
  sendBtnDisabled: {
    backgroundColor: Colors.border,
  },
  onboardingContent: {
    padding: Spacing.xl,
  },
  onboardingCard: {
    backgroundColor: Colors.white,
    padding: Spacing.xl,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  onboardingTitle: {
    fontFamily: Fonts.heading,
    fontSize: 20,
    marginBottom: 4,
  },
  onboardingSub: {
    fontSize: 14,
    color: Colors.textMuted,
    marginBottom: Spacing.xl,
  },
  label: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 13,
    marginBottom: Spacing.sm,
    marginTop: Spacing.md,
  },
  onboardingInput: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    fontSize: 15,
  },
  chipGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  chip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  chipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  chipText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 13,
  },
  chipTextActive: {
    color: Colors.white,
  },
  startChatBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: Radius.full,
    alignItems: 'center',
    marginTop: Spacing.xl,
  },
  startChatBtnText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 16,
    color: Colors.white,
  },
})
