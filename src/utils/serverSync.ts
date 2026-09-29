import { Licitacao, ItemLicitacao, PapelTimbradoConfig, AcessoConfig } from '../types';
import { salvarLicitacoes, salvarItens, salvarPapelTimbradoConfig, salvarResponsaveis, salvarAcessoConfig } from './storage';

export interface SyncState {
  licitacoes: Licitacao[];
  itens: ItemLicitacao[];
  timbrado: PapelTimbradoConfig;
  responsaveis: string[];
  seguranca?: AcessoConfig;
  updatedAt?: string;
}

type SyncCallback = (data: {
  tipo: 'full' | 'licitacoes' | 'itens' | 'item' | 'licitacao' | 'timbrado' | 'responsaveis';
  licitacoes?: Licitacao[];
  itens?: ItemLicitacao[];
  timbrado?: PapelTimbradoConfig;
  responsaveis?: string[];
}) => void;

class ServerSyncManager {
  private eventSource: EventSource | null = null;
  private listeners: Set<SyncCallback> = new Set();
  private reconnectTimer: any = null;
  private isConnected: boolean = false;

  public subscribe(cb: SyncCallback): () => void {
    this.listeners.add(cb);
    return () => {
      this.listeners.delete(cb);
    };
  }

  private notify(data: any) {
    this.listeners.forEach(cb => {
      try {
        cb(data);
      } catch (err) {
        console.warn('Erro ao processar atualização em tempo real:', err);
      }
    });
  }

  public start() {
    if (typeof window === 'undefined') return;
    this.connect();
  }

  private connect() {
    if (this.eventSource) {
      try {
        this.eventSource.close();
      } catch {}
    }

    try {
      this.eventSource = new EventSource('/api/sync/stream');

      this.eventSource.onopen = () => {
        this.isConnected = true;
        console.log('[Sync] Conectado ao servidor de sincronização em tempo real multi-usuário.');
      };

      this.eventSource.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload && payload.tipo) {
            this.notify(payload);
          }
        } catch (e) {
          console.warn('[Sync] Falha ao processar evento recebido do servidor:', e);
        }
      };

      this.eventSource.onerror = () => {
        this.isConnected = false;
        try {
          this.eventSource?.close();
        } catch {}
        this.eventSource = null;
        // Reconexão automática em 3 segundos
        clearTimeout(this.reconnectTimer);
        this.reconnectTimer = setTimeout(() => {
          this.connect();
        }, 3000);
      };
    } catch (err) {
      console.warn('[Sync] Não foi possível abrir SSE, tentando novamente:', err);
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = setTimeout(() => {
        this.connect();
      }, 4000);
    }
  }

  public stop() {
    clearTimeout(this.reconnectTimer);
    if (this.eventSource) {
      try {
        this.eventSource.close();
      } catch {}
      this.eventSource = null;
    }
    this.isConnected = false;
  }
}

export const syncManager = new ServerSyncManager();

/**
 * Busca o estado completo mais recente armazenado no servidor
 */
export async function obterEstadoServidor(): Promise<SyncState | null> {
  try {
    const res = await fetch('/api/sync/state');
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data = await res.json();
    return data;
  } catch (err) {
    console.warn('[Sync] Aviso ao buscar estado do servidor:', err);
    return null;
  }
}

/**
 * Envia e mescla o estado local com o servidor (garante que itens adicionados offline ou antes sejam consolidados para todos)
 */
export async function mesclarEstadoComServidor(dadosLocais: {
  licitacoes: Licitacao[];
  itens: ItemLicitacao[];
  timbrado?: PapelTimbradoConfig;
  responsaveis?: string[];
}): Promise<SyncState | null> {
  try {
    const res = await fetch('/api/sync/merge', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dadosLocais),
    });
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data = await res.json();
    return data;
  } catch (err) {
    console.warn('[Sync] Aviso ao mesclar dados com o servidor:', err);
    return null;
  }
}

/**
 * Salva ou atualiza uma licitação no servidor e dispara atualização imediata para todos os outros computadores
 */
export async function salvarLicitacaoServidor(lic: Licitacao): Promise<boolean> {
  try {
    const res = await fetch('/api/sync/licitacao', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(lic),
    });
    return res.ok;
  } catch (err) {
    console.warn('[Sync] Erro ao salvar licitação no servidor:', err);
    return false;
  }
}

/**
 * Exclui uma licitação no servidor
 */
export async function removerLicitacaoServidor(licId: number): Promise<boolean> {
  try {
    const res = await fetch(`/api/sync/licitacao/${licId}`, {
      method: 'DELETE',
    });
    return res.ok;
  } catch (err) {
    console.warn('[Sync] Erro ao excluir licitação no servidor:', err);
    return false;
  }
}

/**
 * Salva ou atualiza um item no servidor e atualiza instantaneamente todos os computadores
 */
export async function salvarItemServidor(item: ItemLicitacao): Promise<boolean> {
  try {
    const res = await fetch('/api/sync/item', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item),
    });
    return res.ok;
  } catch (err) {
    console.warn('[Sync] Erro ao salvar item no servidor:', err);
    return false;
  }
}

/**
 * Salva múltiplos itens em lote (usado no botão Salvar Proposta) e sincroniza instantaneamente
 */
export async function salvarItensLoteServidor(itens: ItemLicitacao[]): Promise<boolean> {
  try {
    const res = await fetch('/api/sync/itens-batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ itens }),
    });
    return res.ok;
  } catch (err) {
    console.warn('[Sync] Erro ao salvar lote de itens no servidor:', err);
    return false;
  }
}

/**
 * Exclui um item no servidor
 */
export async function removerItemServidor(itemId: number): Promise<boolean> {
  try {
    const res = await fetch(`/api/sync/item/${itemId}`, {
      method: 'DELETE',
    });
    return res.ok;
  } catch (err) {
    console.warn('[Sync] Erro ao excluir item no servidor:', err);
    return false;
  }
}

/**
 * Salva configurações (papel timbrado, responsáveis ou segurança) no servidor
 */
export async function salvarConfigServidor(tipo: 'timbrado' | 'responsaveis' | 'seguranca', dados: any): Promise<boolean> {
  try {
    const res = await fetch(`/api/sync/config/${tipo}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dados),
    });
    return res.ok;
  } catch (err) {
    console.warn(`[Sync] Erro ao salvar ${tipo} no servidor:`, err);
    return false;
  }
}
