import Link from 'next/link'
import { Sparkles } from 'lucide-react'
import { prisma } from '@/utils/prisma'
import GalleryControls from '@/components/gallery/GalleryControls'
import GridView from '@/components/gallery/GridView'
import SliderView from '@/components/gallery/SliderView'

export const dynamic = 'force-dynamic'

interface SearchParams {
  page?: string
  view?: string
}

export default async function GalleryPage({
  searchParams
}: {
  searchParams: Promise<SearchParams>
}) {
  const { page, view } = await searchParams
  const currentPage = parseInt(page || '1', 10)
  const currentView = (view === 'grid' || view === 'slider') ? view : 'slider'

  // Slider fetches 1 per page, Grid fetches 12 per page
  const limit = currentView === 'slider' ? 1 : 12
  const skip = (currentPage - 1) * limit

  // Fetch from Prisma directly (Server Component)
  const [totalImages, images] = await Promise.all([
    prisma.galleryImage.count(),
    prisma.galleryImage.findMany({
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' }
    })
  ])

  const totalPages = Math.ceil(totalImages / limit)

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex flex-col">
      {/* Background elements */}
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-primary/10 rounded-full blur-[120px] -z-10" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[100px] -z-10" />

      {/* Header */}
      <nav className="flex items-center justify-between p-6 md:px-12 bg-white/50 backdrop-blur-xl border-b border-white/20 sticky top-0 z-50">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="bg-primary/10 p-2 rounded-xl group-hover:bg-primary/20 transition-colors">
            <Sparkles className="w-5 h-5 text-primary" />
          </div>
          <span className="font-heading text-2xl tracking-wide text-foreground">
            <span className="italic font-light">NailsBy</span>Mamta
          </span>
        </Link>
        <Link href="/" className="text-[12px] font-semibold text-foreground hover:text-primary transition-colors tracking-[0.15em] uppercase">
          Back to Home
        </Link>
      </nav>

      {/* Gallery Section */}
      <main className="flex-1 flex flex-col items-center py-20 px-4 sm:px-8 max-w-7xl mx-auto w-full">
        <div className="text-center mb-12">
          <p className="flex items-center justify-center gap-2 text-[12px] tracking-[0.2em] uppercase text-primary font-semibold mb-4">
            <Sparkles className="w-4 h-4" /> Portfolio
          </p>
          <h1 className="font-heading text-5xl md:text-6xl text-foreground">Our Gallery</h1>
          <p className="text-foreground/70 mt-4 max-w-lg mx-auto text-lg mb-8">
            A curated collection of our finest work. Scroll through to find inspiration for your next visit.
          </p>
          
          <div className="max-w-xl mx-auto">
            <GalleryControls 
              currentView={currentView} 
              currentPage={currentPage} 
              totalPages={totalPages} 
            />
          </div>
        </div>

        <div className="w-full mt-8">
          {currentView === 'grid' ? (
            <GridView images={images} />
          ) : (
            <SliderView image={images[0]} />
          )}
        </div>
      </main>
    </div>
  )
}
