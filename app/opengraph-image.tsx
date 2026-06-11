import { ImageResponse } from "next/og";

export const alt = "MutualAid — Anonymous reviews & community for first responders";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "linear-gradient(135deg, #020617 0%, #0f172a 60%, #1e1b1b 100%)",
          padding: 72,
          position: "relative",
        }}
      >
        {/* Red glow accent */}
        <div
          style={{
            position: "absolute",
            top: -200,
            right: -150,
            width: 600,
            height: 600,
            borderRadius: 600,
            background: "radial-gradient(circle, rgba(220,38,38,0.25) 0%, rgba(220,38,38,0) 70%)",
          }}
        />

        {/* Logo row */}
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 16,
              background: "linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg
              width={36}
              height={36}
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1 1 0 0 1 1.52 0C14.5 3.8 17 5 19 5a1 1 0 0 1 1 1z" />
            </svg>
          </div>
          <div style={{ display: "flex", fontSize: 44, fontWeight: 800, color: "white" }}>
            Mutual<span style={{ color: "#ef4444" }}>Aid</span>
          </div>
        </div>

        {/* Headline */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div
            style={{
              fontSize: 76,
              fontWeight: 900,
              color: "white",
              lineHeight: 1.05,
              letterSpacing: -2,
              display: "flex",
              flexDirection: "column",
            }}
          >
            <span>Speak freely.</span>
            <span style={{ color: "#ef4444" }}>Your truth matters.</span>
          </div>
          <div style={{ fontSize: 30, color: "#94a3b8", display: "flex" }}>
            Anonymous reviews & community for police, fire, EMS & dispatch.
          </div>
        </div>

        {/* Footer strip */}
        <div style={{ display: "flex", alignItems: "center", gap: 32, fontSize: 24, color: "#64748b" }}>
          <span>79,000+ agencies</span>
          <span style={{ color: "#334155" }}>·</span>
          <span>100% anonymous</span>
          <span style={{ color: "#334155" }}>·</span>
          <span>Verified officers only</span>
        </div>
      </div>
    ),
    { ...size }
  );
}
