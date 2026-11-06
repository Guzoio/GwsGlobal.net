import React from 'react';

interface RenaNatalinaProps {
  className?: string;
  size?: number;
  mensagem?: string;
  pose?: 'head' | 'peeking';
  tilt?: number;
}

/**
 * Rena do Papai Noel (Rudolph) vetorial em alta definição.
 * Possui chifres estilizados com mini bolinhas natalinas,
 * nariz vermelho luminoso do Rudolph, orelhas aveludadas,
 * coleira festiva com guizo dourado.
 */
export const RenaNatalina: React.FC<RenaNatalinaProps> = ({
  className = '',
  size = 48,
  mensagem = 'Rudolph passando para desejar Boas Festas! 🦌✨',
  pose = 'head',
  tilt = 0,
}) => {
  return (
    <div
      className={`group relative inline-flex flex-col items-center select-none pointer-events-auto transition-transform hover:scale-110 duration-200 cursor-pointer ${className}`}
      title={mensagem}
      style={{
        transform: `rotate(${tilt}deg)`,
      }}
    >
      {/* Balãozinho festivo com a saudação de Natal */}
      <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none absolute -top-8 bg-slate-900/90 text-white text-[10px] font-bold py-0.5 px-2 rounded-full whitespace-nowrap shadow-md border border-white/20 z-20">
        {mensagem}
      </div>

      <svg
        viewBox="0 0 100 110"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ width: size, height: (size * 110) / 100 }}
        className="drop-shadow-md select-none"
        aria-hidden="true"
      >
        <defs>
          {/* Pelagem da Rena (Caramelo aveludado) */}
          <linearGradient id="renaPeloCorpo" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#C28854" />
            <stop offset="50%" stopColor="#A76837" />
            <stop offset="100%" stopColor="#874C23" />
          </linearGradient>

          {/* Focinho mais clarinho */}
          <linearGradient id="renaFocinho" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#E9D5BA" />
            <stop offset="100%" stopColor="#CEAD89" />
          </linearGradient>

          {/* Chifres da Rena (Madeira suave) */}
          <linearGradient id="renaChifres" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#9C6644" />
            <stop offset="100%" stopColor="#6F452A" />
          </linearGradient>

          {/* Nariz Vermelho Brilhante do Rudolph */}
          <radialGradient id="narizRudolph" cx="35%" cy="35%" r="65%">
            <stop offset="0%" stopColor="#FF6B6B" />
            <stop offset="35%" stopColor="#EF4444" />
            <stop offset="75%" stopColor="#DC2626" />
            <stop offset="100%" stopColor="#991B1B" />
          </radialGradient>

          {/* Guizo Dourado */}
          <radialGradient id="guizoDourado" cx="35%" cy="30%" r="70%">
            <stop offset="0%" stopColor="#FEF08A" />
            <stop offset="50%" stopColor="#FACC15" />
            <stop offset="85%" stopColor="#CA8A04" />
            <stop offset="100%" stopColor="#854D0E" />
          </radialGradient>

          {/* Brilho suave emitido pelo nariz */}
          <filter id="brilhoNariz" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="2.5" result="glow" />
            <feComposite in="SourceGraphic" in2="glow" operator="over" />
          </filter>
        </defs>

        {/* --- CHIFRES (Antlers) --- */}
        {/* Chifre Esquerdo com galhos */}
        <path
          d="M 38 42 C 34 26, 22 18, 14 16 M 22 24 C 16 26, 12 34, 14 38 M 28 32 C 22 34, 20 40, 22 44"
          stroke="url(#renaChifres)"
          strokeWidth="4.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Chifre Direito com galhos */}
        <path
          d="M 62 42 C 66 26, 78 18, 86 16 M 78 24 C 84 26, 88 34, 86 38 M 72 32 C 78 34, 80 40, 78 44"
          stroke="url(#renaChifres)"
          strokeWidth="4.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Bolinhas coloridas de natal penduradas no chifre esquerdo */}
        <circle cx="14" cy="18" r="3" fill="#3B82F6" stroke="#FFFFFF" strokeWidth="0.8" />
        <circle cx="14" cy="38" r="2.5" fill="#10B981" stroke="#FFFFFF" strokeWidth="0.6" />

        {/* Bolinhas no chifre direito */}
        <circle cx="86" cy="18" r="3" fill="#EAB308" stroke="#FFFFFF" strokeWidth="0.8" />
        <circle cx="86" cy="38" r="2.5" fill="#EC4899" stroke="#FFFFFF" strokeWidth="0.6" />

        {/* --- ORELHAS DA RENA --- */}
        {/* Orelha Esquerda */}
        <path
          d="M 34 46 C 20 45, 12 55, 18 64 C 24 64, 30 58, 34 50 Z"
          fill="url(#renaPeloCorpo)"
        />
        <path
          d="M 30 48 C 22 48, 17 54, 20 60 C 24 60, 28 56, 30 50 Z"
          fill="#F5D0C5"
        />

        {/* Orelha Direita */}
        <path
          d="M 66 46 C 80 45, 88 55, 82 64 C 76 64, 70 58, 66 50 Z"
          fill="url(#renaPeloCorpo)"
        />
        <path
          d="M 70 48 C 78 48, 83 54, 80 60 C 76 60, 72 56, 70 50 Z"
          fill="#F5D0C5"
        />

        {/* --- CABEÇA DA RENA --- */}
        <ellipse cx="50" cy="56" rx="22" ry="24" fill="url(#renaPeloCorpo)" />

        {/* Topete de pelos no topo da cabeça */}
        <path
          d="M 44 34 Q 50 30, 52 35 Q 56 31, 56 36 Q 48 38, 44 34 Z"
          fill="#874C23"
        />

        {/* Focinho arredondado */}
        <ellipse cx="50" cy="68" rx="16" ry="13" fill="url(#renaFocinho)" />

        {/* Olhos meigos pretos com brilho */}
        <circle cx="41" cy="50" r="3.2" fill="#0F172A" />
        <circle cx="42" cy="49" r="1.1" fill="#FFFFFF" />

        <circle cx="59" cy="50" r="3.2" fill="#0F172A" />
        <circle cx="60" cy="49" r="1.1" fill="#FFFFFF" />

        {/* Bochechinhas coradinhas */}
        <circle cx="34" cy="58" r="3.5" fill="#F87171" opacity="0.5" />
        <circle cx="66" cy="58" r="3.5" fill="#F87171" opacity="0.5" />

        {/* Boquinha sorridente */}
        <path
          d="M 46 76 Q 50 79, 54 76"
          stroke="#5C3317"
          strokeWidth="1.8"
          strokeLinecap="round"
        />

        {/* --- NARIZ LUMINOSO DO RUDOLPH --- */}
        <g filter="url(#brilhoNariz)" className="animate-pulse">
          <ellipse cx="50" cy="64" rx="7.5" ry="6" fill="url(#narizRudolph)" />
          {/* Ponto de brilho de vidro */}
          <ellipse cx="48" cy="62" rx="2.5" ry="1.6" fill="#FFFFFF" opacity="0.8" />
        </g>

        {/* --- COLEIRA DE NATAL COM GUIZO DOURADO --- */}
        {pose === 'head' && (
          <g>
            {/* Faixa vermelha da coleira */}
            <path
              d="M 32 82 Q 50 90, 68 82 Q 68 87, 50 94 Q 32 87, 32 82 Z"
              fill="#DC2626"
              stroke="#991B1B"
              strokeWidth="0.8"
            />
            {/* Guizo central dourado */}
            <circle cx="50" cy="94" r="5" fill="url(#guizoDourado)" stroke="#B45309" strokeWidth="0.8" />
            {/* Fenda do guizo */}
            <circle cx="50" cy="95.5" r="1" fill="#451A03" />
            <line x1="47.5" y1="95.5" x2="52.5" y2="95.5" stroke="#451A03" strokeWidth="0.8" />
          </g>
        )}

        {/* Patinhas apoiadas se for pose peeking */}
        {pose === 'peeking' && (
          <g>
            <ellipse cx="32" cy="88" rx="7" ry="5" fill="url(#renaPeloCorpo)" stroke="#6F452A" strokeWidth="1" />
            <ellipse cx="68" cy="88" rx="7" ry="5" fill="url(#renaPeloCorpo)" stroke="#6F452A" strokeWidth="1" />
          </g>
        )}
      </svg>
    </div>
  );
};
