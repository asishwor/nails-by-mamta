'use client'

import { BookingModal } from '@/components/booking/BookingModal'
import { Logo } from '@/components/Logo'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { motion, Variants } from 'framer-motion'
import { Clock, MapPin, Menu, Phone, ShieldCheck, Sparkles, X } from 'lucide-react'
import { signOut, useSession } from 'next-auth/react'
import Link from 'next/link'
import { JSX, useEffect, useState } from 'react'
import { toast } from 'sonner'

interface Service {
  id: string
  name: string
  description: string | null
  price: number
  durationMinutes: number
  imageUrl: string | null
}

const SWATCHES = ['#A8201A', '#C9A66B', '#5B6B57', '#16110F']

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.12 } }
}

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } }
}

export default function Home() {
  const { data: session } = useSession()
  const [services, setServices] = useState<Service[]>([])
  const [settings, setSettings] = useState<any>(null)
  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const [searchQuery, setSearchQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [recommendedIds, setRecommendedIds] = useState<string[] | null>(null)

  const [galleryImages, setGalleryImages] = useState<any[]>([])

  useEffect(() => {
    async function fetchData() {
      try {
        const [servicesRes, settingsRes, galleryRes] = await Promise.all([
          fetch('/api/services'),
          fetch('/api/settings'),
          fetch('/api/gallery?limit=4')
        ])

        const servicesData = await servicesRes.json()
        const settingsData = await settingsRes.json()
        const galleryData = await galleryRes.json()

        if (servicesData.services) setServices(servicesData.services)
        if (settingsData.settings) setSettings(settingsData.settings)
        if (galleryData.images) setGalleryImages(galleryData.images)
      } catch (err) {
        console.error('Failed to load data')
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [])

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchQuery.trim()) {
      setRecommendedIds(null)
      return
    }
    setIsSearching(true)
    try {
      const res = await fetch('/api/services/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchQuery })
      })
      const data = await res.json()
      if (data.recommendedIds) {
        setRecommendedIds(data.recommendedIds)
        if (data.recommendedIds.length > 0) {
          toast.success(`Found ${data.recommendedIds.length} perfect matches for you!`)
        } else {
          toast.info("We couldn't find a perfect match, but take a look at all our services!")
        }
      }
    } catch (err) {
      toast.error('Search failed. Please try again.')
    } finally {
      setIsSearching(false)
    }
  }

  const clearSearch = () => {
    setSearchQuery('')
    setRecommendedIds(null)
  }

  const formatTimeStr = (timeStr: string) => {
    if (!timeStr) return ''
    const [h, m] = timeStr.split(':')
    const date = new Date()
    date.setHours(parseInt(h), parseInt(m), 0)
    return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
  }

  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

  const handleBookNow = (service: Service) => {
    setSelectedService(service)
    setIsModalOpen(true)
  }

  const displayedServices = recommendedIds
    ? services.filter(s => recommendedIds.includes(s.id))
    : services;

  return (
    <main className="min-h-screen bg-[#FAF5EE] font-sans text-[#16110F]">
      <motion.nav
        initial={{ y: -40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="fixed top-6 left-1/2 -translate-x-1/2 w-[calc(100%-3rem)] max-w-5xl z-50 flex items-center justify-between px-6 bg-background/80 backdrop-blur-md border border-primary/20 rounded-full shadow-lg shadow-primary/5"
      >
        <Logo height={90} width={90} />

        <div className="hidden md:flex items-center gap-8 bg-primary/5 px-6 py-2 rounded-full border border-primary/10">
          <button
            onClick={() => document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' })}
            className="text-[12px] font-semibold text-foreground/80 hover:text-primary transition-colors tracking-[0.15em] uppercase relative group"
          >
            Services
            <span className="absolute -bottom-1 left-0 w-0 h-[2px] bg-primary transition-all group-hover:w-full"></span>
          </button>
          <button
            onClick={() => document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' })}
            className="text-[12px] font-semibold text-foreground/80 hover:text-primary transition-colors tracking-[0.15em] uppercase relative group"
          >
            About
          </button>
          <Link
            href="/gallery"
            className="text-[12px] font-semibold text-foreground/80 hover:text-primary transition-colors tracking-[0.15em] uppercase relative group"
          >
            Gallery
            <span className="absolute -bottom-1 left-0 w-0 h-[2px] bg-primary transition-all group-hover:w-full"></span>
          </Link>
        </div>

        <div className="hidden md:flex items-center gap-3">
          {session ? (
            <>
              <Link href={(session.user as any)?.role === 'ADMIN' ? '/admin' : '/dashboard'}>
                <Button variant="ghost" className="rounded-full text-[12px] tracking-[0.1em] uppercase text-foreground hover:bg-primary/10">
                  Dashboard
                </Button>
              </Link>
              <Button
                onClick={() => signOut()}
                className="rounded-full px-6 h-10 text-[12px] tracking-[0.1em] uppercase bg-primary hover:bg-primary/90 text-primary-foreground transition-all shadow-md hover:shadow-lg"
              >
                Log Out
              </Button>
            </>
          ) : (
            <Link href="/login">
              <Button className="rounded-full px-6 h-10 text-[12px] tracking-[0.1em] uppercase bg-primary hover:bg-primary/90 text-primary-foreground transition-all shadow-md hover:shadow-lg">
                Sign In
              </Button>
            </Link>
          )}
        </div>

        {/* Mobile Menu Toggle */}
        <button
          className="md:hidden p-2 text-foreground"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </motion.nav>

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
        <div className="fixed top-[88px] left-1/2 -translate-x-1/2 w-[calc(100%-3rem)] max-w-sm bg-white/95 backdrop-blur-xl border border-primary/20 rounded-3xl p-6 shadow-2xl z-40 flex flex-col gap-6 md:hidden">
          <button
            onClick={() => {
              setIsMobileMenuOpen(false)
              document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' })
            }}
            className="text-[14px] font-semibold text-foreground hover:text-primary transition-colors tracking-[0.15em] uppercase text-left"
          >
            Services
          </button>
          <button
            onClick={() => {
              setIsMobileMenuOpen(false)
              document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' })
            }}
            className="text-[14px] font-semibold text-foreground hover:text-primary transition-colors tracking-[0.15em] uppercase text-left"
          >
            About
          </button>
          <Link
            href="/gallery"
            onClick={() => setIsMobileMenuOpen(false)}
            className="text-[14px] font-semibold text-foreground hover:text-primary transition-colors tracking-[0.15em] uppercase text-left"
          >
            Gallery
          </Link>

          <div className="h-px w-full bg-primary/10"></div>

          <div className="flex flex-col gap-3">
            {session ? (
              <>
                <Link href={(session.user as any)?.role === 'ADMIN' ? '/admin' : '/dashboard'} onClick={() => setIsMobileMenuOpen(false)}>
                  <Button variant="outline" className="w-full rounded-full text-[12px] tracking-[0.1em] uppercase border-primary/20 hover:bg-primary/5">
                    Dashboard
                  </Button>
                </Link>
                <Button
                  onClick={() => {
                    setIsMobileMenuOpen(false)
                    signOut()
                  }}
                  className="w-full rounded-full text-[12px] tracking-[0.1em] uppercase bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  Log Out
                </Button>
              </>
            ) : (
              <Link href="/login" onClick={() => setIsMobileMenuOpen(false)}>
                <Button className="w-full rounded-full text-[12px] tracking-[0.1em] uppercase bg-primary hover:bg-primary/90 text-primary-foreground">
                  Sign In
                </Button>
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-24 px-6 md:px-12 overflow-hidden bg-background">
        {/* Soft abstract background shapes */}
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-primary/10 rounded-full blur-[100px] -z-10 translate-x-1/3 -translate-y-1/3 opacity-70" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[80px] -z-10 -translate-x-1/4 translate-y-1/4 opacity-60" />

        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-12 items-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
            className="pt-10"
          >
            <p className="flex items-center gap-2 text-[12px] tracking-[0.2em] uppercase text-primary font-semibold mb-4">
              <Sparkles className="w-4 h-4" />
              Express Your Style
            </p>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-sans font-bold leading-[1.1] mb-6 text-foreground">
              Nail Art,
              <br />
              <span className="font-heading italic text-primary font-normal flex items-center gap-3 mt-2">
                Designed for You
                <span className="text-4xl text-primary/80">♡</span>
              </span>
            </h1>
            <p className="text-lg text-foreground/70 max-w-md mb-10 leading-relaxed">
              Trendy nail designs, unique nail arts and expert services – all available online, just for you.
            </p>

            {/* Features Row */}
            <div className="grid grid-cols-4 gap-4 mb-10 text-center max-w-lg">
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-2 text-primary">
                  <span className="text-xl">💅</span>
                </div>
                <span className="text-[11px] font-medium leading-tight text-foreground">Trendy<br />Designs</span>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-2 text-primary">
                  <span className="text-xl">🎨</span>
                </div>
                <span className="text-[11px] font-medium leading-tight text-foreground">Custom<br />Nail Art</span>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-2 text-primary">
                  <span className="text-xl">💻</span>
                </div>
                <span className="text-[11px] font-medium leading-tight text-foreground">Online<br />Consultation</span>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-2 text-primary">
                  <span className="text-xl">🚚</span>
                </div>
                <span className="text-[11px] font-medium leading-tight text-foreground">Inspiration<br />Delivered</span>
              </div>
            </div>

            <div className="flex items-center gap-6 mb-12 flex-wrap">
              <Button
                size="lg"
                className="rounded-full px-8 h-12 text-[12px] tracking-[0.1em] uppercase bg-primary hover:bg-primary/90 text-primary-foreground transition-colors shadow-md border-none"
                onClick={() => document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' })}
              >
                Explore Designs &rarr;
              </Button>
              <div className="font-heading italic text-primary/80 text-xl flex items-center gap-2">
                Beautiful Nails, <br /> Endless Possibilities <Sparkles className="w-5 h-5 opacity-70" />
              </div>
            </div>

            {/* Thumbnails */}
            <div className="flex gap-3">
              {[
                '/thumb1.png',
                '/thumb2.png',
                '/thumb3.png',
                '/thumb4.png'
              ].map((src, i) => (
                <div key={i} className="w-16 h-16 md:w-20 md:h-20 rounded-xl overflow-hidden border-2 border-white shadow-sm hover:scale-105 transition-transform cursor-pointer">
                  <img
                    src={src}
                    alt={`Thumbnail ${i + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.15, ease: 'easeOut' }}
            className="relative"
          >
            {/* Main right image, softly rounded edges matching the organic feel */}
            <div className="relative w-full md:aspect-square rounded-[40px] overflow-hidden shadow-2xl border-4 border-white">
              <img
                src="/hero.png"
                alt="Luxury Nail Artistry"
                className="w-full h-full object-cover object-left"
              />
            </div>

            {/* Floating circular badge */}
            <div className="absolute -bottom-8 -left-8 md:bottom-12 md:-left-12 w-28 h-28 bg-primary rounded-full flex items-center justify-center text-primary-foreground shadow-xl group hidden sm:flex border-4 border-white">
              <div className="relative w-full h-full rounded-full flex items-center justify-center">
                <svg className="w-full h-full absolute inset-0 animate-spin-slow" viewBox="0 0 100 100" style={{ animationDuration: '15s' }}>
                  <path id="curve" fill="transparent" d="M 50,50 m -35,0 a 35,35 0 1,1 70,0 a 35,35 0 1,1 -70,0" />
                  <text className="text-[9px] tracking-[0.25em] fill-[currentColor] font-bold uppercase">
                    <textPath href="#curve" startOffset="0%">
                      YOUR STYLE • OUR PASSION • YOUR STYLE • OUR PASSION •
                    </textPath>
                  </text>
                </svg>
                <span className="text-2xl mt-1">♡</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Services Grid */}
      <section id="services" className="relative px-6 md:px-12 py-32 bg-background border-t border-primary/10 overflow-hidden">
        {/* Soft abstract background shapes for services */}
        <div className="absolute top-40 -left-40 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[100px] -z-10 opacity-70" />
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-16 border-b border-primary/10 pb-8">
            <div>
              <p className="flex items-center gap-2 text-[12px] tracking-[0.2em] uppercase text-primary font-semibold mb-4">
                <Sparkles className="w-4 h-4" /> The Menu
              </p>
              <h2 className="font-heading text-4xl md:text-5xl lg:text-6xl text-foreground">Signature Services</h2>
            </div>

            {/* AI Semantic Search */}
            <div className="w-full lg:w-96 bg-white/50 backdrop-blur-md border border-primary/20 p-2 rounded-2xl shadow-sm">
              <form onSubmit={handleSearch} className="flex gap-2">
                <Input
                  type="text"
                  placeholder="E.g. I want shiny, long nails for a party..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="border-none bg-transparent shadow-none focus-visible:ring-0 text-sm"
                />
                {recommendedIds && (
                  <Button type="button" variant="ghost" onClick={clearSearch} className="px-3 hover:bg-rose-100 text-rose-500 rounded-xl">
                    Clear
                  </Button>
                )}
                <Button type="submit" disabled={isSearching || !searchQuery.trim()} className="bg-primary text-primary-foreground rounded-xl shadow-md">
                  {isSearching ? '...' : 'Ask AI'}
                </Button>
              </form>
            </div>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[0, 1, 2].map((i) => (
                <div key={i} className="bg-primary/5 rounded-[30px] h-96 animate-pulse border border-primary/10" />
              ))}
            </div>
          ) : displayedServices.length > 0 ? (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: '-80px' }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            >
              {displayedServices.map((service, idx) => (
                <motion.div key={service.id} variants={itemVariants} className="group">
                  <Card className="border-none shadow-xl shadow-primary/5 rounded-[30px] bg-white h-full flex flex-col overflow-hidden hover:-translate-y-2 transition-all duration-300 relative">
                    {recommendedIds?.includes(service.id) && (
                      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-rose-400 to-pink-500 z-20"></div>
                    )}
                    <div className="h-64 overflow-hidden relative p-3">
                      <div className="w-full h-full rounded-[20px] overflow-hidden relative">
                        {service.imageUrl ? (
                          <img
                            src={service.imageUrl}
                            alt={service.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                          />
                        ) : (
                          <div className="w-full h-full bg-primary/10 flex items-center justify-center">
                            <Sparkles className="w-8 h-8 text-primary/30" />
                          </div>
                        )}
                        <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-4 py-1.5 rounded-full font-heading text-lg text-primary font-medium shadow-sm z-10">
                          Rs. {service.price}
                        </div>
                        {recommendedIds?.includes(service.id) && (
                          <div className="absolute top-4 left-4 bg-rose-500/90 text-white backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold shadow-sm z-10 flex items-center gap-1">
                            <Sparkles className="w-3 h-3" /> AI Pick
                          </div>
                        )}
                      </div>
                    </div>
                    <CardHeader className="pt-6 pb-2 px-8">
                      <CardTitle className="font-heading text-2xl text-foreground mb-2">{service.name}</CardTitle>
                      <CardDescription className="line-clamp-2 text-foreground/70 text-base">
                        {service.description || 'Premium nail service tailored for you.'}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 px-8">
                      <div className="flex items-center text-[12px] tracking-[0.1em] uppercase text-primary gap-2 font-medium bg-primary/5 w-fit px-3 py-1.5 rounded-full mt-2">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{service.durationMinutes} Min</span>
                      </div>
                    </CardContent>
                    <CardFooter className="pb-8 px-8 mt-4">
                      <Button
                        onClick={() => handleBookNow(service)}
                        className="w-full rounded-full h-12 text-[12px] tracking-[0.12em] uppercase bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground transition-all"
                      >
                        Book Appointment
                      </Button>
                    </CardFooter>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <div className="text-center p-20 rounded-[40px] border-2 border-dashed border-primary/20 bg-primary/5">
              <Sparkles className="w-8 h-8 text-primary/40 mx-auto mb-4" />
              <p className="text-foreground/70 text-lg">
                {recommendedIds ? "We couldn't find any specific services matching that description. Try asking something else!" : "No services available at the moment."}
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Gallery Preview */}
      {galleryImages.length > 0 && (
        <section className="py-24 px-6 md:px-12 bg-white relative">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.02]" />
          <div className="max-w-6xl mx-auto relative z-10">
            <div className="flex flex-col md:flex-row items-end justify-between mb-16 gap-6">
              <div className="max-w-2xl">
                <p className="flex items-center gap-2 text-[12px] tracking-[0.2em] uppercase text-primary font-semibold mb-4">
                  <Sparkles className="w-4 h-4" /> Portfolio
                </p>
                <h2 className="font-heading text-4xl md:text-5xl lg:text-6xl text-foreground">
                  Recent <span className="italic font-light">Masterpieces</span>
                </h2>
              </div>
              <Link href="/gallery">
                <Button className="rounded-full h-12 px-8 text-[12px] tracking-[0.1em] uppercase bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-md">
                  View Full Gallery
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {galleryImages.slice(0, 4).map((image, i) => (
                <Link key={image.id} href="/gallery" className={`block relative group overflow-hidden rounded-[2rem] bg-slate-100 ${i === 0 || i === 3 ? 'aspect-[4/5]' : 'aspect-square md:aspect-[4/5]'}`}>
                  <img
                    src={image.url}
                    alt={image.altText || 'Nail Art'}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                    <Sparkles className="w-8 h-8 text-white" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Why Choose Us */}
      <section id="about" className="relative bg-primary text-primary-foreground py-32 px-6 md:px-12 overflow-hidden">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-white/5 rounded-full blur-[80px] -z-0 translate-x-1/3 -translate-y-1/3" />
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="mb-20 max-w-2xl">
            <p className="flex items-center gap-2 text-[12px] tracking-[0.2em] uppercase text-primary-foreground/80 font-semibold mb-4">
              <Sparkles className="w-4 h-4" /> Why Choose Us
            </p>
            <h2 className="font-heading text-4xl md:text-5xl lg:text-6xl leading-[1.1]">
              Three things we <span className="italic font-light">never</span> compromise on.
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 lg:gap-16">
            <div className="bg-white/10 backdrop-blur-md p-10 rounded-[30px] border border-white/20 hover:bg-white/15 transition-colors">
              <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center mb-8">
                <Sparkles className="w-6 h-6 text-white" strokeWidth={1.5} />
              </div>
              <h3 className="font-heading text-2xl mb-4">Premium Products</h3>
              <p className="text-primary-foreground/80 leading-relaxed text-lg">
                Only non-toxic polishes and gels that protect your natural nails while delivering
                brilliant, lasting color.
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-md p-10 rounded-[30px] border border-white/20 hover:bg-white/15 transition-colors">
              <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center mb-8">
                <ShieldCheck className="w-6 h-6 text-white" strokeWidth={1.5} />
              </div>
              <h3 className="font-heading text-2xl mb-4">Strict Hygiene</h3>
              <p className="text-primary-foreground/80 leading-relaxed text-lg">
                Tools are medically sterilized and single-use items are discarded after every
                single appointment.
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-md p-10 rounded-[30px] border border-white/20 hover:bg-white/15 transition-colors">
              <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center mb-8">
                <span className="text-2xl">♡</span>
              </div>
              <h3 className="font-heading text-2xl mb-4">Master Artistry</h3>
              <p className="text-primary-foreground/80 leading-relaxed text-lg">
                From classic French tips to intricate 3D designs, years of experience behind every
                fingertip.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-32 px-6 md:px-12 bg-background relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[100px] -z-10" />
        <div className="max-w-5xl mx-auto">
          <p className="flex items-center justify-center gap-2 text-[12px] tracking-[0.2em] uppercase text-primary font-semibold mb-4 text-center">
            <Sparkles className="w-4 h-4" /> From the Chair
          </p>
          <h2 className="font-heading text-4xl md:text-5xl text-center mb-20 text-foreground">What Our Clients Say</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="bg-white p-10 rounded-[30px] shadow-lg shadow-primary/5 border border-primary/10 relative">
              <div className="absolute -top-6 -left-6 text-7xl text-primary/20 font-serif">"</div>
              <p className="font-heading italic text-2xl leading-snug mb-8 text-foreground relative z-10">
                Absolutely stunning work. So much attention to detail — my acrylics have never
                looked so natural and lasted so long.
              </p>
              <div className="flex items-center gap-4 border-t border-primary/10 pt-6">
                <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center text-primary font-heading text-xl">S</div>
                <p className="text-[12px] tracking-[0.15em] uppercase text-foreground/70 font-semibold">Sarah Jenkins</p>
              </div>
            </div>
            <div className="bg-white p-10 rounded-[30px] shadow-lg shadow-primary/5 border border-primary/10 relative mt-0 md:mt-12">
              <div className="absolute -top-6 -left-6 text-7xl text-primary/20 font-serif">"</div>
              <p className="font-heading italic text-2xl leading-snug mb-8 text-foreground relative z-10">
                The studio is calm and spotless. The gel pedicure and foot massage were exactly
                what I needed after a long week.
              </p>
              <div className="flex items-center gap-4 border-t border-primary/10 pt-6">
                <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center text-primary font-heading text-xl">E</div>
                <p className="text-[12px] tracking-[0.15em] uppercase text-foreground/70 font-semibold">Emily R.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white text-foreground py-20 px-6 md:px-12 border-t border-primary/10">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="col-span-1 md:col-span-1">
            <Logo height={150} width={200} />
            <p className="text-foreground/70 max-w-sm leading-relaxed text-lg">
              Elevating nail care to an art form. Book your appointment today and experience true
              craft.
            </p>
          </div>
          <div>
            <h4 className="text-[12px] font-bold tracking-[0.15em] uppercase text-foreground mb-6">Contact Us</h4>
            <div className="space-y-4 text-foreground/70">
              <a
                href={settings?.googleMapsLink || '#'}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-3 hover:text-primary transition-colors cursor-pointer w-fit"
              >
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  <MapPin className="w-4 h-4" />
                </div>
                <span>{settings?.contactLocation || 'Boudha, Kathmandu'}</span>
              </a>
              <a
                href={`https://wa.me/${(settings?.contactPhone || '').replace(/[^0-9]/g, '')}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-3 hover:text-primary transition-colors cursor-pointer w-fit"
              >
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  <Phone className="w-4 h-4" />
                </div>
                <span>{settings?.contactPhone || '+977 984010613'}</span>
              </a>
              {settings?.socialLinks && Object.entries(settings.socialLinks).map(([platform, config]: [string, any]) => {
                if (!config.isActive) return null;
                const socialIcons: Record<string, JSX.Element> = {
                  instagram: <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" /></svg>,
                  facebook: <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>,
                  tiktok: <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.22 8.22 0 004.83 1.56V6.79a4.85 4.85 0 01-1.06-.1z" /></svg>,
                  twitter: <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>,
                  youtube: <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" /></svg>,
                }
                return (
                  <a
                    key={platform}
                    href={config.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-3 hover:text-primary transition-colors cursor-pointer w-fit"
                  >
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                      {socialIcons[platform] ?? <span className="font-bold text-xs capitalize">{platform.slice(0, 2)}</span>}
                    </div>
                    <span>{config.label}</span>
                  </a>
                )
              })}
            </div>
          </div>
          <div>
            <h4 className="text-[12px] font-bold tracking-[0.15em] uppercase text-foreground mb-6">Studio Hours</h4>
            <div className="space-y-3 text-sm">
              {settings ? (
                daysOfWeek.map((day, idx) => {
                  const dayConfig = settings.weeklySchedule?.[idx.toString()]
                  const isActive = dayConfig ? dayConfig.isActive : settings.workingDays?.includes(idx)
                  const start = dayConfig ? dayConfig.startTime : settings.startTime
                  const end = dayConfig ? dayConfig.endTime : settings.endTime

                  return (
                    <div
                      key={day}
                      className="flex justify-between items-center border-b border-primary/10 pb-3 last:border-0 text-foreground/70"
                    >
                      <span className="font-medium">{day}</span>
                      <span className={isActive ? 'text-primary font-medium bg-primary/5 px-3 py-1 rounded-full' : 'text-foreground/40 italic'}>
                        {isActive
                          ? `${formatTimeStr(start)} - ${formatTimeStr(end)}`
                          : 'Closed'}
                      </span>
                    </div>
                  )
                })
              ) : (
                <div className="animate-pulse flex flex-col gap-3">
                  <div className="h-8 bg-primary/5 rounded-full w-full" />
                  <div className="h-8 bg-primary/5 rounded-full w-full" />
                  <div className="h-8 bg-primary/5 rounded-full w-full" />
                </div>
              )}
            </div>
          </div>
          <div className="col-span-1 md:col-span-1 h-48 md:h-full rounded-2xl overflow-hidden border border-primary/20 shadow-md">
            <iframe
              width="100%"
              height="100%"
              frameBorder="0"
              scrolling="no"
              marginHeight={0}
              marginWidth={0}
              src={`https://maps.google.com/maps?q=${encodeURIComponent(settings?.contactLocation || 'Boudha, Kathmandu')}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
            ></iframe>
          </div>
        </div>
        <div className="max-w-6xl mx-auto mt-20 pt-8 border-t border-primary/10 flex flex-col md:flex-row items-center justify-between text-foreground/50 text-sm">
          <p>&copy; {new Date().getFullYear()} Nails By Mamta. All rights reserved.</p>
          <div className="flex items-center gap-1 mt-4 md:mt-0">
            Designed with <span className="text-primary text-lg leading-none">♡</span> for you
          </div>
        </div>
      </footer>

      {/* Booking Modal */}
      <BookingModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} service={selectedService} />
    </main>
  )
}
