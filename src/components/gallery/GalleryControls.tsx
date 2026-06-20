'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { LayoutGrid, Maximize2, ChevronLeft, ChevronRight } from 'lucide-react'

interface GalleryControlsProps {
  currentView: 'grid' | 'slider'
  currentPage: number
  totalPages: number
}

export default function GalleryControls({ currentView, currentPage, totalPages }: GalleryControlsProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const createQueryString = (name: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set(name, value)
    return params.toString()
  }

  const handleViewChange = (view: 'grid' | 'slider') => {
    // If switching to slider, we must reset page to 1 because slider shows 1 per page and grid shows 12 per page.
    const params = new URLSearchParams(searchParams.toString())
    params.set('view', view)
    params.set('page', '1')
    router.push(`/gallery?${params.toString()}`)
  }

  const handlePageChange = (newPage: number) => {
    router.push(`/gallery?${createQueryString('page', newPage.toString())}`)
  }

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 w-full bg-white/40 backdrop-blur-md border border-white/40 p-4 rounded-2xl shadow-sm">
      {/* View Toggles */}
      <div className="flex items-center gap-2 bg-white/50 p-1 rounded-lg">
        <Button
          variant={currentView === 'grid' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => handleViewChange('grid')}
          className="flex items-center gap-2 rounded-md"
        >
          <LayoutGrid className="w-4 h-4" />
          <span className="hidden sm:inline">Grid View</span>
        </Button>
        <Button
          variant={currentView === 'slider' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => handleViewChange('slider')}
          className="flex items-center gap-2 rounded-md"
        >
          <Maximize2 className="w-4 h-4" />
          <span className="hidden sm:inline">Slider View</span>
        </Button>
      </div>

      {/* Pagination Controls */}
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="icon"
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className="rounded-full bg-white/50 border-white/50 hover:bg-white"
        >
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <span className="text-sm font-medium text-slate-600">
          Page {currentPage} of {Math.max(1, totalPages)}
        </span>
        <Button
          variant="outline"
          size="icon"
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="rounded-full bg-white/50 border-white/50 hover:bg-white"
        >
          <ChevronRight className="w-5 h-5" />
        </Button>
      </div>
    </div>
  )
}
