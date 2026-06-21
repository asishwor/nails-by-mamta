import json
import os

# 1. Update JSON files
en_path = 'messages/en.json'
ne_path = 'messages/ne.json'

with open(en_path, 'r', encoding='utf-8') as f:
    en_data = json.load(f)

with open(ne_path, 'r', encoding='utf-8') as f:
    ne_data = json.load(f)

en_additions = {
    "Navigation": {
        "dashboard": "Dashboard",
        "signIn": "Sign In",
        "app": "App"
    },
    "Home": {
        "expressStyle": "Express Your Style",
        "nailArt": "Nail Art,",
        "designedForYou": "Designed for You",
        "heroDescription": "Trendy nail designs, unique nail arts and expert services – all available online, just for you.",
        "featureTrendy": "Trendy Designs",
        "featureCustom": "Custom Nail Art",
        "featureOnline": "Online Consultation",
        "featureInspiration": "Inspiration Delivered",
        "exploreDesigns": "Explore Designs \u2192",
        "beautifulNails": "Beautiful Nails,",
        "endlessPossibilities": "Endless Possibilities",
        "circularText": "YOUR STYLE • OUR PASSION • YOUR STYLE • OUR PASSION •",
        "personalStylist": "Personal Stylist",
        "personalizedForYou": "✨ Personalized For You",
        "bookNow": "Book Now",
        "theMenu": "The Menu",
        "signatureServices": "Signature Services",
        "searchPlaceholder": "E.g. I want shiny, long nails for a party...",
        "clear": "Clear",
        "askAI": "Ask AI",
        "searching": "...",
        "aiPick": "AI Pick",
        "min": "Min",
        "bookAppointment": "Book Appointment",
        "noSearchMatch": "We couldn't find any specific services matching that description. Try asking something else!",
        "noServices": "No services available at the moment.",
        "portfolio": "Portfolio",
        "recentMasterpieces": "Recent Masterpieces",
        "viewFullGallery": "View Full Gallery",
        "whyChooseUs": "Why Choose Us",
        "neverCompromise": "Three things we never compromise on.",
        "premiumProducts": "Premium Products",
        "premiumDesc": "Only non-toxic polishes and gels that protect your natural nails while delivering brilliant, lasting color.",
        "strictHygiene": "Strict Hygiene",
        "hygieneDesc": "Tools are medically sterilized and single-use items are discarded after every single appointment.",
        "masterArtistry": "Master Artistry",
        "artistryDesc": "From classic French tips to intricate 3D designs, years of experience behind every fingertip.",
        "fromTheChair": "From the Chair",
        "whatClientsSay": "What Our Clients Say",
        "mobilizeBeauty": "Mobilize Beauty",
        "onTheGo": "on the Go",
        "downloadFor": "Download for",
        "androidApk": "Android (.APK)",
        "iosApp": "iOS App",
        "comingSoon": "Coming Soon",
        "contactUs": "Contact Us",
        "searchFound": "Found {count} perfect matches for you!",
        "searchNoMatch": "We couldn't find a perfect match, but take a look at all our services!",
        "searchFailed": "Search failed. Please try again."
    }
}

ne_additions = {
    "Navigation": {
        "dashboard": "ड्यासबोर्ड",
        "signIn": "साइन इन",
        "app": "एप"
    },
    "Home": {
        "expressStyle": "आफ्नो शैली व्यक्त गर्नुहोस्",
        "nailArt": "नङ कला,",
        "designedForYou": "तपाईंको लागि डिजाइन गरिएको",
        "heroDescription": "ट्रेन्डी नङ डिजाइन, अद्वितीय नङ कला र विशेषज्ञ सेवाहरू - सबै अनलाइन उपलब्ध छन्, केवल तपाईंको लागि।",
        "featureTrendy": "ट्रेन्डी डिजाइनहरू",
        "featureCustom": "कस्टम नङ कला",
        "featureOnline": "अनलाइन परामर्श",
        "featureInspiration": "प्रेरणा प्रदान",
        "exploreDesigns": "डिजाइनहरू अन्वेषण गर्नुहोस् \u2192",
        "beautifulNails": "सुन्दर नङ,",
        "endlessPossibilities": "अनन्त सम्भावनाहरू",
        "circularText": "तपाईंको शैली • हाम्रो जोश • तपाईंको शैली • हाम्रो जोश •",
        "personalStylist": "व्यक्तिगत स्टाइलिस्ट",
        "personalizedForYou": "✨ तपाईंको लागि व्यक्तिगत",
        "bookNow": "अहिले बुक गर्नुहोस्",
        "theMenu": "मेनु",
        "signatureServices": "सिग्नेचर सेवाहरू",
        "searchPlaceholder": "जस्तै मलाई पार्टीको लागि चम्किलो, लामो नङ चाहियो...",
        "clear": "हटाउनुहोस्",
        "askAI": "AI लाई सोध्नुहोस्",
        "searching": "...",
        "aiPick": "AI छनोट",
        "min": "मिनेट",
        "bookAppointment": "अपोइन्टमेन्ट बुक गर्नुहोस्",
        "noSearchMatch": "हामीले त्यो विवरणसँग मेल खाने कुनै विशिष्ट सेवाहरू फेला पार्न सकेनौं। केहि अन्य सोध्ने प्रयास गर्नुहोस्!",
        "noServices": "यस समयमा कुनै सेवाहरू उपलब्ध छैनन्।",
        "portfolio": "पोर्टफोलियो",
        "recentMasterpieces": "भर्खरैका उत्कृष्ट कामहरू",
        "viewFullGallery": "पूर्ण ग्यालरी हेर्नुहोस्",
        "whyChooseUs": "हामीलाई किन छान्ने",
        "neverCompromise": "तीन कुरा जसमा हामी कहिल्यै सम्झौता गर्दैनौं।",
        "premiumProducts": "प्रिमियम उत्पादनहरू",
        "premiumDesc": "केवल गैर-विषाक्त पालिस र जेलहरू जसले तपाईंको प्राकृतिक नङको सुरक्षा गर्दछ र उत्कृष्ट, दिगो रङ प्रदान गर्दछ।",
        "strictHygiene": "कडा स्वच्छता",
        "hygieneDesc": "उपकरणहरू चिकित्सकीय रूपमा बाँझ बनाइन्छन् र एकल-प्रयोग वस्तुहरू हरेक अपोइन्टमेन्ट पछि फ्याँकिन्छन्।",
        "masterArtistry": "मास्टर कलात्मकता",
        "artistryDesc": "क्लासिक फ्रेन्च टिप्सदेखि जटिल थ्रीडी डिजाइनसम्म, हरेक औंलाको पछाडि वर्षौंको अनुभव।",
        "fromTheChair": "कुर्सीबाट",
        "whatClientsSay": "हाम्रा ग्राहकहरू के भन्छन्",
        "mobilizeBeauty": "सौन्दर्य मोबाइलमा",
        "onTheGo": "अन दि गो (जाँदाजाँदै)",
        "downloadFor": "यसका लागि डाउनलोड गर्नुहोस्",
        "androidApk": "एन्ड्रोइड (.APK)",
        "iosApp": "आईओएस (iOS) एप",
        "comingSoon": "चाँडै आउँदैछ",
        "contactUs": "हामीलाई सम्पर्क गर्नुहोस्",
        "searchFound": "तपाईंको लागि {count} सही मेल फेला पर्यो!",
        "searchNoMatch": "हामीले सही मेल फेला पार्न सकेनौं, तर हाम्रा सबै सेवाहरू हेर्नुहोस्!",
        "searchFailed": "खोज असफल भयो। कृपया फेरि प्रयास गर्नुहोस्।"
    }
}

# Merge additions
for key, val in en_additions.items():
    if key not in en_data:
        en_data[key] = {}
    en_data[key].update(val)

for key, val in ne_additions.items():
    if key not in ne_data:
        ne_data[key] = {}
    ne_data[key].update(val)

with open(en_path, 'w', encoding='utf-8') as f:
    json.dump(en_data, f, indent=2, ensure_ascii=False)

with open(ne_path, 'w', encoding='utf-8') as f:
    json.dump(ne_data, f, indent=2, ensure_ascii=False)

# 2. Patch page.tsx
page_path = 'src/app/page.tsx'
with open(page_path, 'r', encoding='utf-8') as f:
    content = f.read()

replacements = [
    # Toasts inside handleSearch
    ("toast.success(`Found ${data.recommendedIds.length} perfect matches for you!`)", "toast.success(t('Home.searchFound', { count: data.recommendedIds.length }))"),
    ('toast.info("We couldn\'t find a perfect match, but take a look at all our services!")', "toast.info(t('Home.searchNoMatch'))"),
    ("toast.error('Search failed. Please try again.')", "toast.error(t('Home.searchFailed'))"),
    
    # Navigation Desktop
    (">Services<", ">{t('Navigation.services')}<"),
    (">About<", ">{t('Navigation.about')}<"),
    (">Gallery<", ">{t('Navigation.gallery')}<"),
    (">App<", ">{t('Navigation.app')}<"),
    (">Dashboard<", ">{t('Navigation.dashboard')}<"),
    (">Log Out<", ">{t('Navigation.logout')}<"),
    (">Sign In<", ">{t('Navigation.signIn')}<"),
    
    # Navigation Mobile
    # For navigation strings we replaced them all with >Services< etc, which might hit some twice. That's fine as long as they exist.
    
    # Hero Section
    ("Express Your Style", "{t('Home.expressStyle')}"),
    ("Nail Art,", "{t('Home.nailArt')}"),
    ("Designed for You", "{t('Home.designedForYou')}"),
    ("Trendy nail designs, unique nail arts and expert services – all available online, just for you.", "{t('Home.heroDescription')}"),
    
    ("Trendy<br />Designs", "{t('Home.featureTrendy').split(' ')[0]}<br />{t('Home.featureTrendy').split(' ').slice(1).join(' ')}"),
    ("Custom<br />Nail Art", "{t('Home.featureCustom').split(' ')[0]}<br />{t('Home.featureCustom').split(' ').slice(1).join(' ')}"),
    ("Online<br />Consultation", "{t('Home.featureOnline').split(' ')[0]}<br />{t('Home.featureOnline').split(' ').slice(1).join(' ')}"),
    ("Inspiration<br />Delivered", "{t('Home.featureInspiration').split(' ')[0]}<br />{t('Home.featureInspiration').split(' ').slice(1).join(' ')}"),
    
    ("Explore Designs &rarr;", "{t('Home.exploreDesigns')}"),
    ("Beautiful Nails, <br /> Endless Possibilities", "{t('Home.beautifulNails')} <br /> {t('Home.endlessPossibilities')}"),
    ("YOUR STYLE • OUR PASSION • YOUR STYLE • OUR PASSION •", "{t('Home.circularText')}"),
    
    # Services
    ("Personal Stylist", "{t('Home.personalStylist')}"),
    ("✨ Personalized For You", "{t('Home.personalizedForYou')}"),
    (">Book Now<", ">{t('Home.bookNow')}<"),
    ("The Menu", "{t('Home.theMenu')}"),
    ("Signature Services", "{t('Home.signatureServices')}"),
    ("E.g. I want shiny, long nails for a party...", "{t('Home.searchPlaceholder')}"),
    (">Clear<", ">{t('Home.clear')}<"),
    (">Ask AI<", ">{t('Home.askAI')}<"),
    ("? '...' : 'Ask AI'", "? t('Home.searching') : t('Home.askAI')"),
    ("AI Pick", "{t('Home.aiPick')}"),
    (">Min<", ">{t('Home.min')}<"),
    (">Book Appointment<", ">{t('Home.bookAppointment')}<"),
    ("We couldn\\'t find any specific services matching that description. Try asking something else!", "{t('Home.noSearchMatch')}"),
    ('We couldn\\"t find any specific services matching that description. Try asking something else!', "{t('Home.noSearchMatch')}"),
    ("No services available at the moment.", "{t('Home.noServices')}"),
    
    # Gallery
    ("Portfolio", "{t('Home.portfolio')}"),
    (">Recent <span", ">{t('Home.recentMasterpieces').split(' ')[0]} <span"),
    ("Masterpieces</span>", "{t('Home.recentMasterpieces').split(' ').slice(1).join(' ')}</span>"),
    ("View Full Gallery", "{t('Home.viewFullGallery')}"),
    
    # Why Choose Us
    ("Why Choose Us", "{t('Home.whyChooseUs')}"),
    (">Three things we <span", ">{t('Home.neverCompromise').split(' ').slice(0, 3).join(' ')} <span"),
    ("never</span> compromise on.</h2>", "{t('Home.neverCompromise').split(' ')[3]}</span> {t('Home.neverCompromise').split(' ').slice(4).join(' ')}</h2>"),
    
    ("Premium Products", "{t('Home.premiumProducts')}"),
    ("Only non-toxic polishes and gels that protect your natural nails while delivering\n                brilliant, lasting color.", "{t('Home.premiumDesc')}"),
    ("Strict Hygiene", "{t('Home.strictHygiene')}"),
    ("Tools are medically sterilized and single-use items are discarded after every\n                single appointment.", "{t('Home.hygieneDesc')}"),
    ("Master Artistry", "{t('Home.masterArtistry')}"),
    ("From classic French tips to intricate 3D designs, years of experience behind every\n                fingertip.", "{t('Home.artistryDesc')}"),
    
    # Testimonials
    ("From the Chair", "{t('Home.fromTheChair')}"),
    ("What Our Clients Say", "{t('Home.whatClientsSay')}"),
    
    # Download App
    ("Mobilize Beauty", "{t('Home.mobilizeBeauty')}"),
    (">Nails by Mamta <span", ">Nails by Mamta <span"), # "Nails by Mamta" is likely untranslated or part of brand. Wait, ne.json says "on the go" as "अन दि गो (जाँदाजाँदै)".
    # Let's just wrap it.
    (">Nails by Mamta <span className=\"italic font-light\">on the Go</span>", ">{t('Navigation.app')} <span className=\"italic font-light\">{t('Home.onTheGo')}</span>"),
    ("Download for", "{t('Home.downloadFor')}"),
    ("Android (.APK)", "{t('Home.androidApk')}"),
    ("iOS App", "{t('Home.iosApp')}"),
    ("Coming Soon", "{t('Home.comingSoon')}"),
    
    # Footer
    (">Contact Us<", ">{t('Home.contactUs')}<"),
    ("placeholder=\"E.g. I want shiny, long nails for a party...\"", "placeholder={t('Home.searchPlaceholder')}"),
    ("Only non-toxic polishes and gels that protect your natural nails while delivering\n                brilliant, lasting color.", "{t('Home.premiumDesc')}"),
    ("Tools are medically sterilized and single-use items are discarded after every\n                single appointment.", "{t('Home.hygieneDesc')}"),
    ("From classic French tips to intricate 3D designs, years of experience behind every\n                fingertip.", "{t('Home.artistryDesc')}"),
    
    ("Only non-toxic polishes and gels that protect your natural nails while delivering\n                brilliant, lasting color.", "{t('Home.premiumDesc')}"),
    ("Tools are medically sterilized and single-use items are discarded after every\n                single appointment.", "{t('Home.hygieneDesc')}"),
    ("From classic French tips to intricate 3D designs, years of experience behind every\n                fingertip.", "{t('Home.artistryDesc')}"),
]

for old, new in replacements:
    content = content.replace(old, new)

# Some exact multi-line replacements
content = content.replace('''Only non-toxic polishes and gels that protect your natural nails while delivering
                brilliant, lasting color.''', "{t('Home.premiumDesc')}")

content = content.replace('''Tools are medically sterilized and single-use items are discarded after every
                single appointment.''', "{t('Home.hygieneDesc')}")

content = content.replace('''From classic French tips to intricate 3D designs, years of experience behind every
                fingertip.''', "{t('Home.artistryDesc')}")
                
content = content.replace('''{recommendedIds ? "We couldn't find any specific services matching that description. Try asking something else!" : "No services available at the moment."}''', 
'''{recommendedIds ? t('Home.noSearchMatch') : t('Home.noServices')}''')

with open(page_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Patching complete.")
