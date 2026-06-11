/* Shared JSX for generated brand icons (PWA icons, favicons).
   Rendered by next/og ImageResponse in the icon route handlers. */

export function BrandIcon({ size }: { size: number }) {
  const shieldSize = Math.round(size * 0.56);
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)",
        borderRadius: Math.round(size * 0.22),
      }}
    >
      <svg
        width={shieldSize}
        height={shieldSize}
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
  );
}
