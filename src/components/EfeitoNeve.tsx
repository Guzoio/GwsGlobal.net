import React, { useEffect, useRef } from 'react';

interface EfeitoNeveProps {
  ativo?: boolean;
  densidade?: 'baixa' | 'media' | 'alta';
  modoEscuro?: boolean;
}

interface FlocoNeve {
  x: number;
  y: number;
  raio: number;
  velocidadeY: number;
  velocidadeX: number;
  opacidade: number;
  oscilacao: number;
  fase: number;
}

/**
 * Camada suave de neve caindo otimizada em Canvas 2D.
 * - Leve, suave a 60fps sem sobrecarregar a CPU.
 * - Pausa automaticamente quando a aba do navegador fica inativa para poupar bateria e recursos.
 * - 'pointer-events-none' garante 100% de usabilidade em botões, formulários, tabelas e menus.
 */
export const EfeitoNeve: React.FC<EfeitoNeveProps> = ({
  ativo = true,
  densidade = 'baixa',
  modoEscuro = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!ativo) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let largura = (canvas.width = window.innerWidth);
    let altura = (canvas.height = window.innerHeight);

    const redimensionar = () => {
      if (!canvas) return;
      largura = canvas.width = window.innerWidth;
      altura = canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', redimensionar);

    // Quantidade calibrada para elegância visual sem poluir a leitura de propostas
    const qtdFlocos = densidade === 'baixa' ? 38 : densidade === 'media' ? 65 : 100;

    const flocos: FlocoNeve[] = Array.from({ length: qtdFlocos }, () => ({
      x: Math.random() * largura,
      y: Math.random() * altura,
      raio: Math.random() * 2.5 + 1.2, // 1.2px a 3.7px
      velocidadeY: Math.random() * 0.9 + 0.4, // Queda suave e relaxante
      velocidadeX: (Math.random() - 0.5) * 0.4,
      opacidade: Math.random() * 0.55 + 0.35,
      oscilacao: Math.random() * 1.5 + 0.8,
      fase: Math.random() * Math.PI * 2,
    }));

    let executando = true;

    const desenhar = () => {
      if (!executando) return;

      ctx.clearRect(0, 0, largura, altura);

      for (let i = 0; i < flocos.length; i++) {
        const floco = flocos[i];

        // Atualiza posição com oscilação orgânica do vento
        floco.fase += 0.015;
        floco.y += floco.velocidadeY;
        floco.x += Math.sin(floco.fase) * floco.oscilacao * 0.4 + floco.velocidadeX;

        // Reinicia no topo quando sai da tela
        if (floco.y > altura + 10) {
          floco.y = -10;
          floco.x = Math.random() * largura;
        }
        if (floco.x > largura + 10) {
          floco.x = -10;
        } else if (floco.x < -10) {
          floco.x = largura + 10;
        }

        // Cor adaptada para alto contraste tanto no modo claro quanto escuro
        ctx.beginPath();
        ctx.arc(floco.x, floco.y, floco.raio, 0, Math.PI * 2);

        if (modoEscuro) {
          // No modo escuro: flocos brancos puros com leve brilho suave
          ctx.fillStyle = `rgba(255, 255, 255, ${floco.opacidade})`;
          ctx.shadowBlur = 4;
          ctx.shadowColor = 'rgba(255, 255, 255, 0.6)';
        } else {
          // No modo claro: flocos branco-gelo com contorno/halo sutil azul-inverno para legibilidade perfeita
          ctx.fillStyle = `rgba(240, 246, 255, ${floco.opacidade * 0.95})`;
          ctx.shadowBlur = 3;
          ctx.shadowColor = 'rgba(59, 130, 246, 0.4)';
        }

        ctx.fill();
        ctx.shadowBlur = 0;
      }

      animId = requestAnimationFrame(desenhar);
    };

    desenhar();

    // Pausa animação quando a janela perde foco ou minimiza
    const handleVisibilidade = () => {
      if (document.hidden) {
        executando = false;
        cancelAnimationFrame(animId);
      } else {
        executando = true;
        desenhar();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilidade);

    return () => {
      executando = false;
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', redimensionar);
      document.removeEventListener('visibilitychange', handleVisibilidade);
    };
  }, [ativo, densidade, modoEscuro]);

  if (!ativo) return null;

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-20 w-full h-full select-none"
      style={{ pointerEvents: 'none' }}
      aria-hidden="true"
    />
  );
};
