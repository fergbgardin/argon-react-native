// Ambient "ink light" behind the frosted header — gives the liquid glass
// something to refract. Purely decorative.
export default function AmbientGlow() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-[460px] overflow-hidden">
      <div
        className="absolute -top-28 -left-20 w-80 h-80 rounded-full"
        style={{ background: 'radial-gradient(closest-side, rgba(124,108,255,0.50), transparent 72%)', filter: 'blur(26px)' }}
      />
      <div
        className="absolute -top-20 -right-16 w-80 h-80 rounded-full"
        style={{ background: 'radial-gradient(closest-side, rgba(240,99,126,0.34), transparent 72%)', filter: 'blur(30px)' }}
      />
    </div>
  )
}
