'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Trash2, Upload, Loader2, Image as ImageIcon } from 'lucide-react'
import { toast } from 'sonner'
import Image from 'next/image'

interface GalleryImage {
  id: string
  url: string
  altText: string | null
  createdAt: string
}

export default function AdminGalleryPage() {
  const [images, setImages] = useState<GalleryImage[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isUploading, setIsUploading] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [altText, setAltText] = useState('')

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    fetchImages()
  }, [])

  const fetchImages = async () => {
    try {
      const res = await fetch('/api/admin/gallery')
      if (!res.ok) throw new Error('Failed to fetch images')
      const data = await res.json()
      setImages(data.images)
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) return

    setIsUploading(true)
    try {
      // 1. Upload to Supabase Storage
      const fileExt = file.name.split('.').pop()
      const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('gallery')
        .upload(fileName, file)

      if (uploadError) throw new Error(uploadError.message)

      // 2. Get Public URL
      const { data: { publicUrl } } = supabase.storage
        .from('gallery')
        .getPublicUrl(fileName)

      // 3. Save to Database
      const res = await fetch('/api/admin/gallery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: publicUrl, altText })
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to save to database')
      }

      toast.success('Image uploaded successfully')
      setFile(null)
      setAltText('')
      
      // Reset file input
      const fileInput = document.getElementById('image') as HTMLInputElement
      if (fileInput) fileInput.value = ''

      fetchImages()
    } catch (error: any) {
      toast.error(error.message || 'Error uploading image')
    } finally {
      setIsUploading(false)
    }
  }

  const handleDelete = async (id: string, url: string) => {
    if (!confirm('Are you sure you want to delete this image?')) return

    try {
      // 1. Delete from DB
      const res = await fetch(`/api/admin/gallery?id=${id}`, {
        method: 'DELETE'
      })

      if (!res.ok) throw new Error('Failed to delete from database')

      // 2. Delete from Supabase Storage
      const fileName = url.split('/').pop()
      if (fileName) {
        await supabase.storage.from('gallery').remove([fileName])
      }

      toast.success('Image deleted')
      setImages(images.filter(img => img.id !== id))
    } catch (error: any) {
      toast.error(error.message)
    }
  }

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-light text-slate-800 dark:text-white">Gallery Management</h1>
        <p className="text-slate-500 mt-1">Upload and manage images for the public gallery.</p>
      </div>

      <div className="bg-white dark:bg-zinc-900 border rounded-xl p-6 shadow-sm">
        <h2 className="text-xl font-medium mb-4 flex items-center gap-2">
          <Upload className="w-5 h-5 text-primary" /> Upload New Image
        </h2>
        <form onSubmit={handleUpload} className="space-y-4 max-w-xl">
          <div className="space-y-2">
            <Label htmlFor="image">Select Image</Label>
            <Input 
              id="image" 
              type="file" 
              accept="image/*"
              onChange={e => setFile(e.target.files?.[0] || null)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="altText">Description / Alt Text (Optional)</Label>
            <Input 
              id="altText" 
              placeholder="e.g. French Manicure"
              value={altText}
              onChange={e => setAltText(e.target.value)}
            />
          </div>
          <Button type="submit" disabled={isUploading || !file} className="w-full sm:w-auto">
            {isUploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <ImageIcon className="w-4 h-4 mr-2" />}
            Upload to Gallery
          </Button>
        </form>
      </div>

      <div>
        <h2 className="text-2xl font-light text-slate-800 dark:text-white mb-6">Existing Images</h2>
        
        {isLoading ? (
          <div className="flex items-center justify-center p-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : images.length === 0 ? (
          <div className="text-center p-12 bg-white dark:bg-zinc-900 border rounded-xl shadow-sm text-slate-500">
            No images in the gallery yet. Upload one above!
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {images.map(image => (
              <div key={image.id} className="group relative bg-white dark:bg-zinc-900 rounded-xl overflow-hidden border shadow-sm hover:shadow-md transition-all">
                <div className="aspect-square relative">
                  <Image 
                    src={image.url} 
                    alt={image.altText || 'Gallery Image'} 
                    fill 
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Button 
                      variant="destructive" 
                      size="icon" 
                      onClick={() => handleDelete(image.id, image.url)}
                      className="w-10 h-10 rounded-full shadow-lg"
                    >
                      <Trash2 className="w-5 h-5" />
                    </Button>
                  </div>
                </div>
                {image.altText && (
                  <div className="p-3 text-sm text-slate-600 dark:text-slate-300 truncate">
                    {image.altText}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
