import { useState } from 'react'

export default function Avatar({ src, initials, size = 40, className = '' }) {
  const [errored, setErrored] = useState(false)
  const showImg = src && !errored

  return (
    <div
      className={`rounded-full overflow-hidden bg-primary/20 flex items-center justify-center flex-shrink-0 ${className}`}
      style={{ width: size, height: size }}
    >
      {showImg ? (
        <img
          src={src}
          alt={initials}
          referrerPolicy="no-referrer"
          onError={() => setErrored(true)}
          className="w-full h-full object-cover"
        />
      ) : (
        <span className="text-primary font-semibold" style={{ fontSize: size * 0.4 }}>
          {initials}
        </span>
      )}
    </div>
  )
}
