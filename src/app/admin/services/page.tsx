'use client'

import { useState, useEffect } from 'react'
import { Plus, Edit, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

export default function ServicesPage() {
  const [services, setServices] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  
  const [formData, setFormData] = useState({
    name: '', description: '', price: 0, durationMinutes: 0, imageUrl: '', isActive: true
  })

  const fetchServices = async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/admin/services')
      const data = await res.json()
      if (data.services) setServices(data.services)
    } catch (err) {
      toast.error('Failed to load services')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchServices()
  }, [])

  const openAddModal = () => {
    setEditingId(null)
    setFormData({ name: '', description: '', price: 0, durationMinutes: 0, imageUrl: '', isActive: true })
    setIsModalOpen(true)
  }

  const openEditModal = (service: any) => {
    setEditingId(service.id)
    setFormData({
      name: service.name,
      description: service.description || '',
      price: service.price,
      durationMinutes: service.durationMinutes,
      imageUrl: service.imageUrl || '',
      isActive: service.isActive
    })
    setIsModalOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this service?')) return
    try {
      const res = await fetch(`/api/admin/services/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete')
      const data = await res.json()
      if (data.deactivated) {
        toast.info(data.message || 'Service was deactivated instead of deleted because of existing bookings.')
      } else {
        toast.success('Service deleted')
      }
      fetchServices()
    } catch (err) {
      toast.error('Error deleting service')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      const url = editingId ? `/api/admin/services/${editingId}` : '/api/admin/services'
      const method = editingId ? 'PUT' : 'POST'
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      
      if (!res.ok) throw new Error('Failed to save service')
      toast.success(editingId ? 'Service updated' : 'Service created')
      setIsModalOpen(false)
      fetchServices()
    } catch (err) {
      toast.error('Error saving service')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-light text-slate-800 dark:text-white">Services</h1>
          <p className="text-slate-500 mt-1">Manage your nail services and pricing.</p>
        </div>
        <Button onClick={openAddModal}>
          <Plus className="w-4 h-4 mr-2" />
          Add Service
        </Button>
      </div>

      <div className="bg-white dark:bg-zinc-900 border rounded-xl overflow-hidden shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Service Name</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={5} className="text-center py-8">Loading...</TableCell></TableRow>
            ) : services.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center py-8 text-slate-500">No services found.</TableCell></TableRow>
            ) : (
              services.map((service) => (
                <TableRow key={service.id}>
                  <TableCell className="font-medium">{service.name}</TableCell>
                  <TableCell>Rs. {service.price}</TableCell>
                  <TableCell>{service.durationMinutes} mins</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs ${service.isActive ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700'}`}>
                      {service.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => openEditModal(service)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => handleDelete(service.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Service' : 'Add Service'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Service Name</Label>
              <Input id="name" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="price">Price (Rs.)</Label>
                <Input type="number" id="price" required min="0" step="0.01" value={formData.price} onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="duration">Duration (mins)</Label>
                <Input type="number" id="duration" required min="1" value={formData.durationMinutes} onChange={(e) => setFormData({ ...formData, durationMinutes: parseInt(e.target.value) })} />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Input id="description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="imageUrl">Image URL (optional)</Label>
              <Input id="imageUrl" value={formData.imageUrl} onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })} placeholder="https://..." />
            </div>
            <div className="flex items-center gap-2 mt-2">
              <input type="checkbox" id="isActive" checked={formData.isActive} onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })} />
              <Label htmlFor="isActive">Active (visible to clients)</Label>
            </div>
            <DialogFooter className="mt-4">
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting}>Save Service</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
