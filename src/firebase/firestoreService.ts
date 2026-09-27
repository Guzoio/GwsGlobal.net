import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  getDocs,
  writeBatch,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType, auth } from './config';
import { Licitacao, ItemLicitacao, PapelTimbradoConfig, AcessoConfig } from '../types';

const LICITACOES_COL = 'licitacoes';
const ITENS_COL = 'itens';
const CONFIG_COL = 'configuracoes';

// Ouvir licitações em tempo real
export function ouvirLicitacoesNuvem(
  onUpdate: (licitacoes: Licitacao[]) => void,
  onError?: (err: any) => void
): () => void {
  const colRef = collection(db, LICITACOES_COL);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const lista: Licitacao[] = [];
      snapshot.forEach((d) => {
        const data = d.data();
        lista.push({
          id: data.id,
          orgao: data.orgao,
          processo_pregao: data.processo_pregao,
          modalidade: data.modalidade,
          data_cadastro: data.data_cadastro,
          responsavel: data.responsavel || 'Gustavo',
          status: data.status,
        });
      });
      // Ordena por ID decrescente
      lista.sort((a, b) => b.id - a.id);
      onUpdate(lista);
    },
    (error) => {
      console.warn('Aviso sincronização licitações:', error.message);
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.LIST, LICITACOES_COL);
    }
  );
}

// Ouvir itens em tempo real
export function ouvirItensNuvem(
  onUpdate: (itens: ItemLicitacao[]) => void,
  onError?: (err: any) => void
): () => void {
  const colRef = collection(db, ITENS_COL);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const lista: ItemLicitacao[] = [];
      snapshot.forEach((d) => {
        const data = d.data();
        lista.push({
          id: data.id,
          licitacao_id: data.licitacao_id,
          num_item: data.num_item,
          descricao_curta: data.descricao_curta,
          descricao_tecnica: data.descricao_tecnica,
          marca: data.marca,
          quantidade: data.quantidade,
          valor_unitario: data.valor_unitario,
          valor_total: data.valor_total,
          lance_minimo: data.lance_minimo,
          lance_lote: data.lance_lote,
          link_produto: data.link_produto,
          caminho_imagem: data.caminho_imagem,
          selecionado: data.selecionado !== false,
        });
      });
      onUpdate(lista);
    },
    (error) => {
      console.warn('Aviso sincronização itens:', error.message);
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.LIST, ITENS_COL);
    }
  );
}

// Ouvir papel timbrado em tempo real
export function ouvirPapelTimbradoNuvem(
  onUpdate: (config: PapelTimbradoConfig) => void,
  onError?: (err: any) => void
): () => void {
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
      console.warn('Aviso sincronização timbrado:', error.message);
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.GET, `${CONFIG_COL}/papel_timbrado`);
    }
  );
}

// Ouvir lista de responsáveis em tempo real
export function ouvirResponsaveisNuvem(
  onUpdate: (responsaveis: string[]) => void,
  onError?: (err: any) => void
): () => void {
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
      console.warn('Aviso sincronização responsáveis:', error.message);
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.GET, `${CONFIG_COL}/lista_responsaveis`);
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
      responsavel: lic.responsavel || 'Gustavo',
      status: lic.status || 'Ativa',
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// Excluir licitação na nuvem
export async function removerLicitacaoNuvem(licId: number): Promise<void> {
  const path = `${LICITACOES_COL}/${licId}`;
  try {
    await deleteDoc(doc(db, LICITACOES_COL, String(licId)));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
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
      lance_minimo: Number(item.lance_minimo) || 0,
      lance_lote: Number(item.lance_lote) || 0,
      link_produto: item.link_produto || '',
      caminho_imagem: item.caminho_imagem || '',
      selecionado: item.selecionado !== false,
      updatedAt: new Date().toISOString(),
    });
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

// Excluir todos os itens de uma licitação na nuvem
export async function removerItensDaLicitacaoNuvem(licId: number, itens: ItemLicitacao[]): Promise<void> {
  const itensParaRemover = itens.filter((i) => i.licitacao_id === licId);
  for (const it of itensParaRemover) {
    await removerItemNuvem(it.id);
  }
}

// Salvar configurações de papel timbrado
export async function salvarPapelTimbradoNuvem(config: PapelTimbradoConfig): Promise<void> {
  const path = `${CONFIG_COL}/papel_timbrado`;
  try {
    await setDoc(doc(db, CONFIG_COL, 'papel_timbrado'), {
      ...config,
      updatedAt: new Date().toISOString(),
    });
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
      console.warn('Aviso sincronização segurança:', error.message);
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.GET, `${CONFIG_COL}/seguranca`);
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

// Sincronizar dados locais com a nuvem na primeira conexão
export async function sincronizarBancoInicialSeVazio(
  licsLocais: Licitacao[],
  itensLocais: ItemLicitacao[],
  timbradoLocal: PapelTimbradoConfig,
  responsaveisLocais: string[]
): Promise<void> {
  try {
    const licsSnap = await getDocs(collection(db, LICITACOES_COL));
    if (licsSnap.empty && licsLocais.length > 0) {
      for (const lic of licsLocais) {
        await salvarLicitacaoNuvem(lic);
      }
      for (const item of itensLocais) {
        await salvarItemNuvem(item);
      }
      await salvarPapelTimbradoNuvem(timbradoLocal);
      await salvarResponsaveisNuvem(responsaveisLocais);
    }
  } catch (err) {
    console.warn('Não foi possível inicializar banco nuvem:', err);
  }
}
