import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/utils/prisma'

export async function GET(req: NextRequest) {
  try {
    // 1. Query the database settings for the APK file ID, fall back to environment variable
    const settings = await prisma.adminSettings.findFirst()
    const fileId = settings?.apkFileId || process.env.ANDROID_APK_DRIVE_ID || '1_nJj564a2yVdG48H6CXZs7S3Wv8g9Lp2'

    // Google Drive direct download URL format
    const driveUrl = `https://drive.google.com/uc?export=download&id=${fileId}`

    // 2. Fetch the initial page or file from Google Drive
    const response = await fetch(driveUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      },
    })

    if (!response.ok) {
      return new NextResponse('APK file not found or Google Drive link is inactive', { status: 404 })
    }

    const contentType = response.headers.get('content-type') || ''

    // 3. If Google Drive responds with HTML, it means a "large file virus scan confirmation page" is shown
    if (contentType.includes('text/html')) {
      const htmlText = await response.text()
      
      // Parse form action URL from HTML
      const actionMatch = htmlText.match(/action="([^"]+)"/)
      const actionUrl = actionMatch ? actionMatch[1] : 'https://drive.usercontent.google.com/download'

      // Parse hidden input fields (e.g. name="confirm" value="t" and name="uuid" value="...")
      const queryParams: string[] = []
      const inputMatches = htmlText.matchAll(/<input type="hidden" name="([^"]+)" value="([^"]+)"/g)
      for (const m of inputMatches) {
        queryParams.push(`${m[1]}=${encodeURIComponent(m[2])}`)
      }

      // Regex fallbacks in case of variations
      if (!queryParams.some(p => p.startsWith('confirm='))) {
        const confirmVal = htmlText.match(/name="confirm" value="([^"]+)"/)?.[1]
        if (confirmVal) queryParams.push(`confirm=${encodeURIComponent(confirmVal)}`)
      }
      if (!queryParams.some(p => p.startsWith('uuid='))) {
        const uuidVal = htmlText.match(/name="uuid" value="([^"]+)"/)?.[1]
        if (uuidVal) queryParams.push(`uuid=${encodeURIComponent(uuidVal)}`)
      }

      // If we failed to extract form inputs, it is likely an access denied / private file page
      if (queryParams.length === 0) {
        console.error('Google Drive returned HTML but no download form fields found. Access restricted or invalid ID.')
        return new NextResponse('Failed to download: The Google Drive file is private or invalid. Please ensure sharing is enabled for "Anyone with the link" on this file in Google Drive.', { status: 403 })
      }

      // Construct confirmed download URL and fetch again
      const finalDownloadUrl = `${actionUrl}?${queryParams.join('&')}`
      const confirmedResponse = await fetch(finalDownloadUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        },
      })

      if (!confirmedResponse.ok) {
        return new NextResponse('Failed to retrieve file content from Google Drive', { status: 502 })
      }

      // Return the stream with download headers, concealing the source
      return new NextResponse(confirmedResponse.body, {
        headers: {
          'Content-Type': 'application/vnd.android.package-archive',
          'Content-Disposition': 'attachment; filename="nails-by-mamta.apk"',
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        },
      })
    }

    // 4. Otherwise, stream the file directly (for smaller files under 100MB)
    return new NextResponse(response.body, {
      headers: {
        'Content-Type': 'application/vnd.android.package-archive',
        'Content-Disposition': 'attachment; filename="nails-by-mamta.apk"',
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    })
  } catch (error) {
    console.error('Error proxying APK download from Google Drive:', error)
    return new NextResponse('Internal Server Error during file download proxying', { status: 500 })
  }
}
