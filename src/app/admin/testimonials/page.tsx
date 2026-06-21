'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

interface Testimonial {
  id: string
  contentEn: string
  contentNp: string | null
  authorName: string
  authorInitial: string
  isActive: boolean
  createdAt: string
}

export default function TestimonialsAdminPage() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingTestimonial, setEditingTestimonial] = useState<Testimonial | null>(null)

  const [formData, setFormData] = useState({
    contentEn: '',
    contentNp: '',
    authorName: '',
    authorInitial: '',
    isActive: true
  })

  useEffect(() => {
    fetchTestimonials()
  }, [])

  const fetchTestimonials = async () => {
    try {
      const res = await fetch('/api/admin/testimonials')
      const data = await res.json()
      if (data.testimonials) {
        setTestimonials(data.testimonials)
      }
    } catch (err) {
      toast.error('Failed to load testimonials')
    } finally {
      setIsLoading(false)
    }
  }

  const handleOpenDialog = (testimonial?: Testimonial) => {
    if (testimonial) {
      setEditingTestimonial(testimonial)
      setFormData({
        contentEn: testimonial.contentEn,
        contentNp: testimonial.contentNp || '',
        authorName: testimonial.authorName,
        authorInitial: testimonial.authorInitial,
        isActive: testimonial.isActive
      })
    } else {
      setEditingTestimonial(null)
      setFormData({
        contentEn: '',
        contentNp: '',
        authorName: '',
        authorInitial: '',
        isActive: true
      })
    }
    setIsDialogOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const url = editingTestimonial
        ? `/api/admin/testimonials/${editingTestimonial.id}`
        : '/api/admin/testimonials'

      const method = editingTestimonial ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (!res.ok) throw new Error('Failed to save')

      toast.success(editingTestimonial ? 'Testimonial updated' : 'Testimonial created')
      setIsDialogOpen(false)
      fetchTestimonials()
    } catch (err) {
      toast.error('Failed to save testimonial')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this testimonial?')) return

    try {
      const res = await fetch(`/api/admin/testimonials/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete')
      toast.success('Testimonial deleted')
      fetchTestimonials()
    } catch (err) {
      toast.error('Failed to delete testimonial')
    }
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Testimonials</h1>
          <p className="text-slate-500 mt-2">Manage customer reviews shown on the homepage.</p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger className="flex gap-2 py-2 px-5 font-bold items-center rounded-lg bg-rose-600 hover:bg-rose-700 text-white" onClick={() => handleOpenDialog()} >
            <Plus className="w-4 h-4" /> Add Testimonial
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>{editingTestimonial ? 'Edit Testimonial' : 'Add Testimonial'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Author Name</Label>
                  <Input
                    required
                    value={formData.authorName}
                    onChange={e => setFormData({ ...formData, authorName: e.target.value })}
                    placeholder="e.g. Sarah Jenkins"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Author Initial</Label>
                  <Input
                    required
                    maxLength={1}
                    value={formData.authorInitial}
                    onChange={e => setFormData({ ...formData, authorInitial: e.target.value })}
                    placeholder="e.g. S"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Content (English)</Label>
                <textarea
                  required
                  className="w-full min-h-[100px] flex rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  value={formData.contentEn}
                  onChange={e => setFormData({ ...formData, contentEn: e.target.value })}
                  placeholder="Review content in English..."
                />
              </div>

              <div className="space-y-2">
                <Label>Content (Nepali) - Optional</Label>
                <textarea
                  className="w-full min-h-[100px] flex rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  value={formData.contentNp}
                  onChange={e => setFormData({ ...formData, contentNp: e.target.value })}
                  placeholder="Review content in Nepali..."
                />
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={e => setFormData({ ...formData, isActive: e.target.checked })}
                  className="rounded border-slate-300 text-rose-600 focus:ring-rose-500"
                />
                <Label htmlFor="isActive">Active (Show on website)</Label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                <Button type="submit" className="bg-rose-600 hover:bg-rose-700">{editingTestimonial ? 'Update' : 'Save'}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Author</TableHead>
                <TableHead>Content (EN)</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-slate-500">Loading...</TableCell>
                </TableRow>
              ) : testimonials.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-slate-500">No testimonials found. Add your first one!</TableCell>
                </TableRow>
              ) : (
                testimonials.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell>
                      <div className="font-medium">{t.authorName}</div>
                      <div className="text-xs text-slate-500">Initial: {t.authorInitial}</div>
                    </TableCell>
                    <TableCell className="max-w-md">
                      <p className="truncate text-sm">{t.contentEn}</p>
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${t.isActive ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700'
                        }`}>
                        {t.isActive ? 'Active' : 'Hidden'}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(t)}>
                          <Pencil className="w-4 h-4 text-slate-500" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(t.id)}>
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
