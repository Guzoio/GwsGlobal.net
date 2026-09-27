import React from 'react';
import logoOficialImg from '../assets/images/gws_global_logo_1790552592538.jpg';

interface LogoGwsGlobalProps {
  className?: string;
  size?: number;
  mostrarTexto?: boolean;
  modoImagem?: boolean;
}

/**
 * Logotipo oficial GWS Global:
 * Emblema circular com letra 'G' metálica cromada 3D, 'W' azul marinho e 'S' em fita orbital com frisos prateados.
 */
export const LogoGwsGlobal: React.FC<LogoGwsGlobalProps> = ({
  className = 'w-10 h-10',
  size,
  mostrarTexto = false,
  modoImagem = true,
}) => {
  if (modoImagem) {
    return (
      <div
        className={`inline-flex items-center gap-2.5 ${className}`}
        style={size ? { width: size, height: size } : undefined}
      >
        <div className="relative w-full h-full rounded-xl overflow-hidden shadow-sm border border-slate-700/30 bg-[#07172F] flex items-center justify-center shrink-0">
          <img
            src={logoOficialImg}
            alt="Logo Oficial GWS Global"
            className="w-full h-full object-cover select-none"
            referrerPolicy="no-referrer"
          />
        </div>
        {mostrarTexto && (
          <span className="text-xl font-black tracking-tight text-slate-900 leading-none">
            GWS GLOBAL.net
          </span>
        )}
      </div>
    );
  }

  // Versão SVG Vetorial nítida e transparente
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={size ? { width: size, height: size } : undefined}
      aria-label="Logo Oficial GWS Global"
    >
      <defs>
        {/* Gradiente Cromado / Prata Metálico 3D para a letra 'G' */}
        <linearGradient id="gwsChromeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="25%" stopColor="#E2E8F0" />
          <stop offset="50%" stopColor="#94A3B8" />
          <stop offset="75%" stopColor="#CBD5E1" />
          <stop offset="100%" stopColor="#64748B" />
        </linearGradient>

        <linearGradient id="gwsChromeLight" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="60%" stopColor="#CBD5E1" />
          <stop offset="100%" stopColor="#94A3B8" />
        </linearGradient>

        {/* Gradiente Azul Marinho Profundo */}
        <linearGradient id="gwsNavyBadge" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0B1D3A" />
          <stop offset="100%" stopColor="#040C1A" />
        </linearGradient>

        {/* Filtro de relevo e sombra */}
        <filter id="gwsSombra" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#000000" floodOpacity="0.4" />
        </filter>
      </defs>

      {/* Fundo circular escuro de alto contraste */}
      <circle cx="50" cy="50" r="48" fill="url(#gwsNavyBadge)" />
      <circle cx="50" cy="50" r="47" stroke="url(#gwsChromeGrad)" strokeWidth="1.2" strokeOpacity="0.6" />

      {/* Anéis orbitais dinâmicos */}
      <ellipse
        cx="50"
        cy="50"
        rx="43"
        ry="43"
        stroke="#38BDF8"
        strokeWidth="1"
        strokeOpacity="0.5"
        strokeDasharray="4 2"
      />
      <path
        d="M 20 65 C 15 45, 30 20, 55 14 C 75 10, 88 25, 84 45"
        stroke="url(#gwsChromeLight)"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeOpacity="0.7"
      />

      {/* LETRA 'W' em Azul Marinho de Fundo */}
      <path
        d="M 26 38 L 36 68 L 47 44 L 54 44 L 64 68 L 74 38"
        stroke="#1E3A8A"
        strokeWidth="8"
        strokeLinecap="round"
        strokeLinejoin="round"
        filter="url(#gwsSombra)"
      />
      <path
        d="M 26 38 L 36 68 L 47 44 L 54 44 L 64 68 L 74 38"
        stroke="#60A5FA"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeOpacity="0.8"
      />

      {/* LETRA 'G' Cromada / Prata 3D no Centro */}
      <g filter="url(#gwsSombra)">
        {/* Corpo principal do G */}
        <path
          d="M 68 34 C 62 25, 52 23, 44 24 C 30 27, 22 39, 22 52 C 22 66, 31 77, 46 77 C 58 77, 68 70, 72 58 L 50 58"
          stroke="url(#gwsChromeGrad)"
          strokeWidth="9"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Linha de reflexo de luz no G */}
        <path
          d="M 66 36 C 61 28, 52 26, 45 27 C 33 29, 26 40, 26 52 C 26 64, 34 73, 46 73 C 56 73, 64 67, 68 58 L 52 58"
          stroke="#FFFFFF"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeOpacity="0.9"
        />
      </g>

      {/* LETRA 'S' em Fita Orbital fluindo sobre o G */}
      <path
        d="M 66 22 C 50 16, 36 28, 42 40 C 48 52, 68 48, 70 62 C 72 74, 58 82, 44 80"
        stroke="#0F2C59"
        strokeWidth="7"
        strokeLinecap="round"
        strokeLinejoin="round"
        filter="url(#gwsSombra)"
      />
      <path
        d="M 66 22 C 50 16, 36 28, 42 40 C 48 52, 68 48, 70 62 C 72 74, 58 82, 44 80"
        stroke="url(#gwsChromeLight)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};
