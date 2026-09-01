import { ImageResponse } from '@vercel/og';

export const runtime = 'edge';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const title = searchParams.get('title') ?? 'Doğadan Gelen Şifa & Yöresel Lezzetler';

  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #1b4332 0%, #2d6a4f 60%, #40916c 100%)',
          padding: '80px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 40 }}>
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: '50%',
              background: '#d4a373',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 36
            }}
          >
            🌿
          </div>
          <span style={{ fontSize: 40, fontWeight: 700, color: '#f4f1ea' }}>Zile Aktar</span>
        </div>
        <div style={{ fontSize: 56, fontWeight: 800, color: 'white', maxWidth: 900, lineHeight: 1.15, display: 'flex' }}>
          {title}
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
