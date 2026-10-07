/**
 * IndexedDB Image Store para persistência duradoura de imagens do catálogo e propostas.
 * O localStorage dos navegadores possui um teto rígido de ~5MB.
 * O IndexedDB permite centenas de megabytes, garantindo que imagens de produtos
 * nunca sumam e permaneçam salvas com segurança no navegador.
 */

const DB_NAME = 'gws_licitacoes_db';
const DB_VERSION = 1;
const STORE_NAME = 'imagens_itens';

function abrirBanco(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB não suportado neste navegador'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Salva uma imagem vinculada ao ID do item no IndexedDB
 */
export async function salvarImagemItemIndexedDB(itemId: number | string, imagemBase64: string): Promise<void> {
  try {
    if (!imagemBase64) return;
    const db = await abrirBanco();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const req = store.put({ id: Number(itemId), imagem: imagemBase64, dataSalvo: Date.now() });

      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Aviso IndexedDB ao salvar imagem:', err);
  }
}

/**
 * Salva lote de imagens de itens no IndexedDB
 */
export async function salvarLoteImagensIndexedDB(itens: { id: number; caminho_imagem?: string }[]): Promise<void> {
  try {
    const db = await abrirBanco();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);

      for (const item of itens) {
        if (item.caminho_imagem && item.caminho_imagem.startsWith('data:image')) {
          store.put({ id: Number(item.id), imagem: item.caminho_imagem, dataSalvo: Date.now() });
        }
      }

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  } catch (err) {
    console.warn('Aviso IndexedDB ao salvar lote de imagens:', err);
  }
}

/**
 * Recupera a imagem de um item pelo seu ID
 */
export async function obterImagemItemIndexedDB(itemId: number | string): Promise<string | null> {
  try {
    const db = await abrirBanco();
    return new Promise((resolve) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const req = store.get(Number(itemId));

      req.onsuccess = () => {
        if (req.result && req.result.imagem) {
          resolve(req.result.imagem);
        } else {
          resolve(null);
        }
      };
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

/**
 * Recupera todas as imagens salvas no IndexedDB em um mapa { [id]: imagemBase64 }
 */
export async function obterTodasImagensIndexedDB(): Promise<Record<number, string>> {
  try {
    const db = await abrirBanco();
    return new Promise((resolve) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const req = store.getAll();

      req.onsuccess = () => {
        const resultado: Record<number, string> = {};
        if (Array.isArray(req.result)) {
          for (const reg of req.result) {
            if (reg && reg.id && reg.imagem) {
              resultado[reg.id] = reg.imagem;
            }
          }
        }
        resolve(resultado);
      };
      req.onerror = () => resolve({});
    });
  } catch {
    return {};
  }
}

/**
 * Remove imagem de um item excluído
 */
export async function removerImagemItemIndexedDB(itemId: number | string): Promise<void> {
  try {
    const db = await abrirBanco();
    return new Promise((resolve) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const req = store.delete(Number(itemId));
      req.onsuccess = () => resolve();
      req.onerror = () => resolve();
    });
  } catch {
    // ignora
  }
}
