export type ThemeMode = 'light' | 'dark';

export const THEME_STORAGE_KEY = 'gws_tema_modo';

/**
 * Retorna o tema salvo no navegador do usuário ('light' ou 'dark')
 * Não necessita de nuvem - salvo no localStorage do dispositivo.
 */
export function obterTema(): ThemeMode {
  if (typeof window === 'undefined') return 'light';
  try {
    const salvo = localStorage.getItem(THEME_STORAGE_KEY);
    if (salvo === 'dark' || salvo === 'light') {
      return salvo;
    }
    // Opcional: verificar se o sistema operacional prefere tema escuro
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
  } catch {
    // fallback seguro
  }
  return 'light';
}

/**
 * Aplica a classe 'dark' no elemento raiz HTML e salva a preferência
 */
export function aplicarTema(tema: ThemeMode): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(THEME_STORAGE_KEY, tema);
  } catch {
    // ignorar erros de storage restrito
  }

  const root = document.documentElement;
  if (tema === 'dark') {
    root.classList.add('dark');
    root.setAttribute('data-theme', 'dark');
    root.style.colorScheme = 'dark';
  } else {
    root.classList.remove('dark');
    root.setAttribute('data-theme', 'light');
    root.style.colorScheme = 'light';
  }
}

/**
 * Alterna entre claro e escuro e retorna o novo tema
 */
export function alternarTema(): ThemeMode {
  const temaAtual = obterTema();
  const novoTema = temaAtual === 'dark' ? 'light' : 'dark';
  aplicarTema(novoTema);
  return novoTema;
}

export const TEMA_NATAL_STORAGE_KEY = 'gws_tema_natal_ativo';

/**
 * Retorna se o tema especial de Natal está ativado (padrão: true)
 */
export function obterTemaNatal(): boolean {
  if (typeof window === 'undefined') return true;
  try {
    const salvo = localStorage.getItem(TEMA_NATAL_STORAGE_KEY);
    if (salvo !== null) {
      return salvo === 'true';
    }
  } catch {}
  return true; // Ativo por padrão conforme solicitação do usuário
}

/**
 * Salva a preferência do tema natalino
 */
export function salvarTemaNatal(ativo: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(TEMA_NATAL_STORAGE_KEY, String(ativo));
  } catch {}
}

/**
 * Alterna o tema de Natal (liga/desliga enfeites e neve)
 */
export function alternarTemaNatal(): boolean {
  const atual = obterTemaNatal();
  const novo = !atual;
  salvarTemaNatal(novo);
  return novo;
}
