import { GoogleIcon } from '@/constants/icons'
import { Colors, Fonts, Radius, Spacing } from '@/constants/theme'
import { fetchSettings, loginWithCredentials, loginWithGoogle } from '@/lib/api'
import { useAuthStore } from '@/store/useAuthStore'
import { Ionicons } from '@expo/vector-icons'
import * as Google from 'expo-auth-session/providers/google'
import Constants from 'expo-constants'
import { useRouter } from 'expo-router'
import * as WebBrowser from 'expo-web-browser'
import { useEffect, useState } from 'react'
import { ActivityIndicator, Alert, Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'

WebBrowser.maybeCompleteAuthSession()

const FALLBACK_CLIENT_ID = Constants.expoConfig?.extra?.googleClientId || ''

interface LoginFormContentProps {
  googleIds: {
    web: string
    ios: string
    android: string
  }
}

function LoginFormContent({ googleIds }: LoginFormContentProps) {
  const router = useRouter()
  const setAuth = useAuthStore((s) => s.setAuth)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showPwd, setShowPwd] = useState(false)

  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId: googleIds.web || undefined,
    iosClientId: googleIds.ios || undefined,
    androidClientId: googleIds.android || undefined,
  })

  useEffect(() => {
    if (response?.type === 'success') {
      const idToken = response.authentication?.idToken
      if (idToken) handleGoogleToken(idToken)
    }
  }, [response])

  const handleGoogleToken = async (idToken: string) => {
    setIsLoading(true)
    try {
      const data = await loginWithGoogle(idToken)
      await setAuth(data.user, data.token)
      router.replace('/(tabs)')
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.error || 'Google sign-in failed')
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Missing fields', 'Please enter email and password')
      return
    }
    setIsLoading(true)
    try {
      const data = await loginWithCredentials(email, password)
      await setAuth(data.user, data.token)
      router.replace('/(tabs)')
    } catch (e: any) {
      Alert.alert('Sign In Failed', e?.response?.data?.error || 'Invalid credentials')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        {/* Close button */}
        <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()}>
          <Ionicons name="close" size={24} color={Colors.textSecondary} />
        </TouchableOpacity>

        <Image source={require('../../assets/logo.png')} style={styles.logo} />

        <Text style={styles.title}>Welcome Back</Text>
        <Text style={styles.subtitle}>Sign in to book your next session</Text>

        {/* Google */}
        <TouchableOpacity
          style={styles.googleBtn}
          onPress={() => promptAsync()}
          disabled={isLoading || !request}
        >
          <GoogleIcon />
          <Text style={styles.googleText}>Continue with Google</Text>
        </TouchableOpacity>

        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Email */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Email</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="name@example.com"
            placeholderTextColor={Colors.textMuted}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
          />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Password</Text>
          <View style={styles.passwordRow}>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              placeholderTextColor={Colors.textMuted}
              secureTextEntry={!showPwd}
            />
            <TouchableOpacity onPress={() => setShowPwd(!showPwd)} style={styles.eyeBtn}>
              <Ionicons name={showPwd ? 'eye-off-outline' : 'eye-outline'} size={20} color={Colors.textMuted} />
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity style={styles.submitBtn} onPress={handleLogin} disabled={isLoading}>
          {isLoading ? (
            <ActivityIndicator color={Colors.white} />
          ) : (
            <Text style={styles.submitText}>Sign In</Text>
          )}
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Don't have an account? </Text>
          <TouchableOpacity onPress={() => router.replace('/(auth)/register')}>
            <Text style={styles.footerLink}>Register</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

export default function LoginScreen() {
  const [googleIds, setGoogleIds] = useState<{
    web: string
    ios: string
    android: string
  } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSettings()
      .then((stg) => {
        if (stg) {
          setGoogleIds({
            web: stg.googleClientId || FALLBACK_CLIENT_ID,
            ios: stg.googleIosClientId || FALLBACK_CLIENT_ID,
            android: stg.googleAndroidClientId || FALLBACK_CLIENT_ID,
          })
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading || !googleIds) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    )
  }

  return <LoginFormContent googleIds={googleIds} />
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: Colors.background, padding: Spacing.lg, paddingTop: 60 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background },
  closeBtn: { position: 'absolute', top: 20, right: 20, padding: 8 },
  logo: { width: 80, height: 80, borderRadius: 40, marginBottom: Spacing.md, alignSelf: 'flex-start', backgroundColor: Colors.surfaceAlt, borderWidth: 1, borderColor: Colors.border },
  title: { fontFamily: Fonts.heading, fontSize: 34, color: Colors.charcoal, marginBottom: 8 },
  subtitle: { fontFamily: Fonts.body, fontSize: 15, color: Colors.textSecondary, marginBottom: Spacing.xl },
  googleBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: Colors.surface, borderWidth: 1.5, borderColor: Colors.border,
    borderRadius: Radius.lg, paddingVertical: 14, marginBottom: Spacing.lg,
  },
  googleIcon: { fontFamily: Fonts.heading, fontSize: 18, color: '#4285F4' },
  googleText: { fontFamily: Fonts.bodyMedium, fontSize: 15, color: Colors.charcoal },
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: Spacing.lg },
  dividerLine: { flex: 1, height: 1, backgroundColor: Colors.border },
  dividerText: { fontFamily: Fonts.body, fontSize: 13, color: Colors.textMuted },
  fieldGroup: { marginBottom: Spacing.md },
  fieldLabel: { fontFamily: Fonts.bodySemibold, fontSize: 12, color: Colors.textMuted, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 6 },
  input: { backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md, paddingHorizontal: Spacing.md, paddingVertical: 14, fontFamily: Fonts.body, fontSize: 15, color: Colors.charcoal },
  passwordRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  eyeBtn: { padding: 12, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md },
  submitBtn: { backgroundColor: Colors.primary, borderRadius: Radius.lg, paddingVertical: 15, alignItems: 'center', marginTop: 8, marginBottom: Spacing.lg },
  submitText: { fontFamily: Fonts.bodySemibold, fontSize: 16, color: Colors.white },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 8 },
  footerText: { fontFamily: Fonts.body, fontSize: 14, color: Colors.textMuted },
  footerLink: { fontFamily: Fonts.bodySemibold, fontSize: 14, color: Colors.primary },
})
