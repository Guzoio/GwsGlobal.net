import React, { useState, useMemo } from 'react';
import {
  Users,
  Search,
  Plus,
  Phone,
  Mail,
  Building2,
  User,
  Star,
  Edit2,
  Trash2,
  Copy,
  Check,
  ExternalLink,
  MapPin,
  X,
  LayoutGrid,
  List,
  Sparkles,
  AlertTriangle,
} from 'lucide-react';
import { ContatoPrefeitura, Licitacao } from '../types';

interface ContatosTabProps {
  contatos: ContatoPrefeitura[];
  licitacoesCrm: Licitacao[];
  onSalvarContato: (contato: ContatoPrefeitura) => Promise<void> | void;
  onExcluirContato: (contatoId: string) => Promise<void> | void;
}

// Ícone SVG autêntico do WhatsApp
const WhatsAppIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    aria-hidden="true"
  >
    <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.36 3.45 16.86L2.05 22L7.3 20.62C8.75 21.41 10.38 21.83 12.04 21.83C17.5 21.83 21.95 17.38 21.95 11.92C21.95 9.27 20.92 6.78 19.05 4.91C17.18 3.04 14.69 2 12.04 2M12.05 3.67C14.25 3.67 16.31 4.53 17.87 6.09C19.42 7.65 20.28 9.72 20.28 11.92C20.28 16.46 16.58 20.15 12.04 20.15C10.56 20.15 9.11 19.76 7.85 19L7.55 18.83L4.43 19.65L5.26 16.61L5.06 16.29C4.24 14.99 3.81 13.47 3.81 11.91C3.81 7.37 7.5 3.67 12.05 3.67M8.53 7.33C8.37 7.33 8.1 7.39 7.87 7.64C7.65 7.89 7.02 8.48 7.02 9.69C7.02 10.9 7.9 12.06 8.02 12.23C8.15 12.39 9.73 14.83 12.16 15.88C12.74 16.13 13.19 16.28 13.54 16.39C14.12 16.57 14.65 16.55 15.07 16.49C15.54 16.42 16.51 15.9 16.71 15.33C16.92 14.76 16.92 14.28 16.86 14.17C16.79 14.07 16.63 14.01 16.39 13.89C16.14 13.77 14.92 13.17 14.69 13.09C14.47 13 14.3 12.96 14.14 13.21C13.97 13.45 13.51 13.98 13.37 14.15C13.23 14.31 13.09 14.33 12.84 14.21C12.6 14.09 11.81 13.83 10.87 13C10.14 12.35 9.65 11.55 9.51 11.31C9.37 11.07 9.5 10.93 9.62 10.81C9.73 10.7 9.87 10.52 10 10.37C10.12 10.21 10.17 10.09 10.25 9.93C10.33 9.77 10.29 9.63 10.23 9.51C10.17 9.39 9.69 8.22 9.49 7.74C9.3 7.27 9.1 7.33 8.95 7.33C8.81 7.33 8.65 7.33 8.53 7.33Z" />
  </svg>
);

// Formata número para link de WhatsApp (wa.me)
function gerarLinkWhatsApp(numeroRaw: string, nomeContato: string, prefeitura: string): string {
  const digitos = numeroRaw.replace(/\D/g, '');
  if (!digitos) return '';
  const numeroFormatado = digitos.startsWith('55') ? digitos : `55${digitos}`;
  const saudacao = nomeContato ? `Olá ${nomeContato.trim()}, tudo bem?` : 'Olá, tudo bem?';
  const texto = encodeURIComponent(
    `${saudacao} Sou fornecedor participante de licitações com a ${prefeitura.trim()}.`
  );
  return `https://wa.me/${numeroFormatado}?text=${texto}`;
}

// Máscara para telefones brasileiros
function aplicarMascaraTelefone(valor: string): string {
  const digitos = valor.replace(/\D/g, '').slice(0, 11);
  if (digitos.length <= 2) return digitos;
  if (digitos.length <= 6) return `(${digitos.slice(0, 2)}) ${digitos.slice(2)}`;
  if (digitos.length <= 10) {
    return `(${digitos.slice(0, 2)}) ${digitos.slice(2, 6)}-${digitos.slice(6)}`;
  }
  return `(${digitos.slice(0, 2)}) ${digitos.slice(2, 7)}-${digitos.slice(7)}`;
}

export const ContatosTab: React.FC<ContatosTabProps> = ({
  contatos,
  licitacoesCrm,
  onSalvarContato,
  onExcluirContato,
}) => {
  const [busca, setBusca] = useState('');
  const [filtroRapido, setFiltroRapido] = useState<'todos' | 'whatsapp' | 'favoritos'>('todos');
  const [modoVisualizacao, setModoVisualizacao] = useState<'cards' | 'lista'>('cards');
  const [modalAberto, setModalAberto] = useState(false);
  const [contatoEdicao, setContatoEdicao] = useState<ContatoPrefeitura | null>(null);
  const [contatoParaExcluir, setContatoParaExcluir] = useState<ContatoPrefeitura | null>(null);
  const [copiadoId, setCopiadoId] = useState<string | null>(null);

  // Estados do formulário de novo / editar contato
  const [formPrefeitura, setFormPrefeitura] = useState('');
  const [formCidadeUf, setFormCidadeUf] = useState('');
  const [formNomeContato, setFormNomeContato] = useState('');
  const [formCargoSetor, setFormCargoSetor] = useState('');
  const [formWhatsapp, setFormWhatsapp] = useState('');
  const [formTelefoneFixo, setFormTelefoneFixo] = useState('');
  const [formRamal, setFormRamal] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formFavorito, setFormFavorito] = useState(false);

  // Lista de prefeituras únicas já existentes no CRM para auto-completar
  const prefeiturasCrm = useMemo(() => {
    const nomes = new Set<string>();
    licitacoesCrm.forEach(l => {
      if (l.orgao && l.orgao.trim()) nomes.add(l.orgao.trim());
    });
    return Array.from(nomes).sort();
  }, [licitacoesCrm]);

  const abrirModalNovo = (prefeituraSugerida?: string) => {
    setContatoEdicao(null);
    setFormPrefeitura(prefeituraSugerida || '');
    setFormCidadeUf('');
    setFormNomeContato('');
    setFormCargoSetor('');
    setFormWhatsapp('');
    setFormTelefoneFixo('');
    setFormRamal('');
    setFormEmail('');
    setFormFavorito(false);
    setModalAberto(true);
  };

  const abrirModalEditar = (c: ContatoPrefeitura) => {
    setContatoEdicao(c);
    setFormPrefeitura(c.prefeitura);
    setFormCidadeUf(c.cidadeUf || '');
    setFormNomeContato(c.nomeContato);
    setFormCargoSetor(c.cargoSetor || '');
    setFormWhatsapp(c.whatsapp || '');
    setFormTelefoneFixo(c.telefoneFixo || '');
    setFormRamal(c.ramal || '');
    setFormEmail(c.email || '');
    setFormFavorito(Boolean(c.favorito));
    setModalAberto(true);
  };

  const handleSalvarForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formPrefeitura.trim() || !formNomeContato.trim()) {
      return;
    }

    const novoContato: ContatoPrefeitura = {
      id: contatoEdicao ? contatoEdicao.id : `contato_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      prefeitura: formPrefeitura.trim(),
      cidadeUf: formCidadeUf.trim() || undefined,
      nomeContato: formNomeContato.trim(),
      cargoSetor: formCargoSetor.trim() || undefined,
      whatsapp: formWhatsapp.trim() || undefined,
      telefoneFixo: formTelefoneFixo.trim() || undefined,
      ramal: formRamal.trim() || undefined,
      email: formEmail.trim().toLowerCase() || undefined,
      favorito: formFavorito,
      dataCadastro: contatoEdicao ? contatoEdicao.dataCadastro : new Date().toISOString(),
    };

    await onSalvarContato(novoContato);
    setModalAberto(false);
  };

  const handleToggleFavorito = async (c: ContatoPrefeitura) => {
    const atualizado: ContatoPrefeitura = {
      ...c,
      favorito: !c.favorito,
    };
    await onSalvarContato(atualizado);
  };

  const copiarTexto = (texto: string, id: string) => {
    navigator.clipboard.writeText(texto);
    setCopiadoId(id);
    setTimeout(() => setCopiadoId(null), 1800);
  };

  // Filtragem e busca em tempo real
  const contatosFiltrados = useMemo(() => {
    const filtrados = contatos.filter(c => {
      // Filtro rápido
      if (filtroRapido === 'whatsapp' && !c.whatsapp) return false;
      if (filtroRapido === 'favoritos' && !c.favorito) return false;

      // Busca por texto
      if (!busca.trim()) return true;
      const termo = busca.toLowerCase();
      return (
        c.prefeitura.toLowerCase().includes(termo) ||
        c.nomeContato.toLowerCase().includes(termo) ||
        (c.cargoSetor && c.cargoSetor.toLowerCase().includes(termo)) ||
        (c.cidadeUf && c.cidadeUf.toLowerCase().includes(termo)) ||
        (c.whatsapp && c.whatsapp.includes(termo)) ||
        (c.telefoneFixo && c.telefoneFixo.includes(termo)) ||
        (c.email && c.email.toLowerCase().includes(termo))
      );
    });

    // Favoritos primeiro, depois ordem alfabética por prefeitura
    return filtrados.sort((a, b) => {
      if (a.favorito && !b.favorito) return -1;
      if (!a.favorito && b.favorito) return 1;
      return a.prefeitura.localeCompare(b.prefeitura);
    });
  }, [contatos, busca, filtroRapido]);

  return (
    <div className="space-y-4 pb-10 animate-in fade-in duration-150">
      {/* Top Bar: Pesquisa, Filtros Rápidos, Modo de Exibição e Novo Contato */}
      <div className="bg-white dark:bg-[#0A162B] rounded-2xl p-3 sm:p-4 border border-slate-200/90 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Campo de Pesquisa */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={busca}
            onChange={e => setBusca(e.target.value)}
            placeholder="Pesquisar prefeitura, pessoa, telefone ou e-mail..."
            className="w-full pl-10 pr-9 py-2 text-xs sm:text-sm rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/10 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all"
          />
          {busca && (
            <button
              type="button"
              onClick={() => setBusca('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
              title="Limpar pesquisa"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filtros Rápidos (Chips Modernos) */}
        <div className="flex items-center gap-1.5 flex-wrap sm:flex-nowrap">
          <button
            type="button"
            onClick={() => setFiltroRapido('todos')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              filtroRapido === 'todos'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300'
            }`}
          >
            Todos ({contatos.length})
          </button>
          <button
            type="button"
            onClick={() => setFiltroRapido('whatsapp')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              filtroRapido === 'whatsapp'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300'
            }`}
          >
            <WhatsAppIcon className="w-3.5 h-3.5 text-emerald-500 group-hover:text-white" />
            <span>WhatsApp</span>
          </button>
          <button
            type="button"
            onClick={() => setFiltroRapido('favoritos')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              filtroRapido === 'favoritos'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300'
            }`}
          >
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            <span>Favoritos</span>
          </button>
        </div>

        {/* Separador e Controles da Direita */}
        <div className="flex items-center justify-between sm:justify-end gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-white/5">
          {/* Alternador de Visualização: Cards vs Tabela */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-900/60 p-0.5 rounded-xl border border-slate-200/60 dark:border-white/5">
            <button
              type="button"
              onClick={() => setModoVisualizacao('cards')}
              title="Visualização em Cards Detalhados"
              className={`p-1.5 rounded-lg text-xs transition-all ${
                modoVisualizacao === 'cards'
                  ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-2xs font-bold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setModoVisualizacao('lista')}
              title="Visualização em Tabela / Linhas"
              className={`p-1.5 rounded-lg text-xs transition-all ${
                modoVisualizacao === 'lista'
                  ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-2xs font-bold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
              }`}
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Botão Novo Contato */}
          <button
            type="button"
            onClick={() => abrirModalNovo()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs shadow-xs transition-all cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Novo Contato</span>
          </button>
        </div>
      </div>

      {/* Conteúdo: Estado Vazio ou Lista/Cards */}
      {contatosFiltrados.length === 0 ? (
        <div className="bg-white dark:bg-[#0A162B] rounded-2xl p-10 text-center border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 mx-auto flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-slate-800 dark:text-white">
              {busca ? 'Nenhum contato encontrado na pesquisa' : 'Nenhum contato cadastrado'}
            </h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              {busca
                ? 'Tente buscar por outro termo ou limpe o campo de pesquisa.'
                : 'Cadastre os contatos das prefeituras com WhatsApp, telefone e e-mail para ter acesso rápido e enviar mensagens com um clique.'}
            </p>
          </div>
          {!busca && (
            <button
              type="button"
              onClick={() => abrirModalNovo()}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Cadastrar Primeiro Contato</span>
            </button>
          )}
        </div>
      ) : modoVisualizacao === 'cards' ? (
        /* VISUALIZAÇÃO EM CARDS: Elegante, Espaçosa e sem truncar e-mails */
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-3.5">
          {contatosFiltrados.map(contato => {
            const linkWhats = contato.whatsapp
              ? gerarLinkWhatsApp(contato.whatsapp, contato.nomeContato, contato.prefeitura)
              : '';

            return (
              <div
                key={contato.id}
                className={`bg-white dark:bg-[#0A162B] rounded-2xl border transition-all p-4 flex flex-col justify-between gap-3 shadow-2xs hover:shadow-md ${
                  contato.favorito
                    ? 'border-amber-300 dark:border-amber-500/40 ring-1 ring-amber-400/20'
                    : 'border-slate-200/90 dark:border-slate-800/90 hover:border-blue-400/50 dark:hover:border-blue-500/50'
                }`}
              >
                {/* Cabeçalho do Card: Prefeitura + Cidade + Ações */}
                <div className="flex items-start justify-between gap-2.5">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-100 dark:border-blue-900/30">
                      <Building2 className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <h3
                        className="text-sm font-bold text-slate-900 dark:text-white leading-tight"
                        title={contato.prefeitura}
                      >
                        {contato.prefeitura}
                      </h3>
                      {contato.cidadeUf && (
                        <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-0.5">
                          <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>{contato.cidadeUf}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Ações Rápidas (Favorito, Editar, Excluir) */}
                  <div className="flex items-center gap-1 shrink-0 bg-slate-50 dark:bg-white/5 p-1 rounded-xl border border-slate-100 dark:border-white/5">
                    <button
                      type="button"
                      onClick={() => handleToggleFavorito(contato)}
                      title={contato.favorito ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-amber-500 transition-colors cursor-pointer"
                    >
                      <Star
                        className={`w-3.5 h-3.5 ${
                          contato.favorito ? 'fill-amber-400 text-amber-400' : ''
                        }`}
                      />
                    </button>
                    <button
                      type="button"
                      onClick={() => abrirModalEditar(contato)}
                      title="Editar contato"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setContatoParaExcluir(contato);
                      }}
                      title="Excluir contato"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Meio: Responsável & Cargo */}
                <div className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 bg-slate-50/70 dark:bg-slate-900/40 px-3 py-1.5 rounded-xl border border-slate-100 dark:border-white/5">
                  <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {contato.nomeContato}
                  </span>
                  {contato.cargoSetor && (
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                      • {contato.cargoSetor}
                    </span>
                  )}
                </div>

                {/* Rodapé: Canais de Contato (WhatsApp, Telefone e E-mail com visual limpo e sem cortes) */}
                <div className="space-y-2 pt-1 border-t border-slate-100 dark:border-white/5">
                  {/* Linha com WhatsApp e Fixo */}
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Botão de WhatsApp em destaque */}
                    {contato.whatsapp && (
                      <a
                        href={linkWhats}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs shadow-xs transition-all cursor-pointer"
                        title="Abrir WhatsApp para conversar diretamente"
                      >
                        <WhatsAppIcon className="w-3.5 h-3.5 shrink-0" />
                        <span>{contato.whatsapp}</span>
                        <ExternalLink className="w-3 h-3 opacity-75" />
                      </a>
                    )}

                    {/* Telefone Fixo com cópia rápida */}
                    {contato.telefoneFixo && (
                      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-200 text-xs font-medium border border-slate-200/60 dark:border-white/5">
                        <Phone className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                        <span>
                          {contato.telefoneFixo}
                          {contato.ramal ? ` R.${contato.ramal}` : ''}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            copiarTexto(
                              `${contato.telefoneFixo}${contato.ramal ? ` R.${contato.ramal}` : ''}`,
                              `tel_${contato.id}`
                            )
                          }
                          title="Copiar telefone fixo"
                          className="p-1 hover:text-blue-600 dark:hover:text-blue-400 transition-colors ml-0.5"
                        >
                          {copiadoId === `tel_${contato.id}` ? (
                            <Check className="w-3 h-3 text-emerald-500" />
                          ) : (
                            <Copy className="w-3 h-3 opacity-60" />
                          )}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* E-mail Completo: Amplo, sem reticências, com clique para enviar e cópia instantânea */}
                  {contato.email && (
                    <div className="flex items-center justify-between gap-2 px-3 py-1.5 rounded-xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-100/80 dark:border-blue-900/30 text-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        <Mail className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                        <a
                          href={`mailto:${contato.email}`}
                          className="text-blue-700 dark:text-blue-300 font-semibold hover:underline select-all break-all"
                          title="Clique para enviar e-mail"
                        >
                          {contato.email}
                        </a>
                      </div>

                      <button
                        type="button"
                        onClick={() => copiarTexto(contato.email!, `mail_${contato.id}`)}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 text-[11px] font-semibold text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-white border border-slate-200/80 dark:border-white/10 shadow-2xs transition-all shrink-0 cursor-pointer"
                        title="Copiar e-mail"
                      >
                        {copiadoId === `mail_${contato.id}` ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-500" />
                            <span className="text-emerald-600 dark:text-emerald-400">Copiado</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3 opacity-70" />
                            <span>Copiar</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* VISUALIZAÇÃO EM TABELA / LINHAS: Super organizada e compacta com todos os dados */
        <div className="bg-white dark:bg-[#0A162B] rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200/80 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-4">Prefeitura / Órgão</th>
                  <th className="py-3 px-4">Contato / Cargo</th>
                  <th className="py-3 px-4">WhatsApp</th>
                  <th className="py-3 px-4">Telefone Fixo</th>
                  <th className="py-3 px-4">E-mail (Completo)</th>
                  <th className="py-3 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                {contatosFiltrados.map(contato => {
                  const linkWhats = contato.whatsapp
                    ? gerarLinkWhatsApp(contato.whatsapp, contato.nomeContato, contato.prefeitura)
                    : '';

                  return (
                    <tr
                      key={contato.id}
                      className="hover:bg-slate-50/70 dark:hover:bg-white/5 transition-colors"
                    >
                      {/* Prefeitura */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleToggleFavorito(contato)}
                            className="text-slate-300 hover:text-amber-400"
                            title="Favoritar"
                          >
                            <Star
                              className={`w-3.5 h-3.5 ${
                                contato.favorito ? 'fill-amber-400 text-amber-400' : ''
                              }`}
                            />
                          </button>
                          <div>
                            <span className="font-bold text-slate-900 dark:text-white block">
                              {contato.prefeitura}
                            </span>
                            {contato.cidadeUf && (
                              <span className="text-[11px] text-slate-400 block">
                                {contato.cidadeUf}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Contato & Cargo */}
                      <td className="py-3 px-4">
                        <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                          {contato.nomeContato}
                        </span>
                        {contato.cargoSetor && (
                          <span className="text-[11px] text-slate-400 block">
                            {contato.cargoSetor}
                          </span>
                        )}
                      </td>

                      {/* WhatsApp */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {contato.whatsapp ? (
                          <a
                            href={linkWhats}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-all active:scale-95"
                          >
                            <WhatsAppIcon className="w-3.5 h-3.5" />
                            <span>{contato.whatsapp}</span>
                          </a>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>

                      {/* Fixo */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {contato.telefoneFixo ? (
                          <span className="font-mono text-slate-700 dark:text-slate-300">
                            {contato.telefoneFixo}
                            {contato.ramal ? ` R.${contato.ramal}` : ''}
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>

                      {/* E-mail Completo */}
                      <td className="py-3 px-4">
                        {contato.email ? (
                          <div className="flex items-center gap-1.5">
                            <a
                              href={`mailto:${contato.email}`}
                              className="text-blue-600 dark:text-blue-400 hover:underline font-medium select-all"
                            >
                              {contato.email}
                            </a>
                            <button
                              type="button"
                              onClick={() => copiarTexto(contato.email!, `tbl_mail_${contato.id}`)}
                              className="p-1 text-slate-400 hover:text-blue-600"
                              title="Copiar e-mail"
                            >
                              {copiadoId === `tbl_mail_${contato.id}` ? (
                                <Check className="w-3 h-3 text-emerald-500" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>

                      {/* Ações */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => abrirModalEditar(contato)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-white/5"
                            title="Editar"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setContatoParaExcluir(contato);
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 cursor-pointer"
                            title="Excluir"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal para Adicionar / Editar Contato */}
      {modalAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-[#0A162B] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="p-4 border-b border-slate-200 dark:border-white/10 flex items-center justify-between sticky top-0 bg-white dark:bg-[#0A162B] z-10">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                    {contatoEdicao ? 'Editar Contato' : 'Novo Contato de Prefeitura'}
                  </h2>
                  <p className="text-[11px] text-slate-400">
                    Cadastre o WhatsApp, telefone e e-mail do responsável
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalAberto(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Formulário */}
            <form onSubmit={handleSalvarForm} className="p-5 space-y-3.5">
              {/* Nome da Prefeitura */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Nome da Prefeitura / Órgão <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  list="lista-prefeituras-crm"
                  required
                  value={formPrefeitura}
                  onChange={e => setFormPrefeitura(e.target.value)}
                  placeholder="Ex: Prefeitura Municipal de Cerqueira César"
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                />
                <datalist id="lista-prefeituras-crm">
                  {prefeiturasCrm.map((p, i) => (
                    <option key={i} value={p} />
                  ))}
                </datalist>
              </div>

              {/* Nome do Contato e Cargo */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Nome do Contato <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formNomeContato}
                    onChange={e => setFormNomeContato(e.target.value)}
                    placeholder="Ex: Carlos (Pregoeiro)"
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Cargo / Setor
                  </label>
                  <input
                    type="text"
                    value={formCargoSetor}
                    onChange={e => setFormCargoSetor(e.target.value)}
                    placeholder="Ex: Compras, Pregoeiro"
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                  />
                </div>
              </div>

              {/* WhatsApp em destaque */}
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 space-y-1.5">
                <label className="block text-xs font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                  <WhatsAppIcon className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>WhatsApp (com DDD)</span>
                </label>
                <input
                  type="text"
                  value={formWhatsapp}
                  onChange={e => setFormWhatsapp(aplicarMascaraTelefone(e.target.value))}
                  placeholder="(17) 99876-5432"
                  className="w-full px-3 py-2 text-xs rounded-lg bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-600/50 text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Fixo e Ramal */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Telefone Fixo
                  </label>
                  <input
                    type="text"
                    value={formTelefoneFixo}
                    onChange={e => setFormTelefoneFixo(aplicarMascaraTelefone(e.target.value))}
                    placeholder="(17) 3645-1200"
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Ramal
                  </label>
                  <input
                    type="text"
                    value={formRamal}
                    onChange={e => setFormRamal(e.target.value)}
                    placeholder="204"
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                  />
                </div>
              </div>

              {/* E-mail e Cidade */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    E-mail
                  </label>
                  <input
                    type="email"
                    value={formEmail}
                    onChange={e => setFormEmail(e.target.value)}
                    placeholder="licitacao@prefeitura.sp.gov.br"
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Cidade - UF
                  </label>
                  <input
                    type="text"
                    value={formCidadeUf}
                    onChange={e => setFormCidadeUf(e.target.value)}
                    placeholder="São Paulo - SP"
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                  />
                </div>
              </div>

              {/* Checkbox Favorito */}
              <label className="flex items-center gap-2 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={formFavorito}
                  onChange={e => setFormFavorito(e.target.checked)}
                  className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500"
                />
                <span className="text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                  Marcar como contato favorito
                </span>
              </label>

              {/* Botões */}
              <div className="pt-3 border-t border-slate-200 dark:border-white/10 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalAberto(false)}
                  className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold shadow-xs cursor-pointer"
                >
                  {contatoEdicao ? 'Salvar Alterações' : 'Cadastrar Contato'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Confirmação de Exclusão (100% Funcional e compatível com iframes) */}
      {contatoParaExcluir && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-[#0A162B] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-md w-full p-5 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-start gap-3.5">
              <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-900/50 shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Excluir Contato?
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  Tem certeza que deseja excluir o contato de{' '}
                  <strong className="text-slate-900 dark:text-white font-semibold">
                    {contatoParaExcluir.nomeContato}
                  </strong>{' '}
                  ({contatoParaExcluir.prefeitura})?
                </p>
                <p className="text-[11px] text-rose-600 dark:text-rose-400 mt-2 font-medium">
                  Esta ação não poderá ser desfeita.
                </p>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-white/5 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setContatoParaExcluir(null)}
                className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={async (e) => {
                  e.stopPropagation();
                  const idExcluir = String(contatoParaExcluir.id);
                  setContatoParaExcluir(null);
                  await onExcluirContato(idExcluir);
                }}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-95 text-white text-xs font-bold shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Sim, Excluir</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
