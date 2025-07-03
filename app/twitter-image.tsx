import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export const alt = 'On Aptos - Real-time Blockchain Analytics';
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
                d="M12 2L2 7L12 12L22 7L12 2Z"
                stroke="#00D7D5"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M2 17L12 22L22 17"
                stroke="#00D7D5"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M2 12L12 17L22 12"
                stroke="#00D7D5"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <h1
              style={{
                fontSize: 72,
                fontWeight: 'bold',
                background: 'linear-gradient(135deg, #00D7D5 0%, #00A3A1 100%)',
                backgroundClip: 'text',
                color: 'transparent',
                margin: 0,
              }}
            >
              On Aptos
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
            Real-time analytics for Bitcoin, DeFi, LST, and Stablecoins
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
                style={{ fontSize: 48, fontWeight: 'bold', color: '#00D7D5' }}
              >
                150+
              </span>
              <span style={{ fontSize: 20, color: '#666666' }}>Protocols</span>
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
                style={{ fontSize: 48, fontWeight: 'bold', color: '#00D7D5' }}
              >
                $2B+
              </span>
              <span style={{ fontSize: 20, color: '#666666' }}>
                TVL Tracked
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
                style={{ fontSize: 48, fontWeight: 'bold', color: '#00D7D5' }}
              >
                24/7
              </span>
              <span style={{ fontSize: 20, color: '#666666' }}>Real-time</span>
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
