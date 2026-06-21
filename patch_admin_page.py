import re

with open('src/app/admin/page.tsx', 'r') as f:
    content = f.read()

# Add import
if "useTranslations" not in content:
    content = content.replace("import { useState, useEffect } from 'react'", "import { useState, useEffect } from 'react'\nimport { useTranslations } from 'next-intl'")

# Add hook inside component
if "const t = useTranslations('Admin')" not in content:
    content = content.replace("export default function AdminBookingsPage() {", "export default function AdminBookingsPage() {\n  const t = useTranslations('Admin')")

# Replace strings with translation keys
replacements = {
    "toast.error('Failed to load bookings')": "toast.error(t('failedToLoad'))",
    "toast.success('Booking status updated')": "toast.success(t('statusUpdated'))",
    "toast.error('Error updating status')": "toast.error(t('errorUpdating'))",
    "Bookings</h1>": "{t('title')}</h1>",
    "Manage your upcoming appointments.</p>": "{t('subtitle')}</p>",
    "Add Appointment": "{t('addAppointment')}",
    "All</TabsTrigger>": "{t('all')}</TabsTrigger>",
    "Pending</TabsTrigger>": "{t('pending')}</TabsTrigger>",
    "Confirmed</TabsTrigger>": "{t('confirmed')}</TabsTrigger>",
    "Completed</TabsTrigger>": "{t('completed')}</TabsTrigger>",
    "Cancelled</TabsTrigger>": "{t('cancelled')}</TabsTrigger>",
    "Date & Time</TableHead>": "{t('dateTime')}</TableHead>",
    "Client</TableHead>": "{t('client')}</TableHead>",
    "Service</TableHead>": "{t('service')}</TableHead>",
    "Status</TableHead>": "{t('status')}</TableHead>",
    "Loading...</TableCell>": "{t('loading')}</TableCell>",
    "No bookings found.</TableCell>": "{t('noBookings')}</TableCell>",
}

for old, new in replacements.items():
    content = content.replace(old, new)

with open('src/app/admin/page.tsx', 'w') as f:
    f.write(content)

