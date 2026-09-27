import React from 'react';
import logoOficialImg from '../assets/images/gws_global_logo_1790552592538.jpg';

interface LogoGwsMarteloProps {
  className?: string;
  size?: number;
}

/**
 * Logotipo oficial GWS Global:
 * Novo emblema oficial da marca com acabamento cromado 3D e anéis dinâmicos.
 */
export const LogoGwsMartelo: React.FC<LogoGwsMarteloProps> = ({
  className = 'w-10 h-10',
  size,
}) => {
  return (
    <div
      className={`inline-flex items-center justify-center shrink-0 rounded-xl overflow-hidden shadow-xs border border-slate-700/20 bg-[#07172F] ${className}`}
      style={size ? { width: size, height: size } : undefined}
      title="Logo Oficial GWS Global"
    >
      <img
        src={logoOficialImg}
        alt="Logo Oficial GWS Global"
        className="w-full h-full object-cover select-none"
        referrerPolicy="no-referrer"
      />
    </div>
  );
};
