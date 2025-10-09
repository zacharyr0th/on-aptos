import { ImageResponse } from "next/og";

export const ogImageConfig = {
  alt: "On Aptos - Professional Blockchain Analytics",
  size: {
    width: 1200,
    height: 630,
  },
  contentType: "image/png" as const,
};

interface OgImageProps {
  title: string;
  subtitle?: string;
  stats?: Array<{
    label: string;
    value: string;
  }>;
  badge?: string;
}

export function createOgImage({ title, subtitle, stats, badge }: OgImageProps) {
  return new ImageResponse(
    <div
      style={{
        height: "100%",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#0a0a0a",
        backgroundImage:
          "radial-gradient(circle at 20% 30%, rgba(0, 215, 213, 0.08) 0%, transparent 50%), radial-gradient(circle at 80% 70%, rgba(0, 163, 161, 0.08) 0%, transparent 50%)",
        padding: "80px",
      }}
    >
      {/* Header with logo */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 20,
          position: "absolute",
          top: 60,
          left: 80,
        }}
      >
        <svg
          width="48"
          height="48"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="12" cy="12" r="10" fill="#00D7D5" opacity="0.2" />
          <path
            d="M12 2L6 8L12 14L18 8L12 2Z M12 10L8 14L12 18L16 14L12 10Z"
            fill="#00D7D5"
          />
        </svg>
        <span
          style={{
            fontSize: 28,
            fontWeight: "600",
            color: "#ffffff",
            letterSpacing: "-0.02em",
          }}
        >
          On Aptos
        </span>
      </div>

      {/* Badge */}
      {badge && (
        <div
          style={{
            display: "flex",
            backgroundColor: "rgba(0, 215, 213, 0.1)",
            border: "1px solid rgba(0, 215, 213, 0.3)",
            borderRadius: 999,
            padding: "8px 24px",
            marginBottom: 40,
          }}
        >
          <span
            style={{
              fontSize: 18,
              color: "#00D7D5",
              fontWeight: "500",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
            }}
          >
            {badge}
          </span>
        </div>
      )}

      {/* Main content */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 24,
          maxWidth: 1000,
        }}
      >
        <h1
          style={{
            fontSize: 72,
            fontWeight: "700",
            background: "linear-gradient(135deg, #ffffff 0%, #cccccc 100%)",
            backgroundClip: "text",
            color: "transparent",
            margin: 0,
            textAlign: "center",
            lineHeight: 1.1,
            letterSpacing: "-0.03em",
          }}
        >
          {title}
        </h1>

        {subtitle && (
          <p
            style={{
              fontSize: 32,
              color: "#888888",
              margin: 0,
              textAlign: "center",
              maxWidth: 900,
              lineHeight: 1.4,
            }}
          >
            {subtitle}
          </p>
        )}

        {/* Stats */}
        {stats && stats.length > 0 && (
          <div
            style={{
              display: "flex",
              gap: 60,
              marginTop: 40,
            }}
          >
            {stats.map((stat, idx) => (
              <div
                key={idx}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <span style={{ fontSize: 42, fontWeight: "700", color: "#00D7D5" }}>
                  {stat.value}
                </span>
                <span style={{ fontSize: 18, color: "#666666" }}>{stat.label}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer tagline */}
      <div
        style={{
          position: "absolute",
          bottom: 60,
          display: "flex",
          fontSize: 18,
          color: "#666666",
        }}
      >
        Professional Analytics • Real-time Data • Institutional Grade
      </div>
    </div>,
    {
      ...ogImageConfig.size,
    }
  );
}
