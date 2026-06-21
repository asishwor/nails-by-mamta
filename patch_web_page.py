import re

with open('src/app/page.tsx', 'r') as f:
    content = f.read()

# 1. Add state
old_state = """  const [searchQuery, setSearchQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [recommendedIds, setRecommendedIds] = useState<string[] | null>(null)

  const [galleryImages, setGalleryImages] = useState<any[]>([])"""

new_state = """  const [searchQuery, setSearchQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [recommendedIds, setRecommendedIds] = useState<string[] | null>(null)
  const [personalizedIds, setPersonalizedIds] = useState<string[] | null>(null)

  const [galleryImages, setGalleryImages] = useState<any[]>([])"""

content = content.replace(old_state, new_state)

# 2. Add useEffect for localstorage
old_effect = """  useEffect(() => {
    async function fetchData() {"""
new_effect = """  useEffect(() => {
    try {
      const historyStr = localStorage.getItem('ai_chat_history')
      if (historyStr) {
        const history = JSON.parse(historyStr)
        let allIds: string[] = []
        for (const msg of history) {
          if (msg.suggestedServiceIds && Array.isArray(msg.suggestedServiceIds)) {
            allIds.push(...msg.suggestedServiceIds)
          }
        }
        if (allIds.length > 0) {
          const uniqueIds = Array.from(new Set(allIds.reverse())).slice(0, 3)
          setPersonalizedIds(uniqueIds)
        }
      }
    } catch (err) {}
  }, [])

  useEffect(() => {
    async function fetchData() {"""

content = content.replace(old_effect, new_effect)

# 3. Add UI Section
old_ui = """        <div className="max-w-6xl mx-auto relative z-10">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-16 border-b border-primary/10 pb-8">"""

card_ui = """<Card className="group overflow-hidden rounded-[32px] border-none bg-white shadow-xl shadow-primary/5 hover:shadow-2xl hover:shadow-primary/10 transition-all duration-500 hover:-translate-y-2 flex flex-col h-full relative">
                      <div className="absolute top-4 right-4 z-20 bg-white/90 backdrop-blur-md px-4 py-1.5 rounded-full text-sm font-semibold text-primary shadow-sm">
                        Rs. {service.price}
                      </div>
                      <div className="relative h-64 overflow-hidden bg-primary/5">
                        {service.imageUrl ? (
                          <img src={service.imageUrl} alt={service.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-6xl opacity-20">💅</div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                      </div>
                      <CardHeader className="pt-8 pb-4 relative z-10">
                        <CardTitle className="font-heading text-2xl mb-2">{service.name}</CardTitle>
                        <CardDescription className="text-sm font-medium flex items-center gap-2">
                          <Clock className="w-4 h-4 text-primary" />
                          {service.durationMinutes} mins
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="flex-grow text-muted-foreground leading-relaxed text-sm">
                        {service.description}
                      </CardContent>
                      <CardFooter className="pt-4 pb-8">
                        <Button
                          onClick={() => handleBookClick(service)}
                          className="w-full bg-primary/10 text-primary hover:bg-primary hover:text-white rounded-2xl py-6 font-semibold text-base transition-all duration-300"
                        >
                          Book Now
                        </Button>
                      </CardFooter>
                    </Card>"""

new_ui = f"""        <div className="max-w-6xl mx-auto relative z-10">

          {{personalizedIds && personalizedIds.length > 0 && services.length > 0 && (
            <div className="mb-24">
              <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-12 border-b border-primary/10 pb-8">
                <div>
                  <p className="flex items-center gap-2 text-[12px] tracking-[0.2em] uppercase text-primary font-semibold mb-4">
                    <Sparkles className="w-4 h-4" /> Personal Stylist
                  </p>
                  <h2 className="font-heading text-4xl md:text-5xl lg:text-6xl text-foreground">✨ Personalized For You</h2>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {{services.filter(s => personalizedIds.includes(s.id)).map((service, i) => (
                  <motion.div
                    key={{`personalized-${{service.id}}`}}
                    initial={{{{ opacity: 0, y: 20 }}}}
                    whileInView={{{{ opacity: 1, y: 0 }}}}
                    viewport={{{{ once: true, margin: '-50px' }}}}
                    transition={{{{ duration: 0.5, delay: i * 0.1 }}}}
                  >
                    {card_ui}
                  </motion.div>
                ))}}
              </div>
            </div>
          )}}

          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-16 border-b border-primary/10 pb-8">"""

content = content.replace(old_ui, new_ui)

with open('src/app/page.tsx', 'w') as f:
    f.write(content)
