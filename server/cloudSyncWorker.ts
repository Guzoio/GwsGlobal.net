import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, setDoc, deleteDoc } from 'firebase/firestore';

export interface SyncQueueItem {
  opId: string;
  entityType: 'licitacao' | 'item' | 'contato' | 'cobranca' | 'timbrado' | 'responsaveis' | 'seguranca';
  entityId: string | number;
  action: 'upsert' | 'delete';
  version: number;
  payload?: any;
  createdAt: string;
  attempts: number;
  lastAttemptAt?: string;
  lastError?: string;
  status: 'pending' | 'in_flight' | 'synced' | 'failed';
}

export type NuvemStatusTipo = 'sincronizado' | 'aguardando_nuvem' | 'cota_esgotada' | 'offline' | 'erro';

export interface CloudSyncStatus {
  servidorOnline: boolean;
  nuvemStatus: NuvemStatusTipo;
  filaPendente: number;
  totalOperacoes: number;
  ultimaSincronizacao?: string;
  ultimoErro?: string | null;
  ultimaTentativa?: string;
  detalhes?: string;
}

export interface TombstoneRecord {
  entityType: string;
  id: string | number;
  version: number;
  deletedAt: string;
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'sistema_db.json');
const DB_BACKUP_FILE = path.join(DATA_DIR, 'sistema_db.backup.json');
const QUEUE_FILE = path.join(DATA_DIR, 'sync_queue.json');

// Garante que a pasta data exista
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

/**
 * Gravação atômica em disco para evitar corrupção em caso de queda de energia ou reinício abrupto.
 * Grava em arquivo temporário (.tmp) e realiza substituição atômica via fs.renameSync.
 */
export function salvarArquivoAtomico(caminhoArquivo: string, conteudoObj: any): boolean {
  const tmpPath = `${caminhoArquivo}.${crypto.randomBytes(6).toString('hex')}.tmp`;
  try {
    const raw = JSON.stringify(conteudoObj, null, 2);
    fs.writeFileSync(tmpPath, raw, 'utf8');
    fs.renameSync(tmpPath, caminhoArquivo);
    return true;
  } catch (err) {
    console.error(`[Atomic File] Erro ao gravar atomicamente ${caminhoArquivo}:`, err);
    try {
      if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath);
    } catch {}
    return false;
  }
}

/**
 * Criação e atualização periódica de cópia de segurança (backup)
 */
export function atualizarBackupDb(dbData: any) {
  try {
    salvarArquivoAtomico(DB_BACKUP_FILE, dbData);
  } catch (err) {
    console.warn('[Backup] Aviso ao criar backup do banco:', err);
  }
}

/**
 * Carrega a fila durável do disco
 */
export function carregarFilaDisco(): SyncQueueItem[] {
  if (fs.existsSync(QUEUE_FILE)) {
    try {
      const raw = fs.readFileSync(QUEUE_FILE, 'utf8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.map((item: any) => ({
          ...item,
          status: item.status === 'in_flight' ? 'pending' : item.status, // Restaura itens que estavam em voo no momento do reinício
        }));
      }
    } catch (err) {
      console.warn('[Sync Queue] Aviso ao ler sync_queue.json:', err);
    }
  }
  return [];
}

/**
 * Salva a fila durável no disco
 */
export function salvarFilaDisco(fila: SyncQueueItem[]): boolean {
  return salvarArquivoAtomico(QUEUE_FILE, fila);
}

/**
 * Inicialização do cliente Firebase Firestore no ambiente Node.js
 */
function obterInstanciaFirestoreNode() {
  const cfgPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
  if (!fs.existsSync(cfgPath)) {
    console.warn('[Cloud Sync Worker] firebase-applet-config.json não encontrado.');
    return null;
  }

  try {
    const rawCfg = fs.readFileSync(cfgPath, 'utf8');
    const firebaseConfig = JSON.parse(rawCfg);

    let app;
    const APP_NAME = 'gws_node_cloud_sync';
    const apps = getApps();
    const existing = apps.find(a => a.name === APP_NAME);
    if (existing) {
      app = existing;
    } else {
      app = initializeApp(firebaseConfig, APP_NAME);
    }

    const firestoreDb = getFirestore(app, firebaseConfig.firestoreDatabaseId);
    return firestoreDb;
  } catch (err) {
    console.error('[Cloud Sync Worker] Falha ao inicializar Firebase no Node:', err);
    return null;
  }
}

/**
 * Gerenciador da Fila e Worker de Sincronização em Segundo Plano
 */
export class CloudSyncWorker {
  private fila: SyncQueueItem[] = [];
  private emExecucao = false;
  private nuvemStatus: NuvemStatusTipo = 'sincronizado';
  private ultimoErro: string | null = null;
  private ultimaSincronizacao: string | null = null;
  private ultimaTentativa: string | null = null;
  private tempoEsperaMs = 5000;
  private proximaTentativaEm = 0;
  private totalProcessadas = 0;
  private firestoreDb: any = null;
  private onStatusChangeCallback?: (status: CloudSyncStatus) => void;

  constructor() {
    this.fila = carregarFilaDisco();
    if (this.fila.length > 0) {
      this.nuvemStatus = 'aguardando_nuvem';
      console.log(`[Cloud Sync Worker] Fila durável carregada do disco: ${this.fila.length} operações pendentes para a nuvem.`);
    }
    this.firestoreDb = obterInstanciaFirestoreNode();

    // Inicia verificação contínua em segundo plano
    setInterval(() => {
      this.processarProximoDaFila();
    }, 5000);
  }

  public setStatusListener(cb: (status: CloudSyncStatus) => void) {
    this.onStatusChangeCallback = cb;
  }

  private notificarMudancaStatus() {
    if (this.onStatusChangeCallback) {
      this.onStatusChangeCallback(this.obterStatus());
    }
  }

  public obterStatus(): CloudSyncStatus {
    const pendentes = this.fila.filter(i => i.status === 'pending' || i.status === 'in_flight' || i.status === 'failed').length;
    let statusAtual = this.nuvemStatus;
    if (pendentes > 0 && statusAtual === 'sincronizado') {
      statusAtual = 'aguardando_nuvem';
    }

    let detalhes = 'Operações sincronizadas em tempo real.';
    if (statusAtual === 'cota_esgotada') {
      detalhes = 'Cota diária do Firebase atingida. Todas as operações estão salvas no servidor Node e serão sincronizadas assim que a cota liberar.';
    } else if (statusAtual === 'aguardando_nuvem') {
      detalhes = `${pendentes} operação(ões) aguardando confirmação do Firestore.`;
    } else if (statusAtual === 'offline') {
      detalhes = 'Firestore inacessível temporariamente. O servidor Node continua gravando localmente sem perda de dados.';
    }

    return {
      servidorOnline: true,
      nuvemStatus: statusAtual,
      filaPendente: pendentes,
      totalOperacoes: this.totalProcessadas,
      ultimaSincronizacao: this.ultimaSincronizacao || undefined,
      ultimoErro: this.ultimoErro,
      ultimaTentativa: this.ultimaTentativa || undefined,
      detalhes,
    };
  }

  /**
   * Enfileira uma nova operação de gravação ou exclusão.
   * Persiste no disco imediatamente antes de retornar confirmação.
   */
  public enfileirarOperacao(
    entityType: 'licitacao' | 'item' | 'contato' | 'cobranca' | 'timbrado' | 'responsaveis' | 'seguranca',
    entityId: string | number,
    action: 'upsert' | 'delete',
    version: number,
    payload?: any
  ): string {
    const opId = `op_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    
    // Deduplica operações pendentes anteriores para o mesmo registro e ação
    this.fila = this.fila.filter(item => {
      if (item.entityType === entityType && String(item.entityId) === String(entityId) && item.status === 'pending') {
        // Se já havia uma atualização anterior pendente para esse mesmo ID, a nova versão a substitui
        return false;
      }
      return true;
    });

    const item: SyncQueueItem = {
      opId,
      entityType,
      entityId,
      action,
      version,
      payload: payload ? JSON.parse(JSON.stringify(payload)) : undefined,
      createdAt: new Date().toISOString(),
      attempts: 0,
      status: 'pending',
    };

    this.fila.push(item);
    salvarFilaDisco(this.fila);

    this.nuvemStatus = 'aguardando_nuvem';
    this.notificarMudancaStatus();

    // Dispara tentativa imediata se não estiver em backoff de cota
    if (Date.now() >= this.proximaTentativaEm) {
      setImmediate(() => this.processarProximoDaFila());
    }

    return opId;
  }

  /**
   * Mapeamento de coleções do Firestore
   */
  private obterNomeColecao(entityType: string): string {
    switch (entityType) {
      case 'licitacao': return 'licitacoes';
      case 'item': return 'itens';
      case 'contato': return 'contatos';
      case 'cobranca': return 'cobrancas';
      case 'timbrado':
      case 'responsaveis':
      case 'seguranca':
        return 'configuracoes';
      default: return entityType;
    }
  }

  /**
   * Executa a operação contra o Firestore com controle de erros e backoff
   */
  public async processarProximoDaFila() {
    if (this.emExecucao) return;
    if (this.fila.length === 0) {
      if (this.nuvemStatus !== 'sincronizado') {
        this.nuvemStatus = 'sincronizado';
        this.notificarMudancaStatus();
      }
      return;
    }

    // Se estiver em período de espera/backoff por cota esgotada
    if (Date.now() < this.proximaTentativaEm) {
      return;
    }

    if (!this.firestoreDb) {
      this.firestoreDb = obterInstanciaFirestoreNode();
      if (!this.firestoreDb) {
        this.nuvemStatus = 'offline';
        this.ultimoErro = 'Configuração do Firebase indisponível no servidor Node.';
        this.proximaTentativaEm = Date.now() + 10000;
        this.notificarMudancaStatus();
        return;
      }
    }

    const item = this.fila.find(i => i.status === 'pending' || i.status === 'failed');
    if (!item) {
      // Se não há itens pendentes, limpa os finalizados
      this.fila = this.fila.filter(i => i.status !== 'synced');
      salvarFilaDisco(this.fila);
      this.nuvemStatus = 'sincronizado';
      this.notificarMudancaStatus();
      return;
    }

    this.emExecucao = true;
    item.status = 'in_flight';
    item.attempts += 1;
    item.lastAttemptAt = new Date().toISOString();
    this.ultimaTentativa = item.lastAttemptAt;

    try {
      const colName = this.obterNomeColecao(item.entityType);
      let docId = String(item.entityId);
      if (item.entityType === 'timbrado') docId = 'papel_timbrado';
      if (item.entityType === 'responsaveis') docId = 'lista_responsaveis';
      if (item.entityType === 'seguranca') docId = 'seguranca';

      const docRef = doc(this.firestoreDb, colName, docId);

      if (item.action === 'delete') {
        await deleteDoc(docRef);
        console.log(`[Cloud Sync Worker] Exclusão sincronizada com o Firestore: ${colName}/${docId} (versão ${item.version}).`);
      } else {
        // Upsert idempotente com versão e carimbo temporal
        const payloadComVersao = {
          ...(item.payload || {}),
          version: item.version,
          updatedAt: item.payload?.updatedAt || new Date().toISOString(),
        };
        await setDoc(docRef, payloadComVersao, { merge: true });
        console.log(`[Cloud Sync Worker] Registro sincronizado com o Firestore: ${colName}/${docId} (versão ${item.version}).`);
      }

      // Sucesso na gravação no Firestore!
      this.totalProcessadas += 1;
      this.ultimaSincronizacao = new Date().toISOString();
      this.ultimoErro = null;
      this.tempoEsperaMs = 5000; // Reseta backoff
      this.proximaTentativaEm = 0;

      // Remove da fila durável
      this.fila = this.fila.filter(i => i.opId !== item.opId);
      salvarFilaDisco(this.fila);

      if (this.fila.length === 0) {
        this.nuvemStatus = 'sincronizado';
      } else {
        this.nuvemStatus = 'aguardando_nuvem';
      }
      this.notificarMudancaStatus();

    } catch (err: any) {
      const errMsg = err?.message || String(err);
      const isQuota = errMsg.includes('resource-exhausted') || 
                      errMsg.includes('Quota exceeded') || 
                      errMsg.includes('Quota limit exceeded') ||
                      err?.code === 'resource-exhausted';

      item.status = 'failed';
      item.lastError = errMsg;
      this.ultimoErro = errMsg;

      if (isQuota) {
        this.nuvemStatus = 'cota_esgotada';
        // Backoff exponencial para cota: 30s -> 60s -> 120s -> máx 5min
        this.tempoEsperaMs = Math.min(this.tempoEsperaMs * 2, 300000);
        this.proximaTentativaEm = Date.now() + this.tempoEsperaMs;
        console.warn(`[Cloud Sync Worker] Cota diária do Firebase atingida. Operação ${item.opId} mantida na fila do Node. Próxima tentativa em ${Math.round(this.tempoEsperaMs / 1000)}s.`);
      } else {
        this.nuvemStatus = 'offline';
        this.tempoEsperaMs = Math.min(this.tempoEsperaMs * 1.5, 60000);
        this.proximaTentativaEm = Date.now() + this.tempoEsperaMs;
        console.warn(`[Cloud Sync Worker] Erro ao sincronizar com Firestore: ${errMsg}. Próxima tentativa em ${Math.round(this.tempoEsperaMs / 1000)}s.`);
      }

      salvarFilaDisco(this.fila);
      this.notificarMudancaStatus();
    } finally {
      this.emExecucao = false;
      // Se houver mais itens e não estiver em backoff de cota, processa o próximo
      if (this.fila.length > 0 && Date.now() >= this.proximaTentativaEm) {
        setImmediate(() => this.processarProximoDaFila());
      }
    }
  }
}

export const cloudSyncWorker = new CloudSyncWorker();
