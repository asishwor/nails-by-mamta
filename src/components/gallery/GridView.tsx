import Image from 'next/image'

interface GalleryImage {
  id: string
  url: string
  altText: string | null
}

export default function GridView({ images }: { images: GalleryImage[] }) {
  if (images.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-foreground/50">
        <p>No images found on this page.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 w-full max-w-7xl mx-auto">
      {images.map(image => (
        <div key={image.id} className="group relative aspect-square bg-white/40 rounded-2xl overflow-hidden border border-white/40 shadow-sm hover:shadow-xl transition-all duration-300">
          <Image
            src={image.url}
            alt={image.altText || 'Gallery Image'}
            fill
            loading="lazy"
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
          {image.altText && (
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
              <p className="text-white text-sm font-medium truncate">
                {image.altText}
              </p>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
