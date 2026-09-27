import { AcessoConfig } from '../types';

export const ID_PADRAO = 'gwsglobal';
export const HASH_PADRAO = '93c443aebd50f1eab9f124a758f0d46728c01156b88ff0e8bae8068f52ef34c1';

export const ACESSO_INICIAL: AcessoConfig = {
  usuarioId: ID_PADRAO,
  senhaHash: HASH_PADRAO,
};

/**
 * Gera um hash criptográfico SHA-256 seguro com salting para a senha.
 * Funciona de forma nativa no navegador via Web Crypto API.
 */
export async function gerarHashSenha(senha: string): Promise<string> {
  const encoder = new TextEncoder();
  const dados = encoder.encode(`gws_salt_2026_${senha.trim()}`);
  const hashBuffer = await crypto.subtle.digest('SHA-256', dados);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Valida a senha digitada comparando o hash criptográfico calculado com o hash armazenado.
 */
export async function verificarSenha(
  senhaDigitada: string,
  hashArmazenado?: string
): Promise<boolean> {
  if (!senhaDigitada) return false;
  const hashCalculado = await gerarHashSenha(senhaDigitada);
  const hashAlvo = hashArmazenado || HASH_PADRAO;
  return hashCalculado === hashAlvo;
}
