import React from 'react';

interface LuzesNatalinasProps {
  className?: string;
  ativa?: boolean;
}

/**
 * Fita de mini luzes natalinas (pisca-pisca festivo de luxo)
 * com fio sutil e micro-lâmpadas nas cores clássicas de Natal:
 * Vermelho cereja, Dourado quente, Verde esmeralda e Azul gelo.
 */
export const LuzesNatalinas: React.FC<LuzesNatalinasProps> = ({
  className = '',
  ativa = true,
}) => {
  if (!ativa) return null;

  // Sequência clássica de cores natalinas
  const lampadas = [
    { cor: '#EF4444', brilho: 'rgba(239, 68, 68, 0.7)', atraso: '0s' }, // Vermelho
    { cor: '#F59E0B', brilho: 'rgba(245, 158, 11, 0.7)', atraso: '0.4s' }, // Dourado
    { cor: '#10B981', brilho: 'rgba(16, 185, 129, 0.7)', atraso: '0.8s' }, // Verde
    { cor: '#38BDF8', brilho: 'rgba(56, 189, 248, 0.7)', atraso: '1.2s' }, // Azul gelo
    { cor: '#EF4444', brilho: 'rgba(239, 68, 68, 0.7)', atraso: '0.3s' },
    { cor: '#F59E0B', brilho: 'rgba(245, 158, 11, 0.7)', atraso: '0.9s' },
    { cor: '#10B981', brilho: 'rgba(16, 185, 129, 0.7)', atraso: '0.2s' },
    { cor: '#EC4899', brilho: 'rgba(236, 72, 153, 0.7)', atraso: '0.7s' },
    { cor: '#F59E0B', brilho: 'rgba(245, 158, 11, 0.7)', atraso: '1.1s' },
    { cor: '#10B981', brilho: 'rgba(16, 185, 129, 0.7)', atraso: '0.5s' },
    { cor: '#EF4444', brilho: 'rgba(239, 68, 68, 0.7)', atraso: '1.0s' },
    { cor: '#38BDF8', brilho: 'rgba(56, 189, 248, 0.7)', atraso: '0.6s' },
  ];

  return (
    <div
      className={`w-full overflow-hidden pointer-events-none select-none h-3.5 absolute top-0 left-0 z-10 flex items-center justify-between px-3 ${className}`}
      aria-hidden="true"
    >
      {/* Fio fino conector verde-escuro */}
      <div className="absolute top-1 left-0 right-0 h-[1.5px] bg-emerald-950/40 dark:bg-emerald-900/60" />

      {/* Lâmpadas decorativas distribuídas proporcionalmente */}
      <div className="w-full flex items-center justify-around relative">
        {lampadas.map((lamp, i) => (
          <div key={i} className="flex flex-col items-center relative -top-0.5">
            {/* Suporte da lâmpada (soquete verde escuro) */}
            <div className="w-1.5 h-1 bg-emerald-900 rounded-t-xs" />
            {/* Bulbo em formato de gota com brilho suave e pulsação relaxante */}
            <div
              className="w-2 h-2.5 rounded-full shadow-xs transition-opacity"
              style={{
                backgroundColor: lamp.cor,
                boxShadow: `0 0 6px 1.5px ${lamp.brilho}`,
                animation: `piscaPiscaSuave 2.4s infinite ease-in-out ${lamp.atraso}`,
              }}
            />
          </div>
        ))}
      </div>

      <style>{`
        @keyframes piscaPiscaSuave {
          0%, 100% {
            opacity: 0.85;
            transform: scale(1);
          }
          50% {
            opacity: 0.35;
            transform: scale(0.92);
          }
        }
      `}</style>
    </div>
  );
};

/**
 * Raminho elegante de azevinho com frutinhas vermelhas e folhas verdes
 */
export const RamoAzevinho: React.FC<{ className?: string; size?: number }> = ({
  className = 'w-5 h-5',
  size = 20,
}) => {
  return (
    <svg
      viewBox="0 0 60 60"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`inline-block select-none pointer-events-none drop-shadow-xs ${className}`}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      {/* Folha esquerda de azevinho com pontas espinhosas */}
      <path
        d="M 30 30 C 22 22, 10 24, 8 16 C 14 16, 18 10, 20 4 C 26 8, 28 16, 30 30 Z"
        fill="#15803D"
        stroke="#166534"
        strokeWidth="1"
      />
      {/* Nervura da folha esquerda */}
      <path d="M 20 18 L 14 10" stroke="#4ADE80" strokeWidth="1" strokeLinecap="round" />

      {/* Folha direita */}
      <path
        d="M 30 30 C 38 22, 50 24, 52 16 C 46 16, 42 10, 40 4 C 34 8, 32 16, 30 30 Z"
        fill="#16A34A"
        stroke="#15803D"
        strokeWidth="1"
      />
      {/* Nervura da folha direita */}
      <path d="M 40 18 L 46 10" stroke="#86EFAC" strokeWidth="1" strokeLinecap="round" />

      {/* Folha inferior */}
      <path
        d="M 30 30 C 28 42, 20 48, 22 56 C 28 52, 34 52, 40 56 C 38 48, 32 42, 30 30 Z"
        fill="#15803D"
        stroke="#166534"
        strokeWidth="1"
      />

      {/* Frutinhas vermelhas (berrries) de azevinho com brilho */}
      <g>
        <circle cx="26" cy="31" r="5" fill="#DC2626" />
        <circle cx="24.5" cy="29.5" r="1.5" fill="#FFFFFF" fillOpacity="0.8" />

        <circle cx="34" cy="31" r="5" fill="#EF4444" />
        <circle cx="32.5" cy="29.5" r="1.5" fill="#FFFFFF" fillOpacity="0.8" />

        <circle cx="30" cy="24" r="5" fill="#B91C1C" />
        <circle cx="28.5" cy="22.5" r="1.5" fill="#FFFFFF" fillOpacity="0.8" />
      </g>
    </svg>
  );
};
