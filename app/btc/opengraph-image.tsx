import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export const alt = 'Bitcoin on Aptos - BTC Analytics';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#0a0a0a',
          backgroundImage:
            'radial-gradient(circle at 25% 25%, #1a1a1a 0%, transparent 50%), radial-gradient(circle at 75% 75%, #1a1a1a 0%, transparent 50%)',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 20,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 20,
            }}
          >
            <svg
              width="80"
              height="80"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M12 2C17.523 2 22 6.477 22 12C22 17.523 17.523 22 12 22C6.477 22 2 17.523 2 12C2 6.477 6.477 2 12 2Z"
                stroke="#F7931A"
                strokeWidth="2"
              />
              <path
                d="M15.5 9C15.5 7.5 14.5 6.5 13 6.5H9V11.5H13C14.5 11.5 15.5 10.5 15.5 9Z"
                stroke="#F7931A"
                strokeWidth="2"
              />
              <path
                d="M16 14.5C16 13 15 12 13.5 12H9V17.5H13.5C15 17.5 16 16.5 16 14.5Z"
                stroke="#F7931A"
                strokeWidth="2"
              />
            </svg>
            <h1
              style={{
                fontSize: 72,
                fontWeight: 'bold',
                background: 'linear-gradient(135deg, #F7931A 0%, #FFA500 100%)',
                backgroundClip: 'text',
                color: 'transparent',
                margin: 0,
              }}
            >
              Bitcoin Analytics
            </h1>
          </div>
          <p
            style={{
              fontSize: 32,
              color: '#888888',
              margin: 0,
              textAlign: 'center',
              maxWidth: 800,
            }}
          >
            Track Bitcoin supply, bridges, and wrapped BTC on Aptos
          </p>
          <div
            style={{
              display: 'flex',
              gap: 40,
              marginTop: 40,
            }}
          >
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 10,
              }}
            >
              <span
                style={{ fontSize: 48, fontWeight: 'bold', color: '#F7931A' }}
              >
                21M
              </span>
              <span style={{ fontSize: 20, color: '#666666' }}>Max Supply</span>
            </div>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 10,
              }}
            >
              <span
                style={{ fontSize: 48, fontWeight: 'bold', color: '#F7931A' }}
              >
                Real-time
              </span>
              <span style={{ fontSize: 20, color: '#666666' }}>
                Price Tracking
              </span>
            </div>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 10,
              }}
            >
              <span
                style={{ fontSize: 48, fontWeight: 'bold', color: '#F7931A' }}
              >
                Bridge
              </span>
              <span style={{ fontSize: 20, color: '#666666' }}>Analytics</span>
            </div>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
