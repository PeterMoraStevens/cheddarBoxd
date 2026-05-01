import { s3, S3_BUCKET } from '@/lib/s3'
import { GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { NextResponse } from 'next/server'

// Presigned GET URL for private S3 objects.
// Only exposes the avatars/ prefix — everything else is 403.
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const key = searchParams.get('key') ?? ''

  if (!key || !key.startsWith('avatars/')) {
    return new NextResponse(null, { status: 403 })
  }

  try {
    const url = await getSignedUrl(
      s3,
      new GetObjectCommand({ Bucket: S3_BUCKET, Key: key }),
      { expiresIn: 3600 },
    )

    return NextResponse.redirect(url, {
      headers: {
        // Browsers cache the redirect for 55 minutes so subsequent renders
        // skip this route entirely until the presigned URL nears expiry.
        'Cache-Control': 'public, max-age=3300',
      },
    })
  } catch {
    return new NextResponse(null, { status: 404 })
  }
}
