import React from 'react';

interface GorroNatalinoProps {
  className?: string;
  size?: number;
  tilt?: number; // Ângulo de inclinação em graus
}

/**
 * Gorro de Papai Noel vetorial 3D estilizado de alta definição.
 * Possui tecido vermelho aveludado com gradiente e dobras realistas,
 * barra de pelúcia branca fofa e pompom esférico.
 */
export const GorroNatalino: React.FC<GorroNatalinoProps> = ({
  className = 'w-7 h-7',
  size,
  tilt = -12,
}) => {
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`inline-block select-none pointer-events-none drop-shadow-md ${className}`}
      style={{
        ...(size ? { width: size, height: size } : {}),
        transform: `rotate(${tilt}deg)`,
      }}
      aria-hidden="true"
    >
      <defs>
        {/* Gradiente vermelho vivo e aveludado */}
        <linearGradient id="gorroVermelhoGrad" x1="20%" y1="0%" x2="80%" y2="100%">
          <stop offset="0%" stopColor="#EF4444" />
          <stop offset="40%" stopColor="#DC2626" />
          <stop offset="85%" stopColor="#991B1B" />
          <stop offset="100%" stopColor="#7F1D1D" />
        </linearGradient>

        {/* Brilho da dobra do tecido */}
        <linearGradient id="gorroDobraGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F87171" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#B91C1C" stopOpacity="0.3" />
        </linearGradient>

        {/* Gradiente de pelúcia branca com sombra suave */}
        <linearGradient id="peluciaGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="70%" stopColor="#F1F5F9" />
          <stop offset="100%" stopColor="#CBD5E1" />
        </linearGradient>

        {/* Sombra interna para profundidade */}
        <radialGradient id="pompomGrad" cx="35%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="65%" stopColor="#E2E8F0" />
          <stop offset="100%" stopColor="#94A3B8" />
        </radialGradient>

        <filter id="gorroSombraFiltro" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="1" dy="2" stdDeviation="2" floodColor="#000000" floodOpacity="0.35" />
        </filter>
      </defs>

      <g filter="url(#gorroSombraFiltro)">
        {/* Corpo principal do gorro (cone curvo caído para a direita) */}
        <path
          d="M 22 72 C 24 45, 42 22, 68 18 C 76 17, 85 24, 86 34 C 87 44, 82 52, 80 58 C 72 48, 64 36, 50 38 C 36 40, 26 56, 22 72 Z"
          fill="url(#gorroVermelhoGrad)"
        />

        {/* Dobra curva com caimento para o lado direito */}
        <path
          d="M 66 18 C 78 20, 88 30, 86 42 C 84 54, 76 64, 75 70 C 72 65, 70 54, 74 44 C 77 35, 73 24, 66 18 Z"
          fill="#991B1B"
        />

        {/* Realce luminoso na curvatura do topo */}
        <path
          d="M 32 60 C 38 42, 50 28, 67 22"
          stroke="url(#gorroDobraGrad)"
          strokeWidth="3.5"
          strokeLinecap="round"
        />

        {/* Faixa inferior de pelúcia branca fofa (nuvem ondulada) */}
        <path
          d="M 16 75 
             C 16 68, 24 67, 28 71 
             C 32 66, 40 66, 44 70 
             C 48 65, 56 65, 60 70 
             C 65 66, 73 66, 77 71 
             C 82 67, 90 69, 89 76 
             C 90 83, 82 85, 77 82 
             C 73 86, 64 86, 60 82 
             C 55 86, 47 86, 43 82 
             C 39 86, 31 86, 27 82 
             C 22 86, 15 82, 16 75 Z"
          fill="url(#peluciaGrad)"
          stroke="#E2E8F0"
          strokeWidth="1"
        />

        {/* Textura fofinha extra na barra de pelúcia */}
        <circle cx="28" cy="75" r="3.5" fill="#FFFFFF" fillOpacity="0.8" />
        <circle cx="44" cy="74" r="3.8" fill="#FFFFFF" fillOpacity="0.8" />
        <circle cx="60" cy="74" r="3.8" fill="#FFFFFF" fillOpacity="0.8" />
        <circle cx="76" cy="75" r="3.5" fill="#FFFFFF" fillOpacity="0.8" />

        {/* Pompom branco felpudo pendurado na ponta */}
        <g transform="translate(76, 68)">
          <circle cx="0" cy="0" r="9" fill="url(#pompomGrad)" stroke="#E2E8F0" strokeWidth="1" />
          {/* Fios felpudos sutis no pompom */}
          <circle cx="-3" cy="-3" r="3.5" fill="#FFFFFF" fillOpacity="0.9" />
          <circle cx="2" cy="-2" r="2.5" fill="#FFFFFF" fillOpacity="0.7" />
        </g>
      </g>
    </svg>
  );
};
