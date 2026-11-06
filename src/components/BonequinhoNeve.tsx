import React from 'react';

interface BonequinhoNeveProps {
  className?: string;
  mensagem?: string;
  size?: number;
  tilt?: number;
}

/**
 * Bonequinho de Neve festivo em vetor (SVG) que se apoia com charme em cima
 * da tabela de pré-visualização da proposta, com gorro/cartola natalina, cachecol
 * vermelho e bracinhos de graveto acenando.
 */
export const BonequinhoNeve: React.FC<BonequinhoNeveProps> = ({
  className = '',
  mensagem = 'Boas Festas! ⛄',
  size,
  tilt = 0,
}) => {
  return (
    <div
      className={`group relative inline-flex flex-col items-center select-none pointer-events-auto transition-transform hover:scale-105 duration-200 ${className}`}
      title={mensagem}
      style={{
        transform: tilt ? `rotate(${tilt}deg)` : undefined,
      }}
    >
      {/* Balãozinho de saudação festiva sutil ao passar o mouse */}
      <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none absolute -top-8 bg-slate-900/90 text-white text-[10px] font-bold py-0.5 px-2 rounded-full whitespace-nowrap shadow-md border border-white/20 z-20">
        {mensagem}
      </div>

      <svg
        viewBox="0 0 100 110"
        className={size ? 'drop-shadow-[0_4px_6px_rgba(0,0,0,0.18)]' : 'w-16 h-18 sm:w-20 sm:h-22 drop-shadow-[0_4px_6px_rgba(0,0,0,0.18)]'}
        style={size ? { width: size, height: (size * 110) / 100 } : undefined}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Gradiente da cabeça e corpo com sombra azul-gelo sutil */}
          <radialGradient id="neveBonecoCorpo" cx="35%" cy="30%" r="70%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="70%" stopColor="#F1F5F9" />
            <stop offset="100%" stopColor="#CBD5E1" />
          </radialGradient>

          <radialGradient id="neveBonecoCabeca" cx="35%" cy="30%" r="70%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="75%" stopColor="#F8FAFC" />
            <stop offset="100%" stopColor="#DCE7F5" />
          </radialGradient>

          {/* Gradiente da Cartola */}
          <linearGradient id="cartolaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1E293B" />
            <stop offset="100%" stopColor="#0F172A" />
          </linearGradient>

          {/* Gradiente da Faixa Vermelha */}
          <linearGradient id="faixaVermelha" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#DC2626" />
            <stop offset="100%" stopColor="#991B1B" />
          </linearGradient>
        </defs>

        {/* --- BASE DE NEVE ONDE ELE FICA SENTADO --- */}
        <ellipse cx="50" cy="102" rx="36" ry="6" fill="#E2E8F0" />
        <ellipse cx="50" cy="101" rx="34" ry="5" fill="#FFFFFF" />

        {/* --- BRAÇO ESQUERDO (Graveto apoiado) --- */}
        <path
          d="M26 68 L8 60 M12 62 L9 56"
          stroke="#78350F"
          strokeWidth="3"
          strokeLinecap="round"
        />

        {/* --- BRAÇO DIREITO (Graveto acenando alegremente) --- */}
        <g className="origin-[74px_68px] motion-safe:animate-[wiggle_3s_ease-in-out_infinite]">
          <path
            d="M74 68 L92 50 M86 54 L94 58 M88 52 L91 46"
            stroke="#78350F"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </g>

        {/* --- BOLA DE BAIXO (CORPO DO BONECO) --- */}
        <circle cx="50" cy="78" r="26" fill="url(#neveBonecoCorpo)" />

        {/* Botões de carvão na barriga */}
        <circle cx="50" cy="69" r="2.2" fill="#1E293B" />
        <circle cx="50" cy="77" r="2.4" fill="#1E293B" />
        <circle cx="50" cy="85" r="2.2" fill="#1E293B" />

        {/* --- BOLA DE CIMA (CABEÇA DO BONECO) --- */}
        <circle cx="50" cy="42" r="18" fill="url(#neveBonecoCabeca)" />

        {/* Olhinhos de carvão pretos brilhantes */}
        <circle cx="43" cy="38" r="2.2" fill="#0F172A" />
        <circle cx="43.8" cy="37.2" r="0.7" fill="#FFFFFF" />

        <circle cx="57" cy="38" r="2.2" fill="#0F172A" />
        <circle cx="57.8" cy="37.2" r="0.7" fill="#FFFFFF" />

        {/* Boquinha de pedrinhas sorridente */}
        <circle cx="41" cy="48" r="1" fill="#334155" />
        <circle cx="45" cy="50" r="1" fill="#334155" />
        <circle cx="50" cy="51" r="1.1" fill="#334155" />
        <circle cx="55" cy="50" r="1" fill="#334155" />
        <circle cx="59" cy="48" r="1" fill="#334155" />

        {/* Nariz de Cenoura alaranjada 3D */}
        <polygon
          points="49,41 49,45 66,44"
          fill="#F97316"
          stroke="#EA580C"
          strokeWidth="0.5"
          strokeLinejoin="round"
        />
        {/* Ranhuras na cenoura */}
        <line x1="53" y1="42.5" x2="53" y2="44.2" stroke="#EA580C" strokeWidth="0.8" />
        <line x1="58" y1="43" x2="58" y2="44.5" stroke="#EA580C" strokeWidth="0.8" />

        {/* Bochechas coradas vermelhas (blush natalino) */}
        <ellipse cx="38" cy="44" rx="2.5" ry="1.5" fill="#FCA5A5" fillOpacity="0.6" />
        <ellipse cx="62" cy="44" rx="2.5" ry="1.5" fill="#FCA5A5" fillOpacity="0.6" />

        {/* --- CACHECOL VERMELHO FESTIVO EM VOLTA DO PESCOÇO --- */}
        <path
          d="M34 54 C34 54, 42 58, 50 58 C58 58, 66 54, 66 54 C68 57, 66 61, 50 62 C34 61, 32 57, 34 54 Z"
          fill="url(#faixaVermelha)"
          stroke="#991B1B"
          strokeWidth="0.5"
        />
        {/* Ponta do cachecol caindo para baixo com franjas */}
        <path
          d="M54 58 L52 74 C52 76, 58 76, 60 74 L61 58 Z"
          fill="#DC2626"
        />
        {/* Listras brancas decorativas no cachecol */}
        <path d="M52.5 64 L60.5 64" stroke="#FFFFFF" strokeWidth="1.5" />
        <path d="M52.2 69 L59.8 69" stroke="#FFFFFF" strokeWidth="1.5" />
        {/* Franjas na ponta */}
        <line x1="53" y1="74" x2="53" y2="77" stroke="#DC2626" strokeWidth="1.2" />
        <line x1="56" y1="74" x2="56" y2="77" stroke="#FFFFFF" strokeWidth="1.2" />
        <line x1="59" y1="74" x2="59" y2="77" stroke="#DC2626" strokeWidth="1.2" />

        {/* --- CARTOLA ELEGANTE COM FAIXA VERMELHA E AZEVINHO --- */}
        {/* Aba da cartola */}
        <ellipse cx="50" cy="27" rx="24" ry="4.5" fill="url(#cartolaGrad)" />
        <ellipse cx="50" cy="26" rx="22" ry="3.5" fill="#334155" />

        {/* Copa da cartola */}
        <path
          d="M35 25 L37 8 C37 6, 63 6, 63 8 L65 25 Z"
          fill="url(#cartolaGrad)"
        />
        {/* Topo da cartola com neve acumulada */}
        <ellipse cx="50" cy="8" rx="13" ry="2.5" fill="#334155" />
        <path
          d="M37 8 C37 8, 43 5, 50 5 C57 5, 63 8, 63 8 C60 10, 40 10, 37 8 Z"
          fill="#FFFFFF"
        />

        {/* Faixa vermelha da cartola */}
        <path
          d="M35.5 24 L36 19 C42 20.5, 58 20.5, 64 19 L64.5 24 Z"
          fill="url(#faixaVermelha)"
        />

        {/* Folhinhas de azevinho e bolinhas vermelhas na faixa */}
        <ellipse cx="40" cy="20" rx="3" ry="1.5" fill="#15803D" transform="rotate(-25 40 20)" />
        <ellipse cx="42" cy="19" rx="3" ry="1.5" fill="#16A34A" transform="rotate(30 42 19)" />
        <circle cx="40.5" cy="21" r="1.3" fill="#EF4444" />
        <circle cx="42.5" cy="21" r="1.3" fill="#DC2626" />
      </svg>
    </div>
  );
};
