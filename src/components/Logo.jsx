import React from 'react';

export default function Logo({ size = 'md', variant = 'terracotta' }) {
  const sizes = {
    sm: { height: 42, title: '1.25rem', sub: '0.6rem' },
    md: { height: 58, title: '1.7rem', sub: '0.7rem' },
    lg: { height: 90, title: '2.6rem', sub: '0.9rem' }
  };

  const currentSize = sizes[size] || sizes.md;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', userSelect: 'none' }}>
      <svg
        height={currentSize.height}
        viewBox="0 0 160 160"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ filter: 'drop-shadow(0 2px 4px rgba(166, 75, 42, 0.15))' }}
      >
        <g fill="#D49B4B">
          <path d="M 80 8 L 84 40 L 80 34 L 76 40 Z" />
          <path d="M 80 152 L 84 120 L 80 126 L 76 120 Z" />
          <path d="M 8 80 L 40 84 L 34 80 L 40 76 Z" />
          <path d="M 152 80 L 120 84 L 126 80 L 120 76 Z" />

          <path d="M 28 28 L 52 48 L 48 44 L 44 52 Z" />
          <path d="M 132 132 L 108 112 L 112 116 L 116 108 Z" />
          <path d="M 28 132 L 48 108 L 44 116 L 52 112 Z" />
          <path d="M 132 28 L 112 52 L 116 44 L 108 48 Z" />

          <path d="M 52 20 Q 62 35 60 46 Q 54 38 48 26 Z" />
          <path d="M 108 20 Q 98 35 100 46 Q 106 38 112 26 Z" />
          <path d="M 140 52 Q 125 62 114 60 Q 122 54 134 48 Z" />
          <path d="M 140 108 Q 125 98 114 100 Q 122 106 134 112 Z" />
          <path d="M 52 140 Q 62 125 60 114 Q 54 122 48 134 Z" />
          <path d="M 108 140 Q 98 125 100 114 Q 106 122 112 134 Z" />
          <path d="M 20 52 Q 35 62 46 60 Q 38 54 26 48 Z" />
          <path d="M 20 108 Q 35 98 46 100 Q 38 106 26 112 Z" />
        </g>

        <circle cx="80" cy="80" r="44" stroke="#A64B2A" strokeWidth="4" fill="#FAF5EE" />
        <circle cx="80" cy="80" r="40" stroke="#D49B4B" strokeWidth="2.5" fill="none" />

        <g transform="translate(80, 80) scale(0.95)">
          <path
            d="M -16 12 C -24 -4 -16 -24 0 -30 C 16 -24 24 -4 16 12 C 10 22 0 26 0 26 C 0 26 -10 22 -16 12 Z"
            fill="#D49B4B"
            stroke="#A64B2A"
            strokeWidth="2"
          />
          <path
            d="M -9 4 C -14 -8 -10 -22 0 -26 C 10 -22 14 -8 9 4 C 5 12 0 16 0 16 C 0 16 -5 12 -9 4 Z"
            fill="#FAF5EE"
            stroke="#A64B2A"
            strokeWidth="2"
          />
          <circle cx="0" cy="-20" r="2.2" fill="#A64B2A" />
          <circle cx="-4.5" cy="-13" r="2" fill="#A64B2A" />
          <circle cx="4.5" cy="-13" r="2" fill="#A64B2A" />
          <circle cx="0" cy="-6" r="2.2" fill="#A64B2A" />
          <circle cx="-5" cy="1" r="2" fill="#A64B2A" />
          <circle cx="5" cy="1" r="2" fill="#A64B2A" />
          <circle cx="0" cy="8" r="2" fill="#A64B2A" />
        </g>
      </svg>

      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <span
          style={{
            fontFamily: "'Cormorant Garamond', 'Playfair Display', Georgia, serif",
            fontSize: currentSize.title,
            fontWeight: 700,
            color: variant === 'gold' ? '#FAF5EE' : '#1C2B22',
            letterSpacing: '0.14em',
            lineHeight: 0.9,
            textTransform: 'uppercase'
          }}
        >
          MESTIZO
        </span>
        <span
          style={{
            fontFamily: "'Cormorant Garamond', 'Playfair Display', Georgia, serif",
            fontSize: currentSize.sub,
            fontWeight: 600,
            color: '#A64B2A',
            letterSpacing: '0.24em',
            marginTop: '4px',
            textTransform: 'uppercase'
          }}
        >
          COMEDOR & BAR
        </span>
      </div>
    </div>
  );
}
