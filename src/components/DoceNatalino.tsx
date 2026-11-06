import React from 'react';

interface DoceNatalinoProps {
  className?: string;
  size?: number;
  tilt?: number;
  duplo?: boolean; // Duas bengalas doces cruzadas com laço
}

/**
 * Bengala Doce de Natal (Candy Cane) vetorial de alta definição.
 * Listras vermelhas e brancas espiraladas com brilho 3D,
 * laço verde esmeralda com fita e azevinhos natalinos.
 */
export const DoceNatalino: React.FC<DoceNatalinoProps> = ({
  className = '',
  size = 32,
  tilt = 0,
  duplo = false,
}) => {
  if (duplo) {
    return (
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`inline-block select-none pointer-events-none drop-shadow-md ${className}`}
        style={{
          width: size,
          height: size,
          transform: `rotate(${tilt}deg)`,
        }}
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="candyWhite" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="70%" stopColor="#F8FAFC" />
            <stop offset="100%" stopColor="#E2E8F0" />
          </linearGradient>

          <linearGradient id="candyRed" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#EF4444" />
            <stop offset="50%" stopColor="#DC2626" />
            <stop offset="100%" stopColor="#991B1B" />
          </linearGradient>

          <linearGradient id="ribbonGreen" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10B981" />
            <stop offset="50%" stopColor="#059669" />
            <stop offset="100%" stopColor="#047857" />
          </linearGradient>

          <radialGradient id="candyGold" cx="35%" cy="35%" r="65%">
            <stop offset="0%" stopColor="#FDE047" />
            <stop offset="60%" stopColor="#EAB308" />
            <stop offset="100%" stopColor="#A16207" />
          </radialGradient>
        </defs>

        {/* Bengala 1 (inclinada para esquerda) */}
        <g transform="rotate(-22 50 50)">
          {/* Tubo da bengala branca */}
          <path
            d="M 38 85 L 38 38 C 38 20, 62 20, 62 38"
            stroke="url(#candyWhite)"
            strokeWidth="11"
            strokeLinecap="round"
          />
          {/* Listras vermelhas inclinadas */}
          <path
            d="M 38 85 L 38 38 C 38 20, 62 20, 62 38"
            stroke="url(#candyRed)"
            strokeWidth="11"
            strokeDasharray="6 8"
            strokeLinecap="round"
          />
          {/* Brilho da haste */}
          <path
            d="M 36 80 L 36 38 C 36 24, 60 24, 60 38"
            stroke="#FFFFFF"
            strokeWidth="2"
            strokeOpacity="0.75"
            strokeLinecap="round"
          />
        </g>

        {/* Bengala 2 (inclinada para direita) */}
        <g transform="rotate(22 50 50)">
          {/* Tubo da bengala branca */}
          <path
            d="M 62 85 L 62 38 C 62 20, 38 20, 38 38"
            stroke="url(#candyWhite)"
            strokeWidth="11"
            strokeLinecap="round"
          />
          {/* Listras vermelhas inclinadas */}
          <path
            d="M 62 85 L 62 38 C 62 20, 38 20, 38 38"
            stroke="url(#candyRed)"
            strokeWidth="11"
            strokeDasharray="6 8"
            strokeLinecap="round"
          />
          {/* Brilho da haste */}
          <path
            d="M 64 80 L 64 38 C 64 24, 40 24, 40 38"
            stroke="#FFFFFF"
            strokeWidth="2"
            strokeOpacity="0.75"
            strokeLinecap="round"
          />
        </g>

        {/* Laço central verde esmeralda no ponto de cruzamento */}
        <g transform="translate(0, 10)">
          {/* Faixas caídas do laço */}
          <path d="M 50 54 Q 44 68, 36 76 Q 44 72, 48 58 Z" fill="url(#ribbonGreen)" />
          <path d="M 50 54 Q 56 68, 64 76 Q 56 72, 52 58 Z" fill="url(#ribbonGreen)" />

          {/* Orelhas do laço */}
          <ellipse cx="40" cy="50" rx="9" ry="5.5" transform="rotate(-25 40 50)" fill="url(#ribbonGreen)" />
          <ellipse cx="60" cy="50" rx="9" ry="5.5" transform="rotate(25 60 50)" fill="url(#ribbonGreen)" />

          {/* Nó dourado central */}
          <circle cx="50" cy="50" r="4.5" fill="url(#candyGold)" stroke="#CA8A04" strokeWidth="0.8" />

          {/* Folhinha de azevinho */}
          <circle cx="48" cy="45" r="1.8" fill="#DC2626" />
          <circle cx="52" cy="45" r="1.8" fill="#EF4444" />
          <circle cx="50" cy="42" r="1.6" fill="#B91C1C" />
        </g>
      </svg>
    );
  }

  // Bengala Doce Única
  return (
    <svg
      viewBox="0 0 60 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`inline-block select-none pointer-events-none drop-shadow-sm ${className}`}
      style={{
        width: size * 0.75,
        height: size,
        transform: `rotate(${tilt}deg)`,
      }}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="candyWhiteSingle" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="60%" stopColor="#F8FAFC" />
          <stop offset="100%" stopColor="#E2E8F0" />
        </linearGradient>

        <linearGradient id="candyRedSingle" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#EF4444" />
          <stop offset="50%" stopColor="#DC2626" />
          <stop offset="100%" stopColor="#991B1B" />
        </linearGradient>

        <linearGradient id="ribbonGreenSingle" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#10B981" />
          <stop offset="100%" stopColor="#047857" />
        </linearGradient>
      </defs>

      {/* Tubo da bengala branca */}
      <path
        d="M 22 72 L 22 30 C 22 14, 46 14, 46 30"
        stroke="url(#candyWhiteSingle)"
        strokeWidth="9"
        strokeLinecap="round"
      />

      {/* Listras espiraladas vermelhas */}
      <path
        d="M 22 72 L 22 30 C 22 14, 46 14, 46 30"
        stroke="url(#candyRedSingle)"
        strokeWidth="9"
        strokeDasharray="5 7"
        strokeLinecap="round"
      />

      {/* Linha fina de brilho espelhado */}
      <path
        d="M 20 68 L 20 30 C 20 17, 44 17, 44 30"
        stroke="#FFFFFF"
        strokeWidth="1.6"
        strokeOpacity="0.8"
        strokeLinecap="round"
      />

      {/* Lacinho delicado na haste */}
      <g transform="translate(0, 8)">
        <ellipse cx="16" cy="36" rx="5" ry="3" transform="rotate(-30 16 36)" fill="url(#ribbonGreenSingle)" />
        <ellipse cx="28" cy="36" rx="5" ry="3" transform="rotate(30 28 36)" fill="url(#ribbonGreenSingle)" />
        <circle cx="22" cy="36" r="2.5" fill="#EAB308" />
      </g>
    </svg>
  );
};
