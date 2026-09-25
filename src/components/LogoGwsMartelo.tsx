import React from 'react';

interface LogoGwsMarteloProps {
  className?: string;
  size?: number;
}

/**
 * Logotipo oficial GWS GLOBAL com a letra 'G' e o martelo de licitação/leilão fundidos
 * em um emblema vetorial nítido de alta fidelidade.
 */
export const LogoGwsMartelo: React.FC<LogoGwsMarteloProps> = ({
  className = 'w-10 h-10',
  size,
}) => {
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={size ? { width: size, height: size } : undefined}
      aria-label="Logo GWS - G com Martelo de Licitação"
    >
      <defs>
        {/* Gradiente Dourado Nobre para o Martelo de Licitação */}
        <linearGradient id="gwsGoldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FDE68A" />
          <stop offset="45%" stopColor="#F59E0B" />
          <stop offset="100%" stopColor="#D97706" />
        </linearGradient>

        {/* Gradiente Dourado Metálico Claro para Anéis e Frisos */}
        <linearGradient id="gwsGoldLight" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FFFBEB" />
          <stop offset="50%" stopColor="#FDE68A" />
          <stop offset="100%" stopColor="#F59E0B" />
        </linearGradient>

        {/* Gradiente Azul Marinho Profundo da Identidade GWS */}
        <linearGradient id="gwsNavyBg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0F2C59" />
          <stop offset="100%" stopColor="#071933" />
        </linearGradient>

        {/* Sombra suave interna para dar relevo e profundidade */}
        <filter id="gwsGlow" x="-15%" y="-15%" width="130%" height="130%">
          <feDropShadow dx="0" dy="1.5" stdDeviation="1.5" floodColor="#000000" floodOpacity="0.35" />
        </filter>
      </defs>

      {/* 1. Base / Emblema Quadrado com Cantos Arredondados e Borda Dourada Fina */}
      <rect width="100" height="100" rx="22" fill="url(#gwsNavyBg)" />
      <rect
        width="94"
        height="94"
        x="3"
        y="3"
        rx="19"
        stroke="url(#gwsGoldGrad)"
        strokeWidth="1.6"
        strokeOpacity="0.4"
      />

      {/* 2. LETRA 'G' - Traçado Principal em Branco Alto Contraste */}
      {/* O arco da letra 'G' contorna com elegância desde o topo direito até o encaixe com o martelo */}
      <path
        d="M 77 25 
           C 69.5 16.5, 59 12.5, 49 12.5 
           C 28 12.5, 12.5 28.5, 12.5 49.5 
           C 12.5 70.5, 28 86.5, 49 86.5 
           C 68 86.5, 82 73.5, 84.5 55"
        stroke="#FFFFFF"
        strokeWidth="11"
        strokeLinecap="round"
        strokeLinejoin="round"
        filter="url(#gwsGlow)"
      />

      {/* Linha fina dourada interna no arco do G para acabamento premium */}
      <path
        d="M 74 27 
           C 67 19.5, 58 16, 49 16 
           C 30.5 16, 16 30.5, 16 49.5 
           C 16 68.5, 30.5 83, 49 83 
           C 65.5 83, 78 71.5, 81 55"
        stroke="url(#gwsGoldGrad)"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeOpacity="0.5"
      />

      {/* 3. MARTELO DE LICITAÇÃO / LEILÃO INTEGRADO FORMANDO A BARRA E O INTERIOR DO 'G' */}
      <g id="martelo-gavel" filter="url(#gwsGlow)">
        {/* Cabo do Martelo (Handle) inclinado saindo da cabeça em direção ao interior do G */}
        <path
          d="M 61 51 L 38 74"
          stroke="url(#gwsGoldGrad)"
          strokeWidth="6"
          strokeLinecap="round"
        />
        {/* Pomo esférico torneado na ponta do cabo */}
        <circle cx="36" cy="76" r="4.2" fill="url(#gwsGoldLight)" stroke="#B45309" strokeWidth="1" />
        {/* Detalhe de empunhadura do cabo */}
        <line x1="50" y1="62" x2="47.5" y2="64.5" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" />

        {/* Cabeça do Martelo (Gavel Head) - Barra Horizontal do 'G' */}
        {/* Corpo Cilíndrico Principal */}
        <rect
          x="46"
          y="43.5"
          width="37"
          height="13"
          rx="2.5"
          fill="url(#gwsGoldGrad)"
          stroke="#FFFFFF"
          strokeWidth="1"
        />

        {/* Anel de Latão Dourado / Friso Central do Martelo */}
        <rect
          x="62.5"
          y="42"
          width="6.5"
          height="16"
          rx="1.5"
          fill="url(#gwsGoldLight)"
          stroke="#B45309"
          strokeWidth="0.8"
        />

        {/* Batedor Esquerdo (Face de Batida de Martelo / Ataque da Licitação) */}
        <path
          d="M 46 41 L 41.5 39.5 L 41.5 60.5 L 46 59 Z"
          fill="url(#gwsGoldLight)"
          stroke="#FFFFFF"
          strokeWidth="0.8"
        />

        {/* Batedor Direito (Encaixe integrado com a subida do 'G') */}
        <path
          d="M 83 41 L 87.5 39.5 L 87.5 60.5 L 83 59 Z"
          fill="url(#gwsGoldLight)"
          stroke="#FFFFFF"
          strokeWidth="0.8"
        />

        {/* Faíscas / Efeito de Impacto no Batedor (Símbolo do Martelo Batido / Licitação Homologada) */}
        <circle cx="34" cy="50" r="1.8" fill="#FDE68A" />
        <path d="M 37 43.5 L 32 40" stroke="#FDE68A" strokeWidth="2" strokeLinecap="round" />
        <path d="M 37 56.5 L 32 60" stroke="#FDE68A" strokeWidth="2" strokeLinecap="round" />
      </g>
    </svg>
  );
};
