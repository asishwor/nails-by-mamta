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
      )}
    </div>
  )
}
