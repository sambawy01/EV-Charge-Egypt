// LLM client — abstracts the underlying provider so all AI Edge Functions
// route through one swap-point. Currently targets Ollama Cloud (Turbo).
//
// Env vars (set via `supabase secrets set`):
//   OLLAMA_API_KEY  — required. From https://ollama.com/settings/keys
//   OLLAMA_MODEL    — optional, default 'gpt-oss:120b'. Other good choices:
//                       'gpt-oss:20b'       (faster, cheaper)
//                       'qwen3-coder:480b'  (best at tool-use / JSON)
//                       'kimi-k2:1t'        (largest, best at long-context)
//                       'llama3.1:70b'      (open licensed)
//                       'deepseek-v3.1:671b' (strong reasoning)
//   OLLAMA_BASE_URL — optional, default 'https://ollama.com'. Override for
//                       self-hosted Ollama instances.

export type LlmMessage = { role: 'system' | 'user' | 'assistant'; content: string };

export interface LlmCallOptions {
  /** Messages in conversational order. System message (if any) should be first. */
  messages: LlmMessage[];
  /** Maximum tokens the model may emit. Maps to Ollama `options.num_predict`. */
  maxTokens?: number;
  /** Lower is more deterministic. JSON-output endpoints should use 0 or 0.1. */
  temperature?: number;
  /** Hard timeout for the HTTP request. */
  timeoutMs?: number;
  /** Caller name for log breadcrumbs ("ai-chat", "ai-cost-optimizer", ...). */
  caller?: string;
}

export interface LlmCallResult {
  /** The model's text response. Empty string if the model returned no text. */
  text: string;
  /** Raw response body for debug logging. NEVER return this to the client. */
  raw: unknown;
}

export class LlmError extends Error {
  status: number;
  body: string;
  constructor(message: string, status: number, body: string) {
    super(message);
    this.status = status;
    this.body = body;
  }
}

const DEFAULT_TIMEOUT_MS = 20_000;
const DEFAULT_MODEL = 'gpt-oss:120b';
const DEFAULT_BASE = 'https://ollama.com';

/**
 * Call the Ollama Cloud chat API. Throws LlmError on non-2xx or timeout.
 * Returns the model's text response.
 *
 * The Ollama chat API accepts {role:'system'|'user'|'assistant', content} —
 * the same shape we use internally — so no message transformation is needed.
 */
export async function callLlm(opts: LlmCallOptions): Promise<LlmCallResult> {
  const apiKey = Deno.env.get('OLLAMA_API_KEY');
  if (!apiKey) {
    throw new LlmError('OLLAMA_API_KEY env var not set', 500, '');
  }
  const model = Deno.env.get('OLLAMA_MODEL') || DEFAULT_MODEL;
  const baseUrl = Deno.env.get('OLLAMA_BASE_URL') || DEFAULT_BASE;
  const timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const caller = opts.caller ?? 'unknown';

  const body: Record<string, unknown> = {
    model,
    messages: opts.messages,
    stream: false,
  };
  // Ollama puts generation knobs under `options`.
  const options: Record<string, unknown> = {};
  if (typeof opts.maxTokens === 'number') options.num_predict = opts.maxTokens;
  if (typeof opts.temperature === 'number') options.temperature = opts.temperature;
  if (Object.keys(options).length > 0) body.options = options;

  let response: Response;
  try {
    response = await fetch(`${baseUrl}/api/chat`, {
      method: 'POST',
      signal: AbortSignal.timeout(timeoutMs),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    throw new LlmError(`Upstream LLM request failed (${caller}): ${msg}`, 504, '');
  }

  if (!response.ok) {
    const text = await response.text().catch(() => '<no body>');
    throw new LlmError(
      `Upstream LLM ${response.status} (${caller})`,
      response.status,
      text.slice(0, 500),
    );
  }

  const data = await response.json();
  // Ollama response shape: { model, created_at, message: {role, content}, done, ... }
  const content = data?.message?.content;
  const text = typeof content === 'string' ? content : '';
  return { text, raw: data };
}

/**
 * Extract the first JSON object/array from a model reply that may include
 * prose around it (e.g. ```json fences, leading explanation, etc.).
 * Returns null if no parsable JSON is found.
 */
export function extractJson<T = unknown>(text: string): T | null {
  if (!text) return null;
  // Try the whole string first — covers the clean case where the model
  // returned JSON only.
  try {
    return JSON.parse(text) as T;
  } catch {
    /* fall through */
  }
  // Look for the first JSON object or array literal.
  const match = text.match(/[\[\{][\s\S]*[\]\}]/);
  if (!match) return null;
  try {
    return JSON.parse(match[0]) as T;
  } catch {
    return null;
  }
}
