/* ai.js — talking to Claude straight from the phone.

   There is no backend. The request goes from Safari to api.anthropic.com using
   a key you paste in yourself, which is why the key never leaves this device and
   why there is no subscription attached to this app.

   If you would rather not put a key in at all, every screen that calls this file
   also offers "copy context" — the same prompt, on your clipboard, ready to paste
   into the Claude app. The coach still works, it just has a manual step. */

import { get } from './store.js';
import { systemPrompt } from './context.js';

const URL = 'https://api.anthropic.com/v1/messages';
const VERSION = '2023-06-01';

/* Server-side fallback: if a safety classifier ever declines a request, the API
   re-routes it rather than handing back an empty reply. */
const BETAS = 'server-side-fallback-2026-07-01';

export const MODELS = [
  { id: 'claude-opus-5',      label: 'Claude Opus 5',   note: 'Best judgement. The default.' },
  { id: 'claude-sonnet-5',    label: 'Claude Sonnet 5', note: 'Faster and cheaper, still very good.' },
  { id: 'claude-haiku-4-5',   label: 'Claude Haiku 4.5', note: 'Cheapest and quickest. Blunter advice.' }
];

// Haiku does not accept the effort control; everything else does.
const takesEffort = model => !/haiku/i.test(model);

export class AiError extends Error {
  constructor(message, kind) { super(message); this.kind = kind; }
}

function headers(apiKey) {
  return {
    'content-type': 'application/json',
    'x-api-key': apiKey,
    'anthropic-version': VERSION,
    'anthropic-beta': BETAS,
    'anthropic-dangerous-direct-browser-access': 'true'
  };
}

function body(messages, { model, effort, stream }) {
  const out = {
    model,
    max_tokens: 8000,
    system: systemPrompt(),
    messages: messages.slice(-20).map(m => ({ role: m.role, content: m.content })),
    fallbacks: 'default'
  };
  if (stream) out.stream = true;
  if (takesEffort(model)) out.output_config = { effort: effort || 'low' };
  return out;
}

async function describeFailure(res) {
  let detail = '';
  try { detail = (await res.json())?.error?.message || ''; } catch { /* body was not JSON */ }
  if (res.status === 401) return new AiError('That API key was rejected. Check it under Me → AI coach.', 'auth');
  if (res.status === 403) return new AiError('That key is not allowed to use this model.', 'auth');
  if (res.status === 429) return new AiError('Rate limited. Give it a minute and try again.', 'rate');
  if (res.status >= 500)  return new AiError('Anthropic had a problem at their end. Try again shortly.', 'server');
  if (/credit|balance/i.test(detail)) return new AiError('Your Anthropic account is out of credit.', 'credit');
  return new AiError(detail || `Request failed (${res.status}).`, 'api');
}

/**
 * Stream a reply.
 * @param messages  [{role:'user'|'assistant', content:string}]
 * @param onText    called with each chunk of text as it arrives
 * @param signal    AbortSignal, so the Stop button works
 * @returns the full reply
 */
export async function ask(messages, onText, signal) {
  const s = get();
  const apiKey = (s.settings.apiKey || '').trim();
  if (!apiKey) throw new AiError('No API key saved yet. Add one under Me → AI coach, or use "Copy context" instead.', 'nokey');

  let res;
  try {
    res = await fetch(URL, {
      method: 'POST', signal, headers: headers(apiKey),
      body: JSON.stringify(body(messages, { model: s.settings.model, effort: s.settings.effort, stream: true }))
    });
  } catch (err) {
    if (err.name === 'AbortError') throw err;
    throw new AiError('Could not reach Anthropic. Check your connection.', 'network');
  }

  if (!res.ok) throw await describeFailure(res);

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '', full = '', refused = false;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const lines = buffer.split('\n');
    buffer = lines.pop();                       // hold the partial line back

    for (const line of lines) {
      if (!line.startsWith('data:')) continue;
      const payload = line.slice(5).trim();
      if (!payload || payload === '[DONE]') continue;

      let evt;
      try { evt = JSON.parse(payload); } catch { continue; }

      if (evt.type === 'content_block_delta' && evt.delta?.type === 'text_delta') {
        full += evt.delta.text;
        onText(evt.delta.text);
      } else if (evt.type === 'message_delta' && evt.delta?.stop_reason === 'refusal') {
        refused = true;
      } else if (evt.type === 'error') {
        throw new AiError(evt.error?.message || 'The stream failed part way through.', 'api');
      }
    }
  }

  if (refused && !full.trim()) {
    throw new AiError('The model declined to answer that one. Try rephrasing it.', 'refusal');
  }
  if (!full.trim()) throw new AiError('Nothing came back. Try asking again.', 'empty');
  return full;
}

/** A cheap round trip to confirm a pasted key actually works. */
export async function testKey(apiKey, model) {
  try {
    const res = await fetch(URL, {
      method: 'POST',
      headers: headers(apiKey.trim()),
      body: JSON.stringify({
        model: model || 'claude-opus-5',
        max_tokens: 16,
        messages: [{ role: 'user', content: 'Reply with one word: ready' }]
      })
    });
    if (res.ok) return { ok: true };
    const err = await describeFailure(res);
    return { ok: false, message: err.message };
  } catch {
    return { ok: false, message: 'Could not reach Anthropic. Check your connection.' };
  }
}
