import React, { useState } from 'react';
import {
  Upload,
  Image as ImageIcon,
  CheckCircle2,
  Trash2,
  RotateCcw,
  Sparkles,
  Sliders,
  FileCheck,
  Building2,
  Eye,
  FileText,
  CreditCard,
  UserCheck,
  Edit3,
  PenTool,
  Calendar,
  Clock,
  ShieldCheck,
  MapPin,
  Globe,
  Percent,
} from 'lucide-react';
import { PapelTimbradoConfig } from '../types';
import { TIMBRADO_PADRAO, gerarAssinaturaPadrao } from '../utils/storage';
import { formatarDataExtensoPtBr } from '../utils/numberToWordsPtBr';

interface PapelTimbradoTabProps {
  config: PapelTimbradoConfig;
  onSalvarConfig: (novaConfig: PapelTimbradoConfig) => void;
  onVisualizarPdf: () => void;
}

export const PapelTimbradoTab: React.FC<PapelTimbradoTabProps> = ({
  config,
  onSalvarConfig,
  onVisualizarPdf,
}) => {
  // Dados Oficiais da Empresa (exatos da imagem do usuário)
  const [razaoSocial, setRazaoSocial] = useState<string>(config.razaoSocial || TIMBRADO_PADRAO.razaoSocial);
  const [cnpj, setCnpj] = useState<string>(config.cnpj || TIMBRADO_PADRAO.cnpj);
  const [inscricaoEstadual, setInscricaoEstadual] = useState<string>(config.inscricaoEstadual || TIMBRADO_PADRAO.inscricaoEstadual);
  const [endereco, setEndereco] = useState<string>(config.endereco || TIMBRADO_PADRAO.endereco);
  const [telefone, setTelefone] = useState<string>(config.telefone || TIMBRADO_PADRAO.telefone);
  const [email, setEmail] = useState<string>(config.email || TIMBRADO_PADRAO.email);
  const [banco, setBanco] = useState<string>(config.banco || TIMBRADO_PADRAO.banco);
  const [agencia, setAgencia] = useState<string>(config.agencia || TIMBRADO_PADRAO.agencia);
  const [contaCorrente, setContaCorrente] = useState<string>(config.contaCorrente || TIMBRADO_PADRAO.contaCorrente);

  // Representante Legal (exatos da imagem do usuário)
  const [nomeRepresentante, setNomeRepresentante] = useState<string>(config.nomeRepresentante || TIMBRADO_PADRAO.nomeRepresentante);
  const [rgRepresentante, setRgRepresentante] = useState<string>(config.rgRepresentante || TIMBRADO_PADRAO.rgRepresentante);
  const [cpfRepresentante, setCpfRepresentante] = useState<string>(config.cpfRepresentante || TIMBRADO_PADRAO.cpfRepresentante);
  const [enderecoRepresentante, setEnderecoRepresentante] = useState<string>(config.enderecoRepresentante || TIMBRADO_PADRAO.enderecoRepresentante);

  // 2º Representante Legal (Opcional)
  const [nomeRepresentante2, setNomeRepresentante2] = useState<string>(config.nomeRepresentante2 || '');
  const [rgRepresentante2, setRgRepresentante2] = useState<string>(config.rgRepresentante2 || '');
  const [cpfRepresentante2, setCpfRepresentante2] = useState<string>(config.cpfRepresentante2 || '');
  const [enderecoRepresentante2, setEnderecoRepresentante2] = useState<string>(config.enderecoRepresentante2 || '');

  // Prazos, Declaração Trabalhista & Data de Emissão (após tabela e valor por extenso)
  const [prazoEntrega, setPrazoEntrega] = useState<string>(
    config.prazoEntrega || TIMBRADO_PADRAO.prazoEntrega || 'Conforme Aviso de Dispensa Eletrônica e Termo de Referência.'
  );
  const [prazoValidade, setPrazoValidade] = useState<string>(
    config.prazoValidade || TIMBRADO_PADRAO.prazoValidade || '90 Dias'
  );
  const [declaracaoTrabalhista, setDeclaracaoTrabalhista] = useState<string>(
    config.declaracaoTrabalhista || TIMBRADO_PADRAO.declaracaoTrabalhista || 'Declaro que a proposta apresentada compreende a integralidade dos custos para atendimento dos direitos trabalhistas assegurados na Constituição Federal, nas leis trabalhistas, nas normas infralegais, nas convenções coletivas de trabalho e nos termos de ajustamento de conduta vigentes na data de entrega das propostas.'
  );
  const [cidadeEmissao, setCidadeEmissao] = useState<string>(
    config.cidadeEmissao || TIMBRADO_PADRAO.cidadeEmissao || 'Timóteo - MG'
  );
  const [dataEmissao, setDataEmissao] = useState<string>(
    config.dataEmissao || TIMBRADO_PADRAO.dataEmissao || new Date().toISOString().split('T')[0]
  );

  // Imagens das Assinaturas dos Responsáveis
  const [assinatura, setAssinatura] = useState<string>(
    config.assinaturaImagem !== undefined ? config.assinaturaImagem : (TIMBRADO_PADRAO.assinaturaImagem || '')
  );
  const [assinatura2, setAssinatura2] = useState<string>(
    config.assinaturaImagem2 !== undefined ? config.assinaturaImagem2 : (TIMBRADO_PADRAO.assinaturaImagem2 || '')
  );

  // Imagens de Cabeçalho e Rodapé
  const [cabecalho, setCabecalho] = useState<string>(config.cabecalhoImagem || '');
  const [rodape, setRodape] = useState<string>(config.rodapeImagem || '');
  const [alturaCabecalho, setAlturaCabecalho] = useState<number>(config.alturaCabecalhoMm || 28);
  const [alturaRodape, setAlturaRodape] = useState<number>(config.alturaRodapeMm || 18);

  // Percentual de Imposto (Para Análise de Lucro)
  const [percentualImposto, setPercentualImposto] = useState<number>(
    config.percentualImposto !== undefined ? config.percentualImposto : (TIMBRADO_PADRAO.percentualImposto ?? 10.00)
  );

  const [modoEdicao, setModoEdicao] = useState<boolean>(false);
  const [salvoFeedback, setSalvoFeedback] = useState<boolean>(false);

  // Salva no storage e avisa
  const salvarDados = (alteracoes?: Partial<PapelTimbradoConfig>) => {
    const atualizada: PapelTimbradoConfig = {
      razaoSocial: alteracoes?.razaoSocial ?? razaoSocial,
      cnpj: alteracoes?.cnpj ?? cnpj,
      inscricaoEstadual: alteracoes?.inscricaoEstadual ?? inscricaoEstadual,
      endereco: alteracoes?.endereco ?? endereco,
      telefone: alteracoes?.telefone ?? telefone,
      email: alteracoes?.email ?? email,
      banco: alteracoes?.banco ?? banco,
      agencia: alteracoes?.agencia ?? agencia,
      contaCorrente: alteracoes?.contaCorrente ?? contaCorrente,
      nomeRepresentante: alteracoes?.nomeRepresentante ?? nomeRepresentante,
      rgRepresentante: alteracoes?.rgRepresentante ?? rgRepresentante,
      cpfRepresentante: alteracoes?.cpfRepresentante ?? cpfRepresentante,
      enderecoRepresentante: alteracoes?.enderecoRepresentante ?? enderecoRepresentante,
      nomeRepresentante2: alteracoes?.nomeRepresentante2 ?? nomeRepresentante2,
      rgRepresentante2: alteracoes?.rgRepresentante2 ?? rgRepresentante2,
      cpfRepresentante2: alteracoes?.cpfRepresentante2 ?? cpfRepresentante2,
      enderecoRepresentante2: alteracoes?.enderecoRepresentante2 ?? enderecoRepresentante2,
      prazoEntrega: alteracoes?.prazoEntrega ?? prazoEntrega,
      prazoValidade: alteracoes?.prazoValidade ?? prazoValidade,
      declaracaoTrabalhista: alteracoes?.declaracaoTrabalhista ?? declaracaoTrabalhista,
      cidadeEmissao: alteracoes?.cidadeEmissao ?? cidadeEmissao,
      dataEmissao: alteracoes?.dataEmissao ?? dataEmissao,
      assinaturaImagem: alteracoes?.assinaturaImagem ?? assinatura,
      assinaturaImagem2: alteracoes?.assinaturaImagem2 ?? assinatura2,
      cabecalhoImagem: alteracoes?.cabecalhoImagem ?? cabecalho,
      rodapeImagem: alteracoes?.rodapeImagem ?? rodape,
      alturaCabecalhoMm: alteracoes?.alturaCabecalhoMm ?? alturaCabecalho,
      alturaRodapeMm: alteracoes?.alturaRodapeMm ?? alturaRodape,
      nomeEmpresa: alteracoes?.razaoSocial ?? razaoSocial,
      telefoneEmail: `${alteracoes?.telefone ?? telefone} | ${alteracoes?.email ?? email}`,
      percentualImposto: alteracoes?.percentualImposto !== undefined ? alteracoes.percentualImposto : percentualImposto,
    };
    onSalvarConfig(atualizada);
    setSalvoFeedback(true);
    setTimeout(() => setSalvoFeedback(false), 2500);
  };

  // Restaura dados idênticos aos da imagem enviada pelo usuário
  const handleRestaurarDadosImagem = () => {
    setRazaoSocial(TIMBRADO_PADRAO.razaoSocial);
    setCnpj(TIMBRADO_PADRAO.cnpj);
    setInscricaoEstadual(TIMBRADO_PADRAO.inscricaoEstadual);
    setEndereco(TIMBRADO_PADRAO.endereco);
    setTelefone(TIMBRADO_PADRAO.telefone);
    setEmail(TIMBRADO_PADRAO.email);
    setBanco(TIMBRADO_PADRAO.banco);
    setAgencia(TIMBRADO_PADRAO.agencia);
    setContaCorrente(TIMBRADO_PADRAO.contaCorrente);
    setNomeRepresentante(TIMBRADO_PADRAO.nomeRepresentante);
    setRgRepresentante(TIMBRADO_PADRAO.rgRepresentante);
    setCpfRepresentante(TIMBRADO_PADRAO.cpfRepresentante);
    setEnderecoRepresentante(TIMBRADO_PADRAO.enderecoRepresentante);
    setNomeRepresentante2('');
    setRgRepresentante2('');
    setCpfRepresentante2('');
    setEnderecoRepresentante2('');
    setPrazoEntrega(TIMBRADO_PADRAO.prazoEntrega || 'Conforme Aviso de Dispensa Eletrônica e Termo de Referência.');
    setPrazoValidade(TIMBRADO_PADRAO.prazoValidade || '90 Dias');
    setDeclaracaoTrabalhista(TIMBRADO_PADRAO.declaracaoTrabalhista || '');
    setCidadeEmissao(TIMBRADO_PADRAO.cidadeEmissao || 'Timóteo - MG');
    setDataEmissao(new Date().toISOString().split('T')[0]);
    setAssinatura(TIMBRADO_PADRAO.assinaturaImagem || '');
    setAssinatura2('');
    setPercentualImposto(TIMBRADO_PADRAO.percentualImposto ?? 10.00);

    salvarDados(TIMBRADO_PADRAO);
  };

  // Upload da Imagem da Assinatura 1
  const handleUploadAssinatura = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setAssinatura(dataUrl);
      salvarDados({ assinaturaImagem: dataUrl });
    };
    reader.readAsDataURL(file);
  };

  // Upload da Imagem da Assinatura 2
  const handleUploadAssinatura2 = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setAssinatura2(dataUrl);
      salvarDados({ assinaturaImagem2: dataUrl });
    };
    reader.readAsDataURL(file);
  };

  // Upload do Cabeçalho
  const handleUploadCabecalho = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setCabecalho(dataUrl);
      salvarDados({ cabecalhoImagem: dataUrl });
    };
    reader.readAsDataURL(file);
  };

  // Upload do Rodapé
  const handleUploadRodape = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setRodape(dataUrl);
      salvarDados({ rodapeImagem: dataUrl });
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Header Card */}
      <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-lg p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 mb-2">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Modelo Oficial do Papel Timbrado Configurado
            </div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <FileCheck className="w-5 h-5 text-[#0F2C59] dark:text-blue-400" />
              Configurações do Papel Timbrado & Identificação Institucional
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Configure as informações cadastrais da empresa, condições da proposta (prazos e declaração), data de emissão e assinatura do responsável legal.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleRestaurarDadosImagem}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-md transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Restaura os dados originais da GWS GLOBAL LIMITADA conforme a imagem"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
              Restaurar Modelo da Imagem
            </button>
            <button
              onClick={onVisualizarPdf}
              className="px-3.5 py-2 bg-[#0F2C59] hover:bg-[#163C78] dark:bg-blue-600 dark:hover:bg-blue-500 text-white text-xs font-semibold rounded-md transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5 text-amber-400" />
              Visualizar no PDF
            </button>
          </div>
        </div>

        {salvoFeedback && (
          <div className="mt-3 p-2.5 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 rounded-md text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            Configurações salvas e aplicadas em todas as propostas!
          </div>
        )}
      </div>

      {/* ==================================================================== */}
      {/* 1. AS PRIMEIRAS INFORMAÇÕES QUE TERÃO QUE TER NO PAPEL TIMBRADO (EXATAS DA IMAGEM) */}
      {/* ==================================================================== */}
      <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
        <div className="p-4 bg-slate-900 dark:bg-slate-950 border-b border-slate-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-bold uppercase tracking-wider">
              1. Primeiras Informações do Papel Timbrado (Idêntico ao Documento Enviado)
            </span>
          </div>
          <button
            onClick={() => setModoEdicao(!modoEdicao)}
            className="px-3 py-1 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold rounded-md transition-colors flex items-center gap-1 cursor-pointer"
          >
            <Edit3 className="w-3.5 h-3.5 text-amber-300" />
            {modoEdicao ? 'Fechar Edição' : 'Editar Dados Cadastrais'}
          </button>
        </div>

        {/* REPRODUÇÃO FIEL DA IMAGEM DO USUÁRIO */}
        <div className="p-6 sm:p-8 bg-white font-sans text-slate-950 manter-branco">
          {/* Topo do Processo */}
          <div className="mb-4">
            <p className="text-base text-slate-900 leading-tight">
              Pregão Eletrônico <span className="font-extrabold font-mono">Nº 0019/26-A</span>
            </p>
            <p className="text-base text-slate-900 leading-tight mt-1">
              Processo Administrativo <span className="font-extrabold font-mono">Nº 0038/2026</span>
            </p>
          </div>

          {/* Tabela com Linhas Sublinhadas e Bordas (Exata como na imagem) */}
          <div className="border-t border-b border-black text-xs font-sans divide-y divide-black">
            <div className="py-1 px-1 flex">
              <span className="font-bold text-black w-36 uppercase tracking-tight">RAZÃO SOCIAL:</span>
              <span className="font-bold text-black">{razaoSocial}</span>
            </div>
            <div className="py-1 px-1 flex">
              <span className="font-bold text-black w-36 uppercase tracking-tight">CNPJ:</span>
              <span className="font-mono text-black">{cnpj}</span>
            </div>
            <div className="py-1 px-1 flex">
              <span className="font-bold text-black w-48 uppercase tracking-tight">INSCRIÇÃO ESTADUAL</span>
              <span className="font-mono text-black">{inscricaoEstadual}</span>
            </div>
            <div className="py-1 px-1 flex">
              <span className="font-bold text-black w-36 uppercase tracking-tight">ENDEREÇO:</span>
              <span className="text-black">{endereco}</span>
            </div>
            <div className="py-1 px-1 flex">
              <span className="font-bold text-black w-36 uppercase tracking-tight">TELEFONE:</span>
              <span className="font-mono text-black">{telefone}</span>
            </div>
            <div className="py-1 px-1 flex">
              <span className="font-bold text-black w-36 uppercase tracking-tight">EMAIL:</span>
              <span className="font-mono text-black lowercase">{email}</span>
            </div>
            <div className="py-1 px-1 flex">
              <span className="font-bold text-black w-36 uppercase tracking-tight">BANCO (NOME/Nº):</span>
              <span className="text-black">{banco}</span>
            </div>
            <div className="py-1 px-1 flex">
              <span className="font-bold text-black w-36 uppercase tracking-tight">AGÊNCIA Nº:</span>
              <span className="font-mono text-black">{agencia}</span>
            </div>
            <div className="py-1 px-1 flex">
              <span className="font-bold text-black w-48 uppercase tracking-tight">CONTA CORRENTE Nº:</span>
              <span className="font-mono text-black">{contaCorrente}</span>
            </div>
          </div>

          {/* Texto de Abertura / Declaração Legal do Representante */}
          {nomeRepresentante2.trim() ? (
            <div className="mt-4 text-[13px] leading-relaxed text-black text-justify">
              A empresa <span className="font-bold">{razaoSocial}</span>, inscrita no CNPJ sob o nº{' '}
              <span className="font-mono">{cnpj}</span>, sediada na {endereco}, neste ato representada por seus representantes legais,{' '}
              <span className="font-bold">{nomeRepresentante}</span>, portador(a) do documento de identidade RG nº{' '}
              <span className="font-mono">{rgRepresentante}</span>, inscrito(a) no CPF nº{' '}
              <span className="font-mono">{cpfRepresentante}</span>, residente e domiciliado na {enderecoRepresentante}, e{' '}
              <span className="font-bold">{nomeRepresentante2}</span>, portador(a) do documento de identidade RG nº{' '}
              <span className="font-mono">{rgRepresentante2 || '---'}</span>, inscrito(a) no CPF nº{' '}
              <span className="font-mono">{cpfRepresentante2 || '---'}</span>, residente e domiciliado na {enderecoRepresentante2 || enderecoRepresentante},
              vêm apresentar Proposta Comercial para a participação no processo indicado acima, conforme abaixo discriminado:
            </div>
          ) : (
            <div className="mt-4 text-[13px] leading-relaxed text-black text-justify">
              A empresa <span className="font-bold">{razaoSocial}</span>, inscrita no CNPJ sob o nº{' '}
              <span className="font-mono">{cnpj}</span>, sediada na {endereco}, neste ato representado(a) por{' '}
              <span className="font-bold">{nomeRepresentante}</span>, portador(a) do documento de identidade RG nº{' '}
              <span className="font-mono">{rgRepresentante}</span>, inscrito(a) no CPF nº{' '}
              <span className="font-mono">{cpfRepresentante}</span>, residente e domiciliado na {enderecoRepresentante},
              vem apresentar Proposta Comercial para a participação no processo indicado acima, conforme abaixo discriminado:
            </div>
          )}
        </div>

        {/* FORMULÁRIO DE EDIÇÃO DAS INFORMAÇÕES (Quando aberto) */}
        {modoEdicao && (
          <div className="p-6 bg-slate-50 dark:bg-slate-900/60 border-t border-slate-200 dark:border-slate-800">
            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-[#0F2C59] dark:text-blue-400" />
              Editar Dados da Empresa e dos Representantes Legais
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 text-xs">
              <div className="sm:col-span-6">
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Razão Social *</label>
                <input
                  type="text"
                  value={razaoSocial}
                  onChange={e => setRazaoSocial(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 dark:text-white rounded-md text-xs focus:outline-hidden focus:border-[#0F2C59] dark:focus:border-blue-500"
                />
              </div>

              <div className="sm:col-span-3">
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">CNPJ *</label>
                <input
                  type="text"
                  value={cnpj}
                  onChange={e => setCnpj(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 dark:text-white rounded-md text-xs font-mono focus:outline-hidden focus:border-[#0F2C59] dark:focus:border-blue-500"
                />
              </div>

              <div className="sm:col-span-3">
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Inscrição Estadual</label>
                <input
                  type="text"
                  value={inscricaoEstadual}
                  onChange={e => setInscricaoEstadual(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 dark:text-white rounded-md text-xs font-mono focus:outline-hidden focus:border-[#0F2C59] dark:focus:border-blue-500"
                />
              </div>

              <div className="sm:col-span-6">
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Endereço Completo da Empresa</label>
                <input
                  type="text"
                  value={endereco}
                  onChange={e => setEndereco(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 dark:text-white rounded-md text-xs focus:outline-hidden focus:border-[#0F2C59] dark:focus:border-blue-500"
                />
              </div>

              <div className="sm:col-span-3">
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Telefone(s)</label>
                <input
                  type="text"
                  value={telefone}
                  onChange={e => setTelefone(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 dark:text-white rounded-md text-xs font-mono focus:outline-hidden focus:border-[#0F2C59] dark:focus:border-blue-500"
                />
              </div>

              <div className="sm:col-span-3">
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">E-mail</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 dark:text-white rounded-md text-xs font-mono focus:outline-hidden focus:border-[#0F2C59] dark:focus:border-blue-500"
                />
              </div>

              {/* Dados Bancários */}
              <div className="sm:col-span-4">
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Banco (Nome/Nº)</label>
                <input
                  type="text"
                  value={banco}
                  onChange={e => setBanco(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 dark:text-white rounded-md text-xs focus:outline-hidden focus:border-[#0F2C59] dark:focus:border-blue-500"
                />
              </div>

              <div className="sm:col-span-4">
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Agência Nº</label>
                <input
                  type="text"
                  value={agencia}
                  onChange={e => setAgencia(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 dark:text-white rounded-md text-xs font-mono focus:outline-hidden focus:border-[#0F2C59] dark:focus:border-blue-500"
                />
              </div>

              <div className="sm:col-span-4">
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Conta Corrente Nº</label>
                <input
                  type="text"
                  value={contaCorrente}
                  onChange={e => setContaCorrente(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 dark:text-white rounded-md text-xs font-mono focus:outline-hidden focus:border-[#0F2C59] dark:focus:border-blue-500"
                />
              </div>

              {/* 1º REPRESENTANTE LEGAL */}
              <div className="sm:col-span-12 border-t border-slate-200 dark:border-slate-800 pt-3 mt-1">
                <div className="flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-[#0F2C59] dark:text-blue-400" />
                  <span className="text-xs font-bold text-[#0F2C59] dark:text-blue-400 uppercase tracking-wider">
                    1º Representante Legal (Principal)
                  </span>
                </div>
              </div>

              <div className="sm:col-span-4">
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Nome do 1º Representante *</label>
                <input
                  type="text"
                  value={nomeRepresentante}
                  onChange={e => setNomeRepresentante(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 dark:text-white rounded-md text-xs font-medium focus:outline-hidden focus:border-[#0F2C59] dark:focus:border-blue-500"
                />
              </div>

              <div className="sm:col-span-4">
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">RG e Órgão Emissor</label>
                <input
                  type="text"
                  value={rgRepresentante}
                  onChange={e => setRgRepresentante(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 dark:text-white rounded-md text-xs font-mono focus:outline-hidden focus:border-[#0F2C59] dark:focus:border-blue-500"
                />
              </div>

              <div className="sm:col-span-4">
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">CPF do 1º Representante</label>
                <input
                  type="text"
                  value={cpfRepresentante}
                  onChange={e => setCpfRepresentante(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 dark:text-white rounded-md text-xs font-mono focus:outline-hidden focus:border-[#0F2C59] dark:focus:border-blue-500"
                />
              </div>

              <div className="sm:col-span-12">
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Endereço Residencial do 1º Representante</label>
                <input
                  type="text"
                  value={enderecoRepresentante}
                  onChange={e => setEnderecoRepresentante(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 dark:text-white rounded-md text-xs focus:outline-hidden focus:border-[#0F2C59] dark:focus:border-blue-500"
                />
              </div>

              {/* 2º REPRESENTANTE LEGAL (OPCIONAL) */}
              <div className="sm:col-span-12 border-t border-slate-200 dark:border-slate-800 pt-3 mt-1">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <div className="flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider">
                      2º Representante Legal (Opcional - Caso a empresa possua 2 sócios)
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    Ao preencher, o documento e a assinatura exibirão ambos os representantes.
                  </span>
                </div>
              </div>

              <div className="sm:col-span-4">
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Nome do 2º Representante</label>
                <input
                  type="text"
                  value={nomeRepresentante2}
                  onChange={e => setNomeRepresentante2(e.target.value)}
                  placeholder="Deixe em branco se for apenas um"
                  className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 dark:text-white rounded-md text-xs font-medium focus:outline-hidden focus:border-[#0F2C59] dark:focus:border-blue-500"
                />
              </div>

              <div className="sm:col-span-4">
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">RG e Órgão Emissor (2º)</label>
                <input
                  type="text"
                  value={rgRepresentante2}
                  onChange={e => setRgRepresentante2(e.target.value)}
                  placeholder="Ex: MG-18.420.331"
                  className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 dark:text-white rounded-md text-xs font-mono focus:outline-hidden focus:border-[#0F2C59] dark:focus:border-blue-500"
                />
              </div>

              <div className="sm:col-span-4">
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">CPF do 2º Representante</label>
                <input
                  type="text"
                  value={cpfRepresentante2}
                  onChange={e => setCpfRepresentante2(e.target.value)}
                  placeholder="Ex: 000.000.000-00"
                  className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 dark:text-white rounded-md text-xs font-mono focus:outline-hidden focus:border-[#0F2C59] dark:focus:border-blue-500"
                />
              </div>

              <div className="sm:col-span-12">
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Endereço Residencial do 2º Representante</label>
                <input
                  type="text"
                  value={enderecoRepresentante2}
                  onChange={e => setEnderecoRepresentante2(e.target.value)}
                  placeholder="Ex: Rua das Palmeiras, nº 45, Bairro Centro, Cidade - UF"
                  className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 dark:text-white rounded-md text-xs focus:outline-hidden focus:border-[#0F2C59] dark:focus:border-blue-500"
                />
              </div>
            </div>

            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setModoEdicao(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-md cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  salvarDados();
                  setModoEdicao(false);
                }}
                className="px-4 py-2 text-xs font-bold text-white bg-[#0F2C59] hover:bg-[#163C78] dark:bg-blue-600 dark:hover:bg-blue-500 rounded-md cursor-pointer flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                Salvar Alterações
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ==================================================================== */}
      {/* 2. PRAZOS, DECLARAÇÃO TRABALHISTA E DATA DE EMISSÃO (PÓS TABELA & TOTAL EXTENSO) */}
      {/* ==================================================================== */}
      <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-lg p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-md bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-emerald-700 dark:text-emerald-400">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                2. Prazos, Declaração Trabalhista & Data de Emissão (Inseridos após a Tabela de Preços)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Textos obrigatórios e campo da data de emissão posicionados imediatamente após o valor por extenso e antes da assinatura.
              </p>
            </div>
          </div>

          <button
            onClick={() => salvarDados()}
            className="text-xs text-[#0F2C59] dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 dark:hover:bg-blue-950/70 border border-blue-200 dark:border-blue-800 px-3 py-1.5 rounded-md font-semibold transition-colors flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-[#0F2C59] dark:text-blue-400" />
            Salvar Condições
          </button>
        </div>

        {/* Inputs de Configuração */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 text-xs">
          <div className="md:col-span-6">
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
              Prazo de Entrega:
            </label>
            <input
              type="text"
              value={prazoEntrega}
              onChange={e => {
                setPrazoEntrega(e.target.value);
                salvarDados({ prazoEntrega: e.target.value });
              }}
              placeholder="Conforme Aviso de Dispensa Eletrônica e Termo de Referência."
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-md text-xs font-medium text-slate-800 dark:text-white focus:bg-white dark:focus:bg-slate-950 focus:outline-hidden focus:border-[#0F2C59] dark:focus:border-blue-500"
            />
          </div>

          <div className="md:col-span-6">
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
              Prazo de Validade da Proposta:
            </label>
            <input
              type="text"
              value={prazoValidade}
              onChange={e => {
                setPrazoValidade(e.target.value);
                salvarDados({ prazoValidade: e.target.value });
              }}
              placeholder="90 Dias"
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-md text-xs font-medium text-slate-800 dark:text-white focus:bg-white dark:focus:bg-slate-950 focus:outline-hidden focus:border-[#0F2C59] dark:focus:border-blue-500"
            />
          </div>

          <div className="md:col-span-12">
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
              Declaração Trabalhista (Artigo e Normas Vigentes):
            </label>
            <textarea
              rows={3}
              value={declaracaoTrabalhista}
              onChange={e => {
                setDeclaracaoTrabalhista(e.target.value);
                salvarDados({ declaracaoTrabalhista: e.target.value });
              }}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-md text-xs leading-relaxed text-slate-800 dark:text-white focus:bg-white dark:focus:bg-slate-950 focus:outline-hidden focus:border-[#0F2C59] dark:focus:border-blue-500"
            />
          </div>

          {/* Opção da Data da Emissão desse Documento */}
          <div className="md:col-span-6">
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#0F2C59] dark:text-blue-400" />
                Data da Emissão do Documento *
              </span>
              <button
                type="button"
                onClick={() => {
                  const hoje = new Date().toISOString().split('T')[0];
                  setDataEmissao(hoje);
                  salvarDados({ dataEmissao: hoje });
                }}
                className="text-[11px] text-[#0F2C59] dark:text-blue-400 hover:underline font-semibold cursor-pointer"
              >
                Hoje
              </button>
            </label>
            <input
              type="date"
              value={dataEmissao}
              onChange={e => {
                setDataEmissao(e.target.value);
                salvarDados({ dataEmissao: e.target.value });
              }}
              className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-md text-xs font-semibold text-slate-900 dark:text-white cursor-pointer focus:outline-hidden focus:border-[#0F2C59] dark:focus:border-blue-500"
            />
          </div>

          <div className="md:col-span-6">
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-[#0F2C59] dark:text-blue-400" />
              Cidade / Estado da Emissão:
            </label>
            <input
              type="text"
              value={cidadeEmissao}
              onChange={e => {
                setCidadeEmissao(e.target.value);
                salvarDados({ cidadeEmissao: e.target.value });
              }}
              placeholder="Timóteo - MG"
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-md text-xs font-medium text-slate-800 dark:text-white focus:bg-white dark:focus:bg-slate-950 focus:outline-hidden focus:border-[#0F2C59] dark:focus:border-blue-500"
            />
          </div>
        </div>

        {/* Visualização de como aparecerá no PDF */}
        <div className="mt-3 p-4 bg-white border border-slate-300 rounded-md font-sans text-xs space-y-2 text-slate-900 manter-branco">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
            Prévia dos Prazos e Declaração no Documento Oficial:
          </span>
          <p className="leading-snug">
            <span className="font-bold text-black">PRAZO DE ENTREGA:</span>{' '}
            <span className="text-black">{prazoEntrega}</span>
          </p>
          <p className="leading-snug">
            <span className="font-bold text-black">PRAZO DE VALIDADE DA PROPOSTA:</span>{' '}
            <span className="text-black">{prazoValidade}</span>
          </p>
          <p className="text-justify text-slate-800 text-[12px] leading-relaxed pt-1">
            {declaracaoTrabalhista}
          </p>
          <p className="text-center font-bold text-slate-950 pt-2 text-xs tracking-tight">
            {formatarDataExtensoPtBr(dataEmissao, cidadeEmissao)}
          </p>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 3. UPLOAD DA IMAGEM DA ASSINATURA DO RESPONSÁVEL */}
      {/* ==================================================================== */}
      <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-lg p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-md bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 flex items-center justify-center text-[#0F2C59] dark:text-blue-400">
              <PenTool className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                3. Assinatura(s) do(s) Responsável(eis) Legal(is)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Envie a foto/rubrica digitalizada ou gere uma assinatura estilizada.
                {nomeRepresentante2.trim()
                  ? ' Como foram cadastrados 2 representantes legais, o documento e a prévia geram 2 blocos de assinatura lado a lado.'
                  : ' Posicionada automaticamente sobre o traço de assinatura do documento oficial em PDF.'}
              </p>
            </div>
          </div>
        </div>

        {/* CONTROLES DE UPLOAD E ESTILIZAÇÃO */}
        <div className={`grid grid-cols-1 ${nomeRepresentante2.trim() ? 'md:grid-cols-2' : 'md:grid-cols-12'} gap-6`}>
          {/* 1º Representante */}
          <div className={`${nomeRepresentante2.trim() ? '' : 'md:col-span-6'} space-y-3 bg-slate-50 dark:bg-slate-900/60 p-4 rounded-md border border-slate-200 dark:border-slate-800`}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#0F2C59] dark:text-blue-400 flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5" />
                Assinatura: {nomeRepresentante || '1º Representante'}
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    const padraoAss = gerarAssinaturaPadrao(nomeRepresentante);
                    setAssinatura(padraoAss);
                    salvarDados({ assinaturaImagem: padraoAss });
                  }}
                  className="text-[11px] text-[#0F2C59] dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-950/70 bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 px-2 py-1 rounded font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                  title="Gerar assinatura digital estilizada"
                >
                  <Sparkles className="w-3 h-3 text-amber-500" />
                  Gerar Caneta
                </button>
                {assinatura && (
                  <button
                    type="button"
                    onClick={() => {
                      setAssinatura('');
                      salvarDados({ assinaturaImagem: '' });
                    }}
                    className="text-[11px] text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-950/60 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 px-2 py-1 rounded font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" />
                    Limpar
                  </button>
                )}
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Upload de Imagem (PNG/JPG com fundo transparente ou branco):
              </label>
              <input
                type="file"
                accept="image/png,image/jpeg,image/jpg"
                onChange={handleUploadAssinatura}
                className="w-full text-xs text-slate-600 dark:text-slate-300 file:mr-2 file:py-1.5 file:px-2.5 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-[#0F2C59] dark:file:bg-blue-600 file:text-white hover:file:bg-[#163C78] dark:hover:file:bg-blue-500 file:cursor-pointer bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-md p-1"
              />
            </div>
          </div>

          {/* 2º Representante (Quando cadastrado) */}
          {nomeRepresentante2.trim() && (
            <div className="space-y-3 bg-emerald-50/50 dark:bg-emerald-950/20 p-4 rounded-md border border-emerald-200 dark:border-emerald-900/60">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  Assinatura: {nomeRepresentante2}
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      const padraoAss2 = gerarAssinaturaPadrao(nomeRepresentante2);
                      setAssinatura2(padraoAss2);
                      salvarDados({ assinaturaImagem2: padraoAss2 });
                    }}
                    className="text-[11px] text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-950/60 bg-emerald-100/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 px-2 py-1 rounded font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                    title="Gerar assinatura digital para o 2º representante"
                  >
                    <Sparkles className="w-3 h-3 text-amber-500" />
                    Gerar Caneta
                  </button>
                  {assinatura2 && (
                    <button
                      type="button"
                      onClick={() => {
                        setAssinatura2('');
                        salvarDados({ assinaturaImagem2: '' });
                      }}
                      className="text-[11px] text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-950/60 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 px-2 py-1 rounded font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                      Limpar
                    </button>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Upload de Imagem (2º Representante):
                </label>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/jpg"
                  onChange={handleUploadAssinatura2}
                  className="w-full text-xs text-slate-600 dark:text-slate-300 file:mr-2 file:py-1.5 file:px-2.5 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-emerald-800 file:text-white hover:file:bg-emerald-900 file:cursor-pointer bg-white dark:bg-slate-950 border border-emerald-200 dark:border-emerald-800/60 rounded-md p-1"
                />
              </div>
            </div>
          )}

          {/* Se apenas 1 representante, exibe a coluna da prévia ao lado */}
          {!nomeRepresentante2.trim() && (
            <div className="md:col-span-6">
              <div className="bg-white border border-slate-300 rounded-md p-5 text-center relative overflow-hidden manter-branco">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 absolute top-2 right-3">
                  Prévia do Bloco de Assinatura no PDF
                </span>

                {assinatura ? (
                  <div className="flex flex-col items-center justify-center pt-2">
                    <div className="h-20 flex items-end justify-center mb-1">
                      <img
                        src={assinatura}
                        alt="Assinatura do Responsável"
                        className="max-h-20 max-w-[260px] object-contain"
                      />
                    </div>
                    <div className="w-64 border-t border-slate-900 pt-1.5">
                      <p className="font-bold text-xs text-slate-900 uppercase tracking-tight">{razaoSocial}</p>
                      <p className="text-[11px] text-slate-700 font-medium">
                        {nomeRepresentante} — Representante Legal
                      </p>
                      <p className="text-[10px] font-mono text-slate-500">CNPJ: {cnpj}</p>
                    </div>
                  </div>
                ) : (
                  <div className="py-6 text-center text-slate-400">
                    <PenTool className="w-8 h-8 mx-auto mb-2 opacity-40 text-slate-400" />
                    <p className="text-xs font-semibold text-slate-600">Nenhuma imagem de assinatura carregada</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      No PDF será exibida a linha com dados para assinatura física manual.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* PRÉVIA LADO A LADO SE FOREM 2 REPRESENTANTES */}
        {nomeRepresentante2.trim() && (
          <div className="bg-white border border-slate-300 rounded-md p-6 text-center relative mt-4 manter-branco">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 absolute top-2 right-3">
              Estrutura Dupla de Assinaturas (Prévia Oficial do PDF)
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 max-w-2xl mx-auto pt-3">
              {/* Assinatura 1 */}
              <div className="flex flex-col items-center">
                {assinatura ? (
                  <div className="h-18 flex items-end justify-center mb-1">
                    <img
                      src={assinatura}
                      alt="Assinatura 1"
                      className="max-h-18 max-w-[220px] object-contain"
                    />
                  </div>
                ) : (
                  <div className="h-18 flex items-center justify-center text-slate-400 text-[11px] italic">
                    (Linha para assinatura manual)
                  </div>
                )}
                <div className="w-full max-w-[240px] border-t border-slate-900 pt-1.5">
                  <p className="font-bold text-xs text-slate-900 uppercase tracking-tight">{razaoSocial}</p>
                  <p className="text-[11px] text-slate-700 font-medium">{nomeRepresentante}</p>
                  <p className="text-[10px] text-slate-500 font-mono">Representante Legal • CPF: {cpfRepresentante}</p>
                </div>
              </div>

              {/* Assinatura 2 */}
              <div className="flex flex-col items-center">
                {assinatura2 ? (
                  <div className="h-18 flex items-end justify-center mb-1">
                    <img
                      src={assinatura2}
                      alt="Assinatura 2"
                      className="max-h-18 max-w-[220px] object-contain"
                    />
                  </div>
                ) : (
                  <div className="h-18 flex items-center justify-center text-slate-400 text-[11px] italic">
                    (Linha para assinatura manual)
                  </div>
                )}
                <div className="w-full max-w-[240px] border-t border-slate-900 pt-1.5">
                  <p className="font-bold text-xs text-slate-900 uppercase tracking-tight">{razaoSocial}</p>
                  <p className="text-[11px] text-slate-700 font-medium">{nomeRepresentante2}</p>
                  <p className="text-[10px] text-slate-500 font-mono">Representante Legal • CPF: {cpfRepresentante2 || '---'}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ==================================================================== */}
      {/* 4. UPLOAD DE IMAGENS DE CABEÇALHO (TOPO) E RODAPÉ (BASE) OPCIONAIS */}
      {/* ==================================================================== */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* CABEÇALHO (TOPO) */}
        <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-lg p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-[#0F2C59] dark:text-blue-400" />
              4. Imagem do Cabeçalho (Topo de Todas as Páginas)
            </h3>
            {cabecalho && (
              <button
                onClick={() => {
                  setCabecalho('');
                  salvarDados({ cabecalhoImagem: '' });
                }}
                className="text-[11px] text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 flex items-center gap-1 cursor-pointer"
              >
                <Trash2 className="w-3 h-3" />
                Remover
              </button>
            )}
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400">
            Caso possua logotipo com arte gráfica, envie aqui. Ela será carimbada na margem superior de todas as folhas do PDF.
          </p>

          {cabecalho ? (
            <div className="border border-slate-200 dark:border-slate-800 rounded-md p-2 bg-slate-50 dark:bg-slate-900/60">
              <img src={cabecalho} alt="Cabeçalho Atual" className="w-full max-h-24 object-contain rounded bg-white" />
              <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                <span>Imagem salva</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Ativa no PDF
                </span>
              </div>
            </div>
          ) : (
            <div className="border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-md p-6 text-center text-slate-400 dark:text-slate-500">
              <ImageIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-xs">Nenhuma imagem gráfica carregada.</p>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">O documento utilizará o cabeçalho oficial tipográfico acima.</p>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Upload de Nova Imagem do Topo (PNG/JPG)
            </label>
            <input
              type="file"
              accept="image/png,image/jpeg,image/jpg"
              onChange={handleUploadCabecalho}
              className="w-full text-xs text-slate-600 dark:text-slate-300 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-[#0F2C59] dark:file:bg-blue-600 file:text-white hover:file:bg-[#163C78] dark:hover:file:bg-blue-500 file:cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              <span>Altura do Cabeçalho no PDF</span>
              <span className="font-mono text-[#0F2C59] dark:text-blue-400">{alturaCabecalho} mm</span>
            </div>
            <input
              type="range"
              min="15"
              max="50"
              value={alturaCabecalho}
              onChange={e => {
                const val = Number(e.target.value);
                setAlturaCabecalho(val);
                salvarDados({ alturaCabecalhoMm: val });
              }}
              className="w-full accent-[#0F2C59] dark:accent-blue-500 cursor-pointer"
            />
          </div>
        </div>

        {/* RODAPÉ (BASE) */}
        <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-lg p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-[#0F2C59] dark:text-blue-400" />
              5. Imagem do Rodapé (Base de Todas as Páginas)
            </h3>
            {rodape && (
              <button
                onClick={() => {
                  setRodape('');
                  salvarDados({ rodapeImagem: '' });
                }}
                className="text-[11px] text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 flex items-center gap-1 cursor-pointer"
              >
                <Trash2 className="w-3 h-3" />
                Remover
              </button>
            )}
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400">
            Imagem institucional para a base das páginas (rodapé gráfico, linhas ou contatos da empresa).
          </p>

          {rodape ? (
            <div className="border border-slate-200 dark:border-slate-800 rounded-md p-2 bg-slate-50 dark:bg-slate-900/60">
              <img src={rodape} alt="Rodapé Atual" className="w-full max-h-20 object-contain rounded bg-white" />
              <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                <span>Imagem salva</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Ativo no PDF
                </span>
              </div>
            </div>
          ) : (
            <div className="border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-md p-6 text-center text-slate-400 dark:text-slate-500">
              <ImageIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-xs">Nenhum rodapé gráfico carregado.</p>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">O documento utilizará o rodapé institucional padrão com os dados cadastrais.</p>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Upload de Nova Imagem da Base (PNG/JPG)
            </label>
            <input
              type="file"
              accept="image/png,image/jpeg,image/jpg"
              onChange={handleUploadRodape}
              className="w-full text-xs text-slate-600 dark:text-slate-300 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-[#0F2C59] dark:file:bg-blue-600 file:text-white hover:file:bg-[#163C78] dark:hover:file:bg-blue-500 file:cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              <span>Altura do Rodapé no PDF</span>
              <span className="font-mono text-[#0F2C59] dark:text-blue-400">{alturaRodape} mm</span>
            </div>
            <input
              type="range"
              min="10"
              max="40"
              value={alturaRodape}
              onChange={e => {
                const val = Number(e.target.value);
                setAlturaRodape(val);
                salvarDados({ alturaRodapeMm: val });
              }}
              className="w-full accent-[#0F2C59] dark:accent-blue-500 cursor-pointer"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
