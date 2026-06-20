import React, { useState, useEffect, useCallback } from 'react'
import { View, Text, StyleSheet, Dimensions, TouchableOpacity, Modal, StatusBar, ActivityIndicator } from 'react-native'
import { FlashList } from '@shopify/flash-list'
import { Image } from 'expo-image'
import { Colors, Fonts, Spacing, Radius } from '@/constants/theme'
import { fetchGallery } from '@/lib/api'
import { Ionicons } from '@expo/vector-icons'
import { SafeAreaView } from 'react-native-safe-area-context'

const { width } = Dimensions.get('window')
const ITEM_SIZE = (width - Spacing.lg * 2 - Spacing.sm) / 2  // 2-column grid

interface GalleryImage {
  id: string
  url: string
  altText: string | null
}

export default function GalleryScreen() {
  const [images, setImages] = useState<GalleryImage[]>([])
  const [cursor, setCursor] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(true)
  const [isLoading, setIsLoading] = useState(true)
  const [isFetchingMore, setIsFetchingMore] = useState(false)
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null)

  const load = useCallback(async (nextCursor?: string) => {
    try {
      const data = await fetchGallery(nextCursor)
      const newImages: GalleryImage[] = data.images || []
      if (nextCursor) {
        setImages((prev) => [...prev, ...newImages])
      } else {
        setImages(newImages)
      }
      setCursor(data.nextCursor || null)
      setHasMore(!!data.nextCursor)
    } catch (e) {
      console.error(e)
    } finally {
      setIsLoading(false)
      setIsFetchingMore(false)
    }
  }, [])

  useEffect(() => { load() }, [])

  const loadMore = () => {
    if (isFetchingMore || !hasMore || !cursor) return
    setIsFetchingMore(true)
    load(cursor)
  }

  const renderItem = ({ item }: { item: GalleryImage }) => (
    <TouchableOpacity onPress={() => setSelectedImage(item)} activeOpacity={0.9}>
      <Image
        source={{ uri: item.url }}
        style={styles.thumbnail}
        contentFit="cover"
        transition={300}
        placeholder={{ blurhash: 'L6Pj0^jE.AyE_3t7t7R**0o#DgR4' }}
      />
    </TouchableOpacity>
  )

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    )
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Gallery</Text>
        <Text style={styles.headerSubtitle}>Our latest work</Text>
      </View>

      <FlashList
        data={images}
        renderItem={renderItem}
        numColumns={2}
        contentContainerStyle={styles.grid}
        ItemSeparatorComponent={() => <View style={{ height: Spacing.sm }} />}
        onEndReached={loadMore}
        onEndReachedThreshold={0.3}
        ListFooterComponent={isFetchingMore ? <ActivityIndicator color={Colors.primary} style={{ padding: 16 }} /> : null}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No images yet</Text>
          </View>
        }
      />

      {/* Full-screen viewer */}
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
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background },

  header: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, paddingBottom: Spacing.lg },
  headerTitle: { fontFamily: Fonts.heading, fontSize: 32, color: Colors.charcoal },
  headerSubtitle: { fontFamily: Fonts.body, fontSize: 14, color: Colors.textMuted, marginTop: 2 },

  grid: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xl },
  thumbnail: { width: ITEM_SIZE, height: ITEM_SIZE * 1.25, borderRadius: Radius.lg, backgroundColor: Colors.surfaceAlt },

  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 80 },
  emptyText: { fontFamily: Fonts.body, fontSize: 15, color: Colors.textMuted },

  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', justifyContent: 'center', alignItems: 'center' },
  closeBtn: { position: 'absolute', top: 56, right: 20, zIndex: 10, padding: 8 },
  fullImage: { width, height: width * 1.3 },
})
