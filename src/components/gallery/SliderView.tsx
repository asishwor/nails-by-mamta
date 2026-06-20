'use client'

import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { ImageIcon } from 'lucide-react'

interface GalleryImage {
  id: string
  url: string
  altText: string | null
}

export default function SliderView({ image }: { image: GalleryImage | undefined }) {
  if (!image) {
    return (
      <div className="relative w-full max-w-5xl mx-auto h-[60vh] sm:h-[70vh] rounded-[2rem] overflow-hidden bg-white/40 backdrop-blur-md border border-white/40 shadow-2xl shadow-primary/5 flex flex-col items-center justify-center text-foreground/50">
        <ImageIcon className="w-16 h-16 mb-4 opacity-20" />
        <p>No image found on this page.</p>
      </div>
    )
  }

  return (
    <div className="relative w-full max-w-5xl mx-auto h-[60vh] sm:h-[70vh] rounded-[2rem] overflow-hidden bg-white/40 backdrop-blur-md border border-white/40 shadow-2xl shadow-primary/5 group">
      <AnimatePresence mode="wait">
        <motion.div
          key={image.id}
          className="absolute inset-0"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.05 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        >
          <Image
            src={image.url}
            alt={image.altText || 'Gallery image'}
            fill
            className="object-cover"
            priority
          />
          
          {/* Alt text overlay */}
          {image.altText && (
            <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-8 pt-20">
              <p className="text-white font-heading text-2xl tracking-wide">
                {image.altText}
              </p>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
