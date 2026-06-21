with open('src/app/admin/page.tsx', 'r') as f:
    content = f.read()

replacements = {
    "Reason: {booking.cancelReason}": "{t('reason')} {booking.cancelReason}",
    "<SelectItem value=\"PENDING\">Pending</SelectItem>": "<SelectItem value=\"PENDING\">{t('pending')}</SelectItem>",
    "<SelectItem value=\"CONFIRMED\">Confirmed</SelectItem>": "<SelectItem value=\"CONFIRMED\">{t('confirmed')}</SelectItem>",
    "<SelectItem value=\"COMPLETED\">Completed</SelectItem>": "<SelectItem value=\"COMPLETED\">{t('completed')}</SelectItem>",
    "<SelectItem value=\"CANCELLED\">Cancelled</SelectItem>": "<SelectItem value=\"CANCELLED\">{t('cancelled')}</SelectItem>",
    "Page {page} of {totalPages}": "{t('pageOf', { page, totalPages })}",
    "mr-1\" /> Previous": "mr-1\" /> {t('previous')}",
    "Next <ChevronRight": "{t('next')} <ChevronRight"
}

for old, new in replacements.items():
    content = content.replace(old, new)

with open('src/app/admin/page.tsx', 'w') as f:
    f.write(content)

