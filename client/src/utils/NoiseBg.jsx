/**
 * CSS-based subtle noise/grain texture to replace FloatingParticles.
 * Uses a tiny inline SVG-based noise filter and an overlay div.
 * Zero JS, zero animated DOM nodes — pure CSS performance.
 */
export default function NoiseBg() {
  return (
    <div
      className="absolute inset-0 pointer-events-none z-0 select-none"
      aria-hidden="true"
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        backgroundRepeat: 'repeat',
        backgroundSize: '128px 128px',
        opacity: 0.025,
        mixBlendMode: 'overlay',
      }}
    />
  );
}
