import { useLanguageStore } from '@/store/useLanguageStore';
import { translations } from '@/lib/i18n';
import React, { useState } from 'react'
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native'
import { Colors, Fonts, Spacing, Radius } from '@/constants/theme'
import { useAuthStore } from '@/store/useAuthStore'
import { updateProfile } from '@/lib/api'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { Image } from 'expo-image'
import { SafeAreaView } from 'react-native-safe-area-context'

export default function ProfileScreen() {
  const { lang } = useLanguageStore()
  const t = translations[lang]
  const router = useRouter()
  const { user, setAuth, clearAuth, token } = useAuthStore()
  const [name, setName] = useState(user?.name || '')
  const [phone, setPhone] = useState(user?.phone || '')
  const [address, setAddress] = useState(user?.address || '')
  const [isSaving, setIsSaving] = useState(false)
  const [isEditing, setIsEditing] = useState(false)

  if (!user) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{t.profile}</Text>
        </View>
        <View style={styles.emptyState}>
          <Ionicons name="person-circle-outline" size={72} color={Colors.border} />
          <Text style={styles.emptyTitle}>You're not signed in</Text>
          <TouchableOpacity style={styles.loginBtn} onPress={() => router.push('/(auth)/login')}>
            <Text style={styles.loginBtnText}>{t.signIn}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
            <Text style={styles.registerLink}>Don't have an account? Register</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    )
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const updated = await updateProfile({ name, phone, address })
      await setAuth(updated, token!)
      setIsEditing(false)
      Alert.alert('Saved', '{t.profile} updated successfully')
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to update profile')
    } finally {
      setIsSaving(false)
    }
  }

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: () => clearAuth() },
    ])
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t.profile}</Text>
        <TouchableOpacity onPress={() => setIsEditing(!isEditing)}>
          <Text style={styles.editToggle}>{isEditing ? 'Cancel' : 'Edit'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* Avatar */}
        <View style={styles.avatarSection}>
          {user.image ? (
            <Image source={{ uri: user.image }} style={styles.avatar} contentFit="cover" />
          ) : (
            <View style={styles.avatarFallback}>
              <Text style={styles.avatarInitial}>{(user.name || user.email || 'U')[0].toUpperCase()}</Text>
            </View>
          )}
          <Text style={styles.displayName}>{user.name || 'Your Name'}</Text>
          <Text style={styles.displayEmail}>{user.email}</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Full Name</Text>
            <TextInput
              style={[styles.input, !isEditing && styles.inputDisabled]}
              value={name}
              onChangeText={setName}
              editable={isEditing}
              placeholder="Your name"
              placeholderTextColor={Colors.textMuted}
            />
          </View>
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Email</Text>
            <TextInput
              style={[styles.input, styles.inputDisabled]}
              value={user.email || ''}
              editable={false}
            />
          </View>
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Phone</Text>
            <TextInput
              style={[styles.input, !isEditing && styles.inputDisabled]}
              value={phone}
              onChangeText={setPhone}
              editable={isEditing}
              placeholder="+977 ..."
              placeholderTextColor={Colors.textMuted}
              keyboardType="phone-pad"
            />
          </View>
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Address</Text>
            <TextInput
              style={[styles.input, !isEditing && styles.inputDisabled]}
              value={address}
              onChangeText={setAddress}
              editable={isEditing}
              placeholder="Your address"
              placeholderTextColor={Colors.textMuted}
            />
          </View>

          {isEditing && (
            <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={isSaving}>
              {isSaving ? (
                <ActivityIndicator color={Colors.white} />
              ) : (
                <Text style={styles.saveBtnText}>Save Changes</Text>
              )}
            </TouchableOpacity>
          )}
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={18} color={Colors.error} />
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, paddingBottom: Spacing.lg, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { fontFamily: Fonts.heading, fontSize: 32, color: Colors.charcoal },
  editToggle: { fontFamily: Fonts.bodySemibold, fontSize: 15, color: Colors.primary },
  content: { paddingHorizontal: Spacing.lg, paddingBottom: 40 },

  avatarSection: { alignItems: 'center', marginBottom: Spacing.xl },
  avatar: { width: 90, height: 90, borderRadius: 45, marginBottom: 12 },
  avatarFallback: { width: 90, height: 90, borderRadius: 45, backgroundColor: Colors.primaryLight, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  avatarInitial: { fontFamily: Fonts.heading, fontSize: 36, color: Colors.primaryDark },
  displayName: { fontFamily: Fonts.heading, fontSize: 22, color: Colors.charcoal },
  displayEmail: { fontFamily: Fonts.body, fontSize: 13, color: Colors.textMuted, marginTop: 4 },

  form: { gap: 16 },
  fieldGroup: { gap: 6 },
  fieldLabel: { fontFamily: Fonts.bodySemibold, fontSize: 12, color: Colors.textMuted, letterSpacing: 0.8, textTransform: 'uppercase' },
  input: { backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md, paddingHorizontal: Spacing.md, paddingVertical: 12, fontFamily: Fonts.body, fontSize: 15, color: Colors.charcoal },
  inputDisabled: { backgroundColor: Colors.surfaceAlt, color: Colors.textSecondary },
  saveBtn: { backgroundColor: Colors.primary, borderRadius: Radius.lg, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
  saveBtnText: { fontFamily: Fonts.bodySemibold, fontSize: 15, color: Colors.white },

  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: Spacing.xl, padding: 14, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.error + '40' },
  logoutText: { fontFamily: Fonts.bodySemibold, fontSize: 15, color: Colors.error },

  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  emptyTitle: { fontFamily: Fonts.bodyMedium, fontSize: 16, color: Colors.textSecondary },
  loginBtn: { backgroundColor: Colors.primary, paddingHorizontal: 40, paddingVertical: 14, borderRadius: Radius.lg, marginTop: 8 },
  loginBtnText: { fontFamily: Fonts.bodySemibold, fontSize: 15, color: Colors.white },
  registerLink: { fontFamily: Fonts.body, fontSize: 13, color: Colors.primary },
})
