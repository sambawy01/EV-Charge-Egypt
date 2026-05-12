/**
 * process-payment
 *
 * Hardened wallet top-up / refund endpoint.
 *
 * Security model:
 *  - JWT auth required. `userId` is taken from the verified token, never the body.
 *  - All wallet mutations go through the `credit_wallet_atomic` RPC which:
 *      * enforces wallet ownership (wallet.user_id == auth.uid())
 *      * upserts on (wallet_id, idempotency_key) so retries are safe
 *      * updates balance + records a transaction in a single TX
 *  - Body is strictly validated (type, range, allow-lists).
 *  - Gateway integration is gated behind PAYMENT_GATEWAY_MODE=live. Until then
 *    we explicitly return `{ simulated: true }` so callers can detect dev mode.
 */

import { serve } from 'https://deno.land/std@0.208.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';
import {
  corsHeaders,
  getAuthedUser,
  isUuid,
  jsonError,
  newRequestId,
} from '../_shared/auth.ts';

const ALLOWED_TYPES = ['topup', 'refund'] as const;
const ALLOWED_METHODS = ['fawry', 'paymob', 'card', 'wallet'] as const;
const MAX_AMOUNT = 100_000; // EGP

type TxType = (typeof ALLOWED_TYPES)[number];
type TxMethod = (typeof ALLOWED_METHODS)[number];

serve(async (req: Request) => {
  const origin = req.headers.get('origin');
  const requestId = req.headers.get('x-request-id') ?? newRequestId();

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders(origin) });
  }
  if (req.method !== 'POST') {
    return jsonError('Method not allowed', 405, origin, requestId);
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !anonKey || !serviceKey) {
    console.error('[process-payment] missing env vars');
    return jsonError('Service misconfigured', 500, origin, requestId);
  }

  // 1) Auth
  const auth = await getAuthedUser(req, supabaseUrl, anonKey);
  if ('error' in auth) return auth.error;
  const { user } = auth;

  // 2) Parse + validate body
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError('Invalid JSON body', 400, origin, requestId);
  }
  if (!body || typeof body !== 'object') {
    return jsonError('Invalid body', 400, origin, requestId);
  }

  const {
    walletId,
    amount,
    method,
    type,
    idempotencyKey,
  } = body as Record<string, unknown>;

  if (!isUuid(walletId)) {
    return jsonError('walletId must be a UUID', 400, origin, requestId);
  }
  if (typeof amount !== 'number' || !Number.isFinite(amount) || amount <= 0) {
    return jsonError('amount must be a positive number', 400, origin, requestId);
  }
  if (amount > MAX_AMOUNT) {
    return jsonError(
      `amount exceeds maximum of ${MAX_AMOUNT}`,
      400,
      origin,
      requestId,
    );
  }
  if (typeof type !== 'string' || !ALLOWED_TYPES.includes(type as TxType)) {
    return jsonError(
      `type must be one of: ${ALLOWED_TYPES.join(', ')}`,
      400,
      origin,
      requestId,
    );
  }
  if (
    typeof method !== 'string' ||
    !ALLOWED_METHODS.includes(method as TxMethod)
  ) {
    return jsonError(
      `method must be one of: ${ALLOWED_METHODS.join(', ')}`,
      400,
      origin,
      requestId,
    );
  }
  if (
    typeof idempotencyKey !== 'string' ||
    idempotencyKey.length < 8 ||
    idempotencyKey.length > 128
  ) {
    return jsonError(
      'idempotencyKey is required (8-128 chars)',
      400,
      origin,
      requestId,
    );
  }

  // 3) Gateway integration
  const gatewayMode = Deno.env.get('PAYMENT_GATEWAY_MODE') ?? 'simulate';

  if (gatewayMode === 'live') {
    // Real Paymob/Fawry/etc integration is a follow-up. Refuse to silently
    // credit wallets without actually moving money.
    return jsonError(
      'Live payment gateway not yet implemented',
      501,
      origin,
      requestId,
    );
  }

  // Simulate mode: generate a cryptographically random reference id and
  // continue to the atomic credit RPC.
  const paymentRef = `PAY-SIM-${Date.now()}-${crypto.randomUUID()}`;

  // 4) Atomic wallet credit via service-role RPC. The RPC checks ownership
  //    and de-duplicates on idempotency_key.
  const svc = createClient(supabaseUrl, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });

  const { data, error } = await svc.rpc('credit_wallet_atomic', {
    p_user_id: user.id,
    p_wallet_id: walletId,
    p_amount: amount,
    p_type: type,
    p_method: method,
    p_reference_id: paymentRef,
    p_idempotency_key: idempotencyKey,
  });

  if (error) {
    console.error(
      `[process-payment] credit_wallet_atomic failed reqId=${requestId} user=${user.id}:`,
      error.message,
    );
    // Map known SQLSTATEs to user-facing errors without leaking internals.
    // P0001 (raise_exception) is what PL/pgSQL throws.
    if (error.code === 'P0001' || error.code === '42501') {
      return jsonError(
        'Wallet not found or not owned by caller',
        403,
        origin,
        requestId,
      );
    }
    return jsonError('Payment failed', 500, origin, requestId);
  }

  // The RPC returns a JSON row { transaction_id, new_balance, duplicate }.
  const result = data as
    | { transaction_id: string; new_balance: number; duplicate: boolean }
    | null;
  if (!result) {
    console.error(
      `[process-payment] empty RPC result reqId=${requestId}`,
    );
    return jsonError('Payment failed', 500, origin, requestId);
  }

  return new Response(
    JSON.stringify({
      data: {
        simulated: true,
        transactionId: result.transaction_id,
        newBalance: result.new_balance,
        duplicate: result.duplicate,
        reference: paymentRef,
        requestId,
      },
    }),
    {
      status: 200,
      headers: {
        ...corsHeaders(origin),
        'Content-Type': 'application/json',
      },
    },
  );
});
