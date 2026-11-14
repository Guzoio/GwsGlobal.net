import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  getDocs,
  query,
  where,
  writeBatch,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './config';
import { Licitacao, ItemLicitacao, PapelTimbradoConfig, AcessoConfig, ContatoPrefeitura, Cobranca } from '../types';
import { compararLicitacoesPorDataCadastroDesc } from '../utils/numberToWordsPtBr';

const LICITACOES_COL = 'licitacoes';
const ITENS_COL = 'itens';
const CONTATOS_COL = 'contatos';
const COBRANCAS_COL = 'cobrancas';
const CONFIG_COL = 'configuracoes';

function removerUndefined<T extends Record<string, any>>(obj: T): Partial<T> {
  const limpo: Record<string, any> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) {
      limpo[k] = v;
    }
  }
  return limpo as Partial<T>;
}

// Ouvir licitações em tempo real (qualquer inserção, alteração ou exclusão reflete instantaneamente)
export function ouvirLicitacoesNuvem(
  onUpdate: (licitacoes: Licitacao[], excluidos?: number[]) => void,
  onError?: (err: any) => void
): () => void {
  const colRef = collection(db, LICITACOES_COL);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const removidos: number[] = [];
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'removed') {
          removidos.push(Number(change.doc.data().id ?? change.doc.id));
        }
      });
      const lista: Licitacao[] = [];
      snapshot.forEach((d) => {
        const data = d.data();
        lista.push({
          id: Number(data.id ?? d.id),
          orgao: data.orgao || '',
          processo_pregao: data.processo_pregao || '',
          modalidade: data.modalidade || 'Pregão Eletrônico',
          data_cadastro: data.data_cadastro || '',
          data_proposta: data.data_proposta || undefined,
          responsavel: data.responsavel || 'Gustavo',
          status: data.status,
          acompanhamento: data.acompanhamento !== undefined ? Boolean(data.acompanhamento) : undefined,
          homologada: data.homologada !== undefined ? Boolean(data.homologada) : undefined,
          uf: data.uf || undefined,
          avisoData: data.avisoData || undefined,
          avisoHora: data.avisoHora || undefined,
          avisoMensagem: data.avisoMensagem || undefined,
          avisoConcluido: data.avisoConcluido !== undefined ? Boolean(data.avisoConcluido) : undefined,
          plataforma: data.plataforma || 'BLL',
          updatedAt: data.updatedAt || undefined,
        });
      });
      lista.sort(compararLicitacoesPorDataCadastroDesc);
      onUpdate(lista, removidos);
    },
    (error) => {
      onError?.(error);
      handleFirestoreError(error, OperationType.GET, LICITACOES_COL);
    }
  );
}

// Ouvir itens de licitação em tempo real
export function ouvirItensNuvem(
  onUpdate: (itens: ItemLicitacao[], excluidos?: number[]) => void,
  onError?: (err: any) => void
): () => void {
  const colRef = collection(db, ITENS_COL);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const removidos: number[] = [];
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'removed') {
          removidos.push(Number(change.doc.data().id ?? change.doc.id));
        }
      });
      const lista: ItemLicitacao[] = [];
      snapshot.forEach((d) => {
        const data = d.data();
        lista.push({
          id: Number(data.id ?? d.id),
          licitacao_id: Number(data.licitacao_id),
          num_item: Number(data.num_item),
          descricao_curta: data.descricao_curta || '',
          descricao_tecnica: data.descricao_tecnica || '',
          marca: data.marca || '',
          quantidade: Number(data.quantidade) || 0,
          valor_unitario: Number(data.valor_unitario) || 0,
          valor_total: Number(data.valor_total) || 0,
          lance_minimo: data.lance_minimo !== undefined && Number(data.lance_minimo) > 0 ? Number(data.lance_minimo) : undefined,
          lance_lote: data.lance_lote !== undefined && Number(data.lance_lote) > 0 ? Number(data.lance_lote) : undefined,
          link_produto: data.link_produto || '',
          caminho_imagem: data.caminho_imagem || '',
          selecionado: data.selecionado !== false,
          observacoes: data.observacoes || '',
          custo_fornecedor: data.custo_fornecedor !== undefined && Number(data.custo_fornecedor) > 0 ? Number(data.custo_fornecedor) : undefined,
          valor_ganho: data.valor_ganho !== undefined && Number(data.valor_ganho) > 0 ? Number(data.valor_ganho) : undefined,
          aliquota_imposto: data.aliquota_imposto !== undefined ? Number(data.aliquota_imposto) : undefined,
          outros_custos: data.outros_custos !== undefined ? Number(data.outros_custos) : undefined,
        });
      });
      onUpdate(lista, removidos);
    },
    (error) => {
      onError?.(error);
      handleFirestoreError(error, OperationType.GET, ITENS_COL);
    }
  );
}

// Salvar múltiplos itens em lote (Batch write) no Firestore
export async function salvarTodosItensNuvem(itens: ItemLicitacao[]): Promise<void> {
  if (!itens || itens.length === 0) return;
  const chunkSize = 400;
  try {
    for (let i = 0; i < itens.length; i += chunkSize) {
      const chunk = itens.slice(i, i + chunkSize);
      const batch = writeBatch(db);
      for (const item of chunk) {
        const docRef = doc(db, ITENS_COL, String(item.id));
        batch.set(docRef, {
          id: Number(item.id),
          licitacao_id: Number(item.licitacao_id),
          num_item: Number(item.num_item),
          descricao_curta: item.descricao_curta || '',
          descricao_tecnica: item.descricao_tecnica || '',
          marca: item.marca || '',
          quantidade: Number(item.quantidade) || 0,
          valor_unitario: Number(item.valor_unitario) || 0,
          valor_total: Number(item.valor_total) || 0,
          lance_minimo: item.lance_minimo !== undefined && Number(item.lance_minimo) > 0 ? Number(item.lance_minimo) : 0,
          lance_lote: item.lance_lote !== undefined && Number(item.lance_lote) > 0 ? Number(item.lance_lote) : 0,
          link_produto: item.link_produto || '',
          caminho_imagem: (item.caminho_imagem && item.caminho_imagem.length < 500000) ? item.caminho_imagem : '',
          selecionado: item.selecionado !== false,
          observacoes: item.observacoes || '',
          custo_fornecedor: Number(item.custo_fornecedor) || 0,
          valor_ganho: Number(item.valor_ganho) || 0,
          aliquota_imposto: item.aliquota_imposto !== undefined ? Number(item.aliquota_imposto) : 10,
          outros_custos: Number(item.outros_custos) || 0,
          updatedAt: new Date().toISOString(),
        }, { merge: true });
      }
      await batch.commit();
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, ITENS_COL);
  }
}

// Ouvir papel timbrado em tempo real
export function ouvirPapelTimbradoNuvem(
  onUpdate: (config: PapelTimbradoConfig) => void,
  onError?: (err: any) => void
): () => void {
  const path = `${CONFIG_COL}/papel_timbrado`;
  const docRef = doc(db, CONFIG_COL, 'papel_timbrado');
  return onSnapshot(
    docRef,
    (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data() as PapelTimbradoConfig;
        onUpdate(data);
      }
    },
    (error) => {
      onError?.(error);
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
}

// Ouvir lista de responsáveis em tempo real
export function ouvirResponsaveisNuvem(
  onUpdate: (responsaveis: string[]) => void,
  onError?: (err: any) => void
): () => void {
  const path = `${CONFIG_COL}/lista_responsaveis`;
  const docRef = doc(db, CONFIG_COL, 'lista_responsaveis');
  return onSnapshot(
    docRef,
    (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        if (data && typeof data.nomes === 'string') {
          try {
            const parsed = JSON.parse(data.nomes);
            if (Array.isArray(parsed)) onUpdate(parsed);
          } catch {
            onUpdate(data.nomes.split(',').map((s: string) => s.trim()));
          }
        }
      }
    },
    (error) => {
      onError?.(error);
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
}

// Salvar ou atualizar licitação na nuvem
export async function salvarLicitacaoNuvem(lic: Licitacao): Promise<void> {
  const path = `${LICITACOES_COL}/${lic.id}`;
  try {
    await setDoc(doc(db, LICITACOES_COL, String(lic.id)), {
      id: Number(lic.id),
      orgao: lic.orgao || '',
      processo_pregao: lic.processo_pregao || '',
      modalidade: lic.modalidade || 'Pregão Eletrônico',
      data_cadastro: lic.data_cadastro || '',
      data_proposta: lic.data_proposta || '',
      responsavel: lic.responsavel || 'Gustavo',
      status: lic.status || 'Ativa',
      acompanhamento: Boolean(lic.acompanhamento),
      homologada: Boolean(lic.homologada),
      uf: lic.uf || 'SP',
      avisoData: lic.avisoData || '',
      avisoHora: lic.avisoHora || '',
      avisoMensagem: lic.avisoMensagem || '',
      avisoConcluido: Boolean(lic.avisoConcluido),
      plataforma: lic.plataforma || 'BLL',
      updatedAt: lic.updatedAt || new Date().toISOString(),
    }, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// Excluir licitação na nuvem com remoção atômica de todos os itens associados
export async function removerLicitacaoNuvem(licId: number): Promise<void> {
  const path = `${LICITACOES_COL}/${licId}`;
  try {
    const refsParaDeletar = [doc(db, LICITACOES_COL, String(licId))];

    const qNum = query(collection(db, ITENS_COL), where('licitacao_id', '==', Number(licId)));
    const snapNum = await getDocs(qNum);
    snapNum.forEach((d) => {
      refsParaDeletar.push(d.ref);
    });

    const chunkSize = 400;
    for (let i = 0; i < refsParaDeletar.length; i += chunkSize) {
      const chunk = refsParaDeletar.slice(i, i + chunkSize);
      const batch = writeBatch(db);
      chunk.forEach(ref => batch.delete(ref));
      await batch.commit();
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// Renumerar ID de licitação na nuvem, transferindo todos os itens associados de forma atômica
export async function trocarIdLicitacaoNuvem(
  idAntigo: number,
  idNovo: number,
  licAtualizada: Licitacao,
  itensDaLic: ItemLicitacao[]
): Promise<void> {
  const path = `${LICITACOES_COL}/${idNovo}`;
  try {
    const nowIso = new Date().toISOString();
    const batchPrincipal = writeBatch(db);

    // 1. Cria a licitação com o novo ID
    const novaLicRef = doc(db, LICITACOES_COL, String(idNovo));
    batchPrincipal.set(novaLicRef, {
      id: Number(idNovo),
      orgao: licAtualizada.orgao || '',
      processo_pregao: licAtualizada.processo_pregao || '',
      modalidade: licAtualizada.modalidade || 'Pregão Eletrônico',
      data_cadastro: licAtualizada.data_cadastro || '',
      data_proposta: licAtualizada.data_proposta || '',
      responsavel: licAtualizada.responsavel || 'Gustavo',
      status: licAtualizada.status || 'Ativa',
      acompanhamento: Boolean(licAtualizada.acompanhamento),
      homologada: Boolean(licAtualizada.homologada),
      uf: licAtualizada.uf || 'SP',
      avisoData: licAtualizada.avisoData || '',
      avisoHora: licAtualizada.avisoHora || '',
      avisoMensagem: licAtualizada.avisoMensagem || '',
      avisoConcluido: Boolean(licAtualizada.avisoConcluido),
      plataforma: licAtualizada.plataforma || 'BLL',
      updatedAt: nowIso,
    });

    // 2. Remove o documento antigo da licitação
    const antigaLicRef = doc(db, LICITACOES_COL, String(idAntigo));
    batchPrincipal.delete(antigaLicRef);

    // 3. Coleta todos os itens vinculados (em memória + nuvem) para atualização garantida
    const idsItens = new Set<string>(itensDaLic.map(it => String(it.id)));
    const qAntigos = query(collection(db, ITENS_COL), where('licitacao_id', '==', Number(idAntigo)));
    const snapAntigos = await getDocs(qAntigos);
    snapAntigos.forEach(d => idsItens.add(d.id));

    const itemIdsLista = Array.from(idsItens);
    const firstChunk = itemIdsLista.slice(0, 350);
    firstChunk.forEach(itemIdStr => {
      batchPrincipal.set(
        doc(db, ITENS_COL, itemIdStr),
        { licitacao_id: Number(idNovo), updatedAt: nowIso },
        { merge: true }
      );
    });
    await batchPrincipal.commit();

    // Lotes adicionais caso haja mais de 350 itens
    for (let i = 350; i < itemIdsLista.length; i += 400) {
      const chunk = itemIdsLista.slice(i, i + 400);
      const batchExtra = writeBatch(db);
      chunk.forEach(itemIdStr => {
        batchExtra.set(
          doc(db, ITENS_COL, itemIdStr),
          { licitacao_id: Number(idNovo), updatedAt: nowIso },
          { merge: true }
        );
      });
      await batchExtra.commit();
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// Salvar ou atualizar item na nuvem
export async function salvarItemNuvem(item: ItemLicitacao): Promise<void> {
  const path = `${ITENS_COL}/${item.id}`;
  try {
    await setDoc(doc(db, ITENS_COL, String(item.id)), {
      id: Number(item.id),
      licitacao_id: Number(item.licitacao_id),
      num_item: Number(item.num_item),
      descricao_curta: item.descricao_curta || '',
      descricao_tecnica: item.descricao_tecnica || '',
      marca: item.marca || '',
      quantidade: Number(item.quantidade) || 0,
      valor_unitario: Number(item.valor_unitario) || 0,
      valor_total: Number(item.valor_total) || 0,
      lance_minimo: item.lance_minimo !== undefined && Number(item.lance_minimo) > 0 ? Number(item.lance_minimo) : 0,
      lance_lote: item.lance_lote !== undefined && Number(item.lance_lote) > 0 ? Number(item.lance_lote) : 0,
      link_produto: item.link_produto || '',
      caminho_imagem: (item.caminho_imagem && item.caminho_imagem.length < 500000) ? item.caminho_imagem : '',
      selecionado: item.selecionado !== false,
      observacoes: item.observacoes || '',
      custo_fornecedor: Number(item.custo_fornecedor) || 0,
      valor_ganho: Number(item.valor_ganho) || 0,
      aliquota_imposto: item.aliquota_imposto !== undefined ? Number(item.aliquota_imposto) : 10,
      outros_custos: Number(item.outros_custos) || 0,
      updatedAt: new Date().toISOString(),
    }, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// Excluir item na nuvem
export async function removerItemNuvem(itemId: number): Promise<void> {
  const path = `${ITENS_COL}/${itemId}`;
  try {
    await deleteDoc(doc(db, ITENS_COL, String(itemId)));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// Salvar configurações de papel timbrado
export async function salvarPapelTimbradoNuvem(config: PapelTimbradoConfig): Promise<void> {
  const path = `${CONFIG_COL}/papel_timbrado`;
  try {
    await setDoc(doc(db, CONFIG_COL, 'papel_timbrado'), removerUndefined({
      ...config,
      updatedAt: new Date().toISOString(),
    }));
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// Salvar lista de responsáveis
export async function salvarResponsaveisNuvem(responsaveis: string[]): Promise<void> {
  const path = `${CONFIG_COL}/lista_responsaveis`;
  try {
    await setDoc(doc(db, CONFIG_COL, 'lista_responsaveis'), {
      nomes: JSON.stringify(responsaveis),
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// Ouvir credenciais de acesso/segurança em tempo real
export function ouvirAcessoConfigNuvem(
  onUpdate: (config: AcessoConfig) => void,
  onError?: (err: any) => void
): () => void {
  const path = `${CONFIG_COL}/seguranca`;
  const docRef = doc(db, CONFIG_COL, 'seguranca');
  return onSnapshot(
    docRef,
    (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        if (data && data.usuarioId && (data.senhaHash || data.senha)) {
          onUpdate({
            usuarioId: data.usuarioId,
            senhaHash: data.senhaHash || data.senha,
            atualizadoEm: data.atualizadoEm,
          });
        }
      }
    },
    (error) => {
      onError?.(error);
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
}

// Salvar credenciais de acesso/segurança na nuvem
export async function salvarAcessoConfigNuvem(config: AcessoConfig): Promise<void> {
  const path = `${CONFIG_COL}/seguranca`;
  try {
    await setDoc(doc(db, CONFIG_COL, 'seguranca'), {
      usuarioId: config.usuarioId,
      senhaHash: config.senhaHash,
      atualizadoEm: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// Ouvir contatos de prefeituras em tempo real na nuvem
export function ouvirContatosNuvem(
  onUpdate: (contatos: ContatoPrefeitura[], excluidos?: string[]) => void,
  onError?: (err: any) => void
): () => void {
  const colRef = collection(db, CONTATOS_COL);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const removidos: string[] = [];
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'removed') {
          removidos.push(String(change.doc.data().id ?? change.doc.id));
        }
      });
      const lista: ContatoPrefeitura[] = [];
      snapshot.forEach((d) => {
        const data = d.data();
        lista.push({
          id: String(data.id ?? d.id),
          prefeitura: data.prefeitura || '',
          cidadeUf: data.cidadeUf || '',
          nomeContato: data.nomeContato || '',
          cargoSetor: data.cargoSetor || '',
          whatsapp: data.whatsapp || '',
          telefoneFixo: data.telefoneFixo || '',
          ramal: data.ramal || '',
          email: data.email || '',
          observacoes: data.observacoes || '',
          favorito: Boolean(data.favorito),
          dataCadastro: data.dataCadastro || new Date().toISOString(),
          licitacaoId: data.licitacaoId !== undefined && data.licitacaoId !== null ? Number(data.licitacaoId) : undefined,
        });
      });
      lista.sort((a, b) => {
        if (a.favorito && !b.favorito) return -1;
        if (!a.favorito && b.favorito) return 1;
        return a.prefeitura.localeCompare(b.prefeitura);
      });
      onUpdate(lista, removidos);
    },
    (error) => {
      onError?.(error);
      handleFirestoreError(error, OperationType.GET, CONTATOS_COL);
    }
  );
}

// Salvar ou atualizar contato de prefeitura na nuvem
export async function salvarContatoNuvem(contato: ContatoPrefeitura): Promise<void> {
  const path = `${CONTATOS_COL}/${contato.id}`;
  try {
    await setDoc(doc(db, CONTATOS_COL, String(contato.id)), {
      id: String(contato.id),
      prefeitura: contato.prefeitura || '',
      cidadeUf: contato.cidadeUf || '',
      nomeContato: contato.nomeContato || '',
      cargoSetor: contato.cargoSetor || '',
      whatsapp: contato.whatsapp || '',
      telefoneFixo: contato.telefoneFixo || '',
      ramal: contato.ramal || '',
      email: contato.email || '',
      observacoes: contato.observacoes || '',
      favorito: Boolean(contato.favorito),
      dataCadastro: contato.dataCadastro || new Date().toISOString(),
      licitacaoId: contato.licitacaoId !== undefined ? Number(contato.licitacaoId) : null,
      updatedAt: new Date().toISOString(),
    }, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// Excluir contato de prefeitura na nuvem
export async function removerContatoNuvem(contatoId: string): Promise<void> {
  const path = `${CONTATOS_COL}/${contatoId}`;
  try {
    await deleteDoc(doc(db, CONTATOS_COL, String(contatoId)));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// ====================================================================
// MÓDULO DE COBRANÇAS & PAGAMENTOS NA NUVEM
// ====================================================================

// Ouvir cobranças em tempo real na nuvem
export function ouvirCobrancasNuvem(
  onUpdate: (cobrancas: Cobranca[], excluidos?: string[]) => void,
  onError?: (err: any) => void
): () => void {
  const colRef = collection(db, COBRANCAS_COL);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const removidos: string[] = [];
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'removed') {
          removidos.push(String(change.doc.data().id ?? change.doc.id));
        }
      });
      const lista: Cobranca[] = [];
      snapshot.forEach((d) => {
        const data = d.data();
        lista.push({
          id: String(data.id ?? d.id),
          prefeitura: data.prefeitura || '',
          responsavel: data.responsavel || undefined,
          processo: data.processo || undefined,
          licitacaoId: data.licitacaoId !== undefined && data.licitacaoId !== null ? Number(data.licitacaoId) : undefined,
          ordemFornecimento: data.ordemFornecimento || undefined,
          numeroNota: data.numeroNota || undefined,
          produto: data.produto || '',
          quantidade: data.quantidade !== undefined && data.quantidade !== null ? Number(data.quantidade) : undefined,
          valorNota: Number(data.valorNota) || 0,
          observacoes: data.observacoes || undefined,

          dataEnvioProdutos: data.dataEnvioProdutos || undefined,
          dataPrevisaoEntrega: data.dataPrevisaoEntrega || undefined,
          dataRealEntrega: data.dataRealEntrega || undefined,
          produtoRecebido: Boolean(data.produtoRecebido),

          dataEnvioNota: data.dataEnvioNota || undefined,
          notaEnviada: Boolean(data.notaEnviada),

          diasLiquidacao: Number(data.diasLiquidacao) || 7,
          tipoDiasLiquidacao: (data.tipoDiasLiquidacao as any) || 'uteis',
          eventoInicioLiquidacao: (data.eventoInicioLiquidacao as any) || 'entrega',
          dataRealLiquidacao: data.dataRealLiquidacao || undefined,
          liquidado: Boolean(data.liquidado),

          diasPagamento: Number(data.diasPagamento) || 5,
          tipoDiasPagamento: (data.tipoDiasPagamento as any) || 'corridos',
          eventoInicioPagamento: (data.eventoInicioPagamento as any) || 'liquidacao',
          dataRealPagamento: data.dataRealPagamento || undefined,
          pago: Boolean(data.pago),

          criadoEm: data.criadoEm || new Date().toISOString(),
          atualizadoEm: data.atualizadoEm || new Date().toISOString(),
        });
      });
      lista.sort((a, b) => b.criadoEm.localeCompare(a.criadoEm));
      onUpdate(lista, removidos);
    },
    (error) => {
      onError?.(error);
      handleFirestoreError(error, OperationType.GET, COBRANCAS_COL);
    }
  );
}

// Salvar ou atualizar cobrança na nuvem
export async function salvarCobrancaNuvem(cobranca: Cobranca): Promise<void> {
  const path = `${COBRANCAS_COL}/${cobranca.id}`;
  try {
    const docRef = doc(db, COBRANCAS_COL, String(cobranca.id));
    await setDoc(docRef, removerUndefined({
      ...cobranca,
      id: String(cobranca.id),
      valorNota: Number(cobranca.valorNota) || 0,
      updatedAt: new Date().toISOString(),
    }), { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// Excluir cobrança na nuvem
export async function removerCobrancaNuvem(cobrancaId: string): Promise<void> {
  const path = `${COBRANCAS_COL}/${cobrancaId}`;
  try {
    await deleteDoc(doc(db, COBRANCAS_COL, String(cobrancaId)));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}
