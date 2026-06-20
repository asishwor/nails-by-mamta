'use client'

import { useState } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { ImageIcon, ChevronLeft, ChevronRight } from 'lucide-react'

interface GalleryImage {
  id: string
  url: string
  altText: string | null
}

export default function SliderView({ images }: { images: GalleryImage[] }) {
  const [currentIndex, setCurrentIndex] = useState(0)

  if (!images || images.length === 0) {
    return (
      <div className="relative w-full max-w-5xl mx-auto h-[60vh] sm:h-[70vh] rounded-[2rem] overflow-hidden bg-white/40 backdrop-blur-md border border-white/40 shadow-2xl shadow-primary/5 flex flex-col items-center justify-center text-foreground/50">
        <ImageIcon className="w-16 h-16 mb-4 opacity-20" />
        <p>No images found.</p>
      </div>
    )
  }

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length)
  }

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length)
  }

  const image = images[currentIndex]

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
            priority={currentIndex === 0}
            loading={currentIndex === 0 ? "eager" : "lazy"}
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

      {/* Side Navigation */}
      {images.length > 1 && (
        <>
          <button
            onClick={handlePrev}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/50 hover:bg-white backdrop-blur-md rounded-full flex items-center justify-center shadow-lg transition-all"
          >
            <ChevronLeft className="w-6 h-6 text-foreground" />
          </button>
          <button
            onClick={handleNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/50 hover:bg-white backdrop-blur-md rounded-full flex items-center justify-center shadow-lg transition-all"
          >
            <ChevronRight className="w-6 h-6 text-foreground" />
          </button>
        </>
      )}
    </div>
  )
}
