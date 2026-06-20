'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { LayoutGrid, Maximize2 } from 'lucide-react'

interface GalleryControlsProps {
  currentView: 'grid' | 'slider'
}

export default function GalleryControls({ currentView }: GalleryControlsProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const handleViewChange = (view: 'grid' | 'slider') => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('view', view)
    params.delete('page')
    router.push(`/gallery?${params.toString()}`)
  }

  return (
    <div className="flex items-center justify-center gap-2 bg-white/50 backdrop-blur-md border border-white/40 p-1.5 rounded-2xl shadow-sm w-fit">
      <Button
        variant={currentView === 'grid' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => handleViewChange('grid')}
        className="flex items-center gap-2 rounded-xl px-4 py-2"
      >
        <LayoutGrid className="w-4 h-4" />
        <span className="hidden sm:inline font-medium">Grid View</span>
      </Button>
      <Button
        variant={currentView === 'slider' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => handleViewChange('slider')}
        className="flex items-center gap-2 rounded-xl px-4 py-2"
      >
        <Maximize2 className="w-4 h-4" />
        <span className="hidden sm:inline font-medium">Slider View</span>
      </Button>
    </div>
  )
}
