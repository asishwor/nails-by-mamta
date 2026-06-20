import { Colors, Fonts, Radius, Spacing } from '@/constants/theme'
import { api } from '@/lib/api'
import { useAuthStore } from '@/store/useAuthStore'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { useState } from 'react'
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, Image } from 'react-native'

export default function RegisterScreen() {
  const router = useRouter()
  const setAuth = useAuthStore((s) => s.setAuth)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleRegister = async () => {
    if (!name || !email || !password) {
      Alert.alert('Missing fields', 'Please fill in all fields')
      return
    }
    if (password.length < 6) {
      Alert.alert('Weak password', 'Password must be at least 6 characters')
      return
    }
    setIsLoading(true)
    try {
      // Register via the existing web register endpoint
      await api.post('/api/auth/register', { name, email, password })
      // Then log in to get the JWT
      const { data } = await api.post('/api/mobile/auth/login', { email, password })
      await setAuth(data.user, data.token)
      router.replace('/(tabs)')
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.error || 'Registration failed')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()}>
          <Ionicons name="close" size={24} color={Colors.textSecondary} />
        </TouchableOpacity>

        <Image source={require('../../assets/logo.png')} style={styles.logo} />

        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.subtitle}>Join Nails by Mamta today</Text>

        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Full Name</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Your full name"
            placeholderTextColor={Colors.textMuted}
            autoCapitalize="words"
          />
        </View>

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
          />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Password</Text>
          <View style={styles.passwordRow}>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              value={password}
              onChangeText={setPassword}
              placeholder="Min. 6 characters"
              placeholderTextColor={Colors.textMuted}
              secureTextEntry={!showPwd}
            />
            <TouchableOpacity onPress={() => setShowPwd(!showPwd)} style={styles.eyeBtn}>
              <Ionicons name={showPwd ? 'eye-off-outline' : 'eye-outline'} size={20} color={Colors.textMuted} />
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity style={styles.submitBtn} onPress={handleRegister} disabled={isLoading}>
          {isLoading ? (
            <ActivityIndicator color={Colors.white} />
          ) : (
            <Text style={styles.submitText}>Create Account</Text>
          )}
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <TouchableOpacity onPress={() => router.replace('/(auth)/login')}>
            <Text style={styles.footerLink}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: Colors.background, padding: Spacing.lg, paddingTop: 60 },
  closeBtn: { position: 'absolute', top: 20, right: 20, padding: 8 },
  logo: { width: 80, height: 80, borderRadius: 40, marginBottom: Spacing.md, alignSelf: 'flex-start', backgroundColor: Colors.surfaceAlt, borderWidth: 1, borderColor: Colors.border },
  title: { fontFamily: Fonts.heading, fontSize: 34, color: Colors.charcoal, marginBottom: 8 },
  subtitle: { fontFamily: Fonts.body, fontSize: 15, color: Colors.textSecondary, marginBottom: Spacing.xl },
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
