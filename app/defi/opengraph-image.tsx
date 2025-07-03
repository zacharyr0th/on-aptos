import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export const alt = 'DeFi on Aptos - Protocol Analytics';
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
                d="M13 2L3 14H12L11 22L21 10H12L13 2Z"
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
              DeFi Analytics
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
            Track protocols, TVL, and yields across Aptos DeFi ecosystem
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
                Trading
              </span>
              <span style={{ fontSize: 20, color: '#666666' }}>
                DEXs & Perps
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
                Lending
              </span>
              <span style={{ fontSize: 20, color: '#666666' }}>
                Borrow & Earn
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
                Yield
              </span>
              <span style={{ fontSize: 20, color: '#666666' }}>
                Farms & Vaults
              </span>
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
