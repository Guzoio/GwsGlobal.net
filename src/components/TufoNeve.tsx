import React from 'react';

interface TufoNeveProps {
  lado?: 'esquerdo' | 'direito';
  className?: string;
}

/**
 * Tufo de Neve natalino decorativo para descansar sobre as bordas superiores dos botões.
 * Totalmente vetorial (SVG), ultraleve e com pointer-events-none para não interferir nos cliques.
 */
export const TufoNeve: React.FC<TufoNeveProps> = ({
  lado = 'direito',
  className = '',
}) => {
  if (lado === 'esquerdo') {
    return (
      <div
        className={`absolute -top-2 left-1.5 pointer-events-none select-none z-10 transition-transform duration-200 group-hover:scale-105 ${className}`}
        aria-hidden="true"
      >
        <svg
          viewBox="0 0 64 22"
          className="w-12 h-4 drop-shadow-[0_2px_3px_rgba(0,0,0,0.12)]"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Sombra / Base azulada de gelo para contraste em fundos claros e escuros */}
          <path
            d="M2 18 C2 18, 5 13, 10 13 C14 13, 16 16, 21 16 C26 16, 28 11, 35 11 C42 11, 46 15, 52 15 C57 15, 60 17, 62 19 C55 21, 10 21, 2 18 Z"
            fill="#CBD5E1"
            className="dark:fill-[#93C5FD]/40"
          />

          {/* Massa fofinha de neve branca pura */}
          <path
            d="M3 16 C3 12, 7 8, 12 8 C14 8, 16 9, 18 10 C20 6, 25 4, 30 4 C36 4, 41 7, 43 11 C46 9, 50 9, 54 11 C58 13, 61 15, 61 17 C52 18.5, 12 18.5, 3 16 Z"
            fill="url(#neveGradienteEsq)"
          />

          {/* Ponto alto de brilho de neve fresca */}
          <ellipse cx="30" cy="7" rx="8" ry="2.2" fill="#FFFFFF" fillOpacity="0.9" />
          <ellipse cx="13" cy="10" rx="4" ry="1.5" fill="#FFFFFF" fillOpacity="0.9" />
          <ellipse cx="52" cy="12" rx="4" ry="1.5" fill="#FFFFFF" fillOpacity="0.9" />

          {/* Gotinha de neve escorrendo levemente */}
          <circle cx="19" cy="18.5" r="1.3" fill="#F8FAFC" />
          <circle cx="41" cy="17.5" r="1.1" fill="#F8FAFC" />

          {/* Brilhozinho cintilante (sparkle) */}
          <path
            d="M28 2.5 L28.8 4 L30.5 4.5 L29 5.3 L29.5 7 L28 5.8 L26.5 7 L27 5.3 L25.5 4.5 L27.2 4 Z"
            fill="#60A5FA"
            opacity="0.85"
          />

          <defs>
            <linearGradient id="neveGradienteEsq" x1="0" y1="0" x2="0" y2="22" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="75%" stopColor="#F1F5F9" />
              <stop offset="100%" stopColor="#E2E8F0" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    );
  }

  // Lado direito (padrão)
  return (
    <div
      className={`absolute -top-2 right-2 pointer-events-none select-none z-10 transition-transform duration-200 group-hover:scale-105 ${className}`}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 68 22"
        className="w-13 h-4 drop-shadow-[0_2px_3px_rgba(0,0,0,0.14)]"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Sombra / Base azulada de gelo para contraste em fundos claros e escuros */}
        <path
          d="M4 19 C7 17, 10 15, 15 15 C21 15, 25 11, 32 11 C39 11, 41 16, 46 16 C51 16, 53 13, 57 13 C62 13, 65 18, 65 18 C58 21, 12 21, 4 19 Z"
          fill="#CBD5E1"
          className="dark:fill-[#93C5FD]/40"
        />

        {/* Massa fofinha de neve branca com curvas volumosas */}
        <path
          d="M6 17 C6 15, 9 13, 13 11 C17 9, 21 9, 24 11 C26 7, 31 4, 37 4 C42 4, 47 6, 49 10 C51 9, 53 8, 55 8 C60 8, 64 12, 64 16 C55 18.5, 15 18.5, 6 17 Z"
          fill="url(#neveGradienteDir)"
        />

        {/* Brilhos de topo da neve */}
        <ellipse cx="37" cy="7" rx="8" ry="2.2" fill="#FFFFFF" fillOpacity="0.95" />
        <ellipse cx="20" cy="12" rx="4" ry="1.5" fill="#FFFFFF" fillOpacity="0.9" />
        <ellipse cx="56" cy="10" rx="3.5" ry="1.4" fill="#FFFFFF" fillOpacity="0.9" />

        {/* Gotinhas/Flocos de neve arredondados escorrendo suavemente */}
        <circle cx="26" cy="17.8" r="1.3" fill="#F8FAFC" />
        <circle cx="48" cy="18.5" r="1.2" fill="#F8FAFC" />

        {/* Brilhozinho cintilante (sparkle) */}
        <path
          d="M41 2 L41.8 3.5 L43.5 4 L42 4.8 L42.5 6.5 L41 5.3 L39.5 6.5 L40 4.8 L38.5 4 L40.2 3.5 Z"
          fill="#60A5FA"
          opacity="0.85"
        />

        <defs>
          <linearGradient id="neveGradienteDir" x1="0" y1="0" x2="0" y2="22" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="75%" stopColor="#F8FAFC" />
            <stop offset="100%" stopColor="#E2E8F0" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
};
