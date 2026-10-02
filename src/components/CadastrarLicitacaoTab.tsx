import React, { useState, useEffect } from 'react';
import { PlusCircle, Building2, Calendar, FileText, User } from 'lucide-react';
import { ModalidadeLic, Licitacao } from '../types';

interface CadastrarLicitacaoTabProps {
  onCadastrar: (novaLic: Omit<Licitacao, 'id'>) => void;
  onSucesso: (idCriado: number) => void;
  responsaveis?: string[];
  onAdicionarResponsavel?: (nome: string) => boolean;
}

const MODALIDADES: ModalidadeLic[] = [
  'Pregão Eletrônico',
  'Dispensa Eletrônica',
  'Concorrência Eletrônica',
  'Leilão Eletrônico',
];

export const CadastrarLicitacaoTab: React.FC<CadastrarLicitacaoTabProps> = ({
  onCadastrar,
  responsaveis = ['Gustavo', 'Victor'],
  onAdicionarResponsavel,
}) => {
  const dataHojePadrao = new Date().toLocaleDateString('pt-BR');

  const [orgao, setOrgao] = useState('');
  const [processo, setProcesso] = useState('');
  const [modalidade, setModalidade] = useState<ModalidadeLic>('Pregão Eletrônico');
  const [dataCadastro, setDataCadastro] = useState(dataHojePadrao);
  const [responsavelSelecionado, setResponsavelSelecionado] = useState<string>(
    responsaveis[0] || 'Gustavo'
  );
  const [isModoOutro, setIsModoOutro] = useState(false);
  const [responsavelCustom, setResponsavelCustom] = useState('');
  const [erro, setErro] = useState('');

  // Sincroniza se a lista de responsáveis for atualizada externamente
  useEffect(() => {
    if (!isModoOutro && !responsaveis.includes(responsavelSelecionado) && responsaveis.length > 0) {
      setResponsavelSelecionado(responsaveis[0]);
    }
  }, [responsaveis, isModoOutro, responsavelSelecionado]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgao.trim() || !processo.trim()) {
      setErro('Preencha os campos obrigatórios (Órgão Público e Processo/Pregão).');
      return;
    }

    let responsavelFinal = responsavelSelecionado;
    if (isModoOutro) {
      const nomeDigitado = responsavelCustom.trim();
      if (!nomeDigitado) {
        setErro('Por favor, informe o nome do responsável.');
        return;
      }
      responsavelFinal = nomeDigitado;
      if (onAdicionarResponsavel) {
        onAdicionarResponsavel(nomeDigitado);
      }
    }

    setErro('');

    onCadastrar({
      orgao: orgao.trim(),
      processo_pregao: processo.trim(),
      modalidade,
      data_cadastro: dataCadastro || dataHojePadrao,
      responsavel: responsavelFinal,
    });

    // Reset form
    setOrgao('');
    setProcesso('');
    setResponsavelCustom('');
    setIsModoOutro(false);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header card */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-2xs">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <PlusCircle className="w-5 h-5 text-[#0F2C59]" />
          Cadastrar Nova Licitação / Processo
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Registre o edital ou órgão licitante para gerenciar itens, calcular totais e emitir a proposta comercial timbrada.
        </p>
      </div>

      {/* Formulário Principal */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-2xs">
        {erro && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs font-medium text-rose-700">
            {erro}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Órgão Público Licitante *
            </label>
            <div className="relative">
              <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={orgao}
                onChange={e => setOrgao(e.target.value)}
                placeholder="Ex: Tribunal de Justiça de São Paulo / Prefeitura Municipal"
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#0F2C59]/20 focus:border-[#0F2C59]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Número do Processo / Pregão *
              </label>
              <div className="relative">
                <FileText className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={processo}
                  onChange={e => setProcesso(e.target.value)}
                  placeholder="Ex: Pregão Eletrônico nº 055/2026"
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#0F2C59]/20 focus:border-[#0F2C59]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Modalidade de Licitação *
              </label>
              <select
                value={modalidade}
                onChange={e => setModalidade(e.target.value as ModalidadeLic)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#0F2C59]/20 focus:border-[#0F2C59] cursor-pointer"
              >
                {MODALIDADES.map(m => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Data de Cadastro (DD/MM/AAAA)
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={dataCadastro}
                  onChange={e => setDataCadastro(e.target.value)}
                  placeholder="24/09/2026"
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#0F2C59]/20 focus:border-[#0F2C59] font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Quem fez a licitação? (Responsável) *
              </label>
              <div className="flex flex-wrap items-center gap-1.5">
                {responsaveis.map(resp => {
                  const selecionado = !isModoOutro && responsavelSelecionado === resp;
                  return (
                    <button
                      key={resp}
                      type="button"
                      onClick={() => {
                        setIsModoOutro(false);
                        setResponsavelSelecionado(resp);
                      }}
                      className={`py-1.5 px-3 text-xs font-semibold rounded-lg border flex items-center gap-1.5 transition-colors cursor-pointer ${
                        selecionado
                          ? resp === 'Gustavo'
                            ? 'bg-blue-50 text-blue-900 border-blue-400 shadow-2xs font-bold'
                            : resp === 'Victor'
                            ? 'bg-emerald-50 text-emerald-900 border-emerald-400 shadow-2xs font-bold'
                            : 'bg-purple-50 text-purple-900 border-purple-400 shadow-2xs font-bold'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <User className="w-3.5 h-3.5" />
                      {resp}
                    </button>
                  );
                })}

                <button
                  type="button"
                  onClick={() => setIsModoOutro(true)}
                  className={`py-1.5 px-3 text-xs font-semibold rounded-lg border flex items-center gap-1 transition-colors cursor-pointer ${
                    isModoOutro
                      ? 'bg-[#0F2C59] text-white border-[#0F2C59] shadow-2xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  + Outro...
                </button>
              </div>

              {isModoOutro && (
                <div className="mt-2 animate-in fade-in duration-150">
                  <input
                    type="text"
                    required
                    autoFocus
                    value={responsavelCustom}
                    onChange={e => setResponsavelCustom(e.target.value)}
                    placeholder="Digite o nome do novo responsável..."
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#0F2C59]/20 focus:border-[#0F2C59]"
                  />
                </div>
              )}
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <button
              type="submit"
              className="px-5 py-2.5 bg-[#0F2C59] hover:bg-[#163c78] dark:bg-blue-600 dark:hover:bg-blue-500 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer flex items-center gap-2"
            >
              <PlusCircle className="w-4 h-4 text-amber-400" />
              Salvar Licitação
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
