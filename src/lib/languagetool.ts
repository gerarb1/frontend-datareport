// ─────────────────────────────────────────────────────────────
// languagetool.ts — Servicio para consumir la API de
// LanguageTool y detectar errores ortográficos / gramaticales.
// ─────────────────────────────────────────────────────────────

import type { LanguageToolResponse, LanguageToolMatch } from './types';

const LANGUAGETOOL_URL =
  import.meta.env.PUBLIC_LANGUAGETOOL_URL ?? 'https://api.languagetool.org/v2/check';

export interface CheckResult {
  matches: LanguageToolMatch[];
  totalErrors: number;
  language: string;
}

/**
 * Analiza texto con LanguageTool.
 * POST /v2/check con body x-www-form-urlencoded.
 */
export async function checkText(
  text: string,
  language = 'es',
): Promise<CheckResult> {
  if (!text.trim()) {
    return { matches: [], totalErrors: 0, language };
  }

  // LanguageTool tiene un límite práctico de ~20 000 caracteres
  // en el endpoint gratuito. Truncamos si es necesario.
  const safeText = text.length > 20_000 ? text.slice(0, 20_000) : text;

  const body = new URLSearchParams({
    text: safeText,
    language,
    enabledOnly: 'false',
  });

  const res = await fetch(LANGUAGETOOL_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });

  if (!res.ok) {
    throw new Error(`LanguageTool error: ${res.status} ${res.statusText}`);
  }

  const data: LanguageToolResponse = await res.json();

  return {
    matches: data.matches,
    totalErrors: data.matches.length,
    language: data.language?.name ?? language,
  };
}

/**
 * Aplica resaltado en HTML al texto con errores marcados.
 * Cada error se envuelve en un <mark> con clases para estilización.
 */
export function highlightErrors(text: string, matches: LanguageToolMatch[]): string {
  if (!matches.length) return escapeHtml(text);

  // Ordenar por offset descendente para reemplazar de atrás hacia adelante
  const sorted = [...matches].sort((a, b) => b.offset - a.offset);

  let result = text;
  for (const match of sorted) {
    const before = result.slice(0, match.offset);
    const error = result.slice(match.offset, match.offset + match.length);
    const after = result.slice(match.offset + match.length);

    const escapedError = escapeHtml(error);
    const title = escapeHtml(match.message);
    const suggestion = match.replacements[0]?.value
      ? ` data-suggestion="${escapeHtml(match.replacements[0].value)}"`
      : '';

    result =
      before +
      `<mark class="lt-error" title="${title}"${suggestion}>${escapedError}</mark>` +
      after;
  }

  return result;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
