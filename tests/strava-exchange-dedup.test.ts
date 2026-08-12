import test from 'node:test';
import assert from 'node:assert/strict';

/**
 * Verifies the single-use-code dedup algorithm used in stravaService's
 * exchangeStravaCodeVerbose. The real function can't be imported here (it
 * pulls in React Native modules), so this reproduces the exact guard logic
 * around a fake exchange and asserts the property that matters: a given
 * authorization code hits the underlying exchange at most once, even when
 * two callback handlers fire concurrently — which is what previously caused
 * Strava's "AuthorizationCode / code / invalid" 400 on the second call.
 */

interface Result { tokens: { access: string } | null; error?: string }

function makeExchanger(realExchange: (code: string) => Promise<Result>) {
  const inFlight = new Map<string, Promise<Result>>();
  const completed = new Map<string, Result>();

  return async function exchange(code: string): Promise<Result> {
    const already = completed.get(code);
    if (already) return already;
    const running = inFlight.get(code);
    if (running) return running;

    const promise = realExchange(code);
    inFlight.set(code, promise);
    try {
      const result = await promise;
      if (result.tokens) {
        completed.set(code, result);
        if (completed.size > 5) completed.delete(completed.keys().next().value as string);
      }
      return result;
    } finally {
      inFlight.delete(code);
    }
  };
}

test('concurrent exchanges of the same code hit the real exchange only once', async () => {
  let realCalls = 0;
  const exchange = makeExchanger(async (code) => {
    realCalls++;
    await new Promise(r => setTimeout(r, 20)); // simulate network
    return { tokens: { access: `token-for-${code}` } };
  });

  // Both handlers fire for the same callback code at nearly the same time.
  const [a, b] = await Promise.all([exchange('CODE1'), exchange('CODE1')]);

  assert.equal(realCalls, 1, 'code must be exchanged exactly once');
  assert.deepEqual(a.tokens, b.tokens, 'both callers get the same tokens');
  assert.equal(a.tokens?.access, 'token-for-CODE1');
});

test('a second exchange arriving after the first completed reuses the cached tokens', async () => {
  let realCalls = 0;
  const exchange = makeExchanger(async (code) => {
    realCalls++;
    return { tokens: { access: `token-for-${code}` } };
  });

  const first = await exchange('CODE2');           // completes fully
  const second = await exchange('CODE2');          // arrives later, same code

  assert.equal(realCalls, 1, 'the spent code is never re-exchanged');
  assert.deepEqual(first.tokens, second.tokens);
});

test('distinct codes are exchanged independently', async () => {
  let realCalls = 0;
  const exchange = makeExchanger(async (code) => {
    realCalls++;
    return { tokens: { access: `token-for-${code}` } };
  });

  const r1 = await exchange('A');
  const r2 = await exchange('B');

  assert.equal(realCalls, 2);
  assert.equal(r1.tokens?.access, 'token-for-A');
  assert.equal(r2.tokens?.access, 'token-for-B');
});

test('a genuine failure is NOT cached, so a legitimate retry can still succeed', async () => {
  let attempt = 0;
  const exchange = makeExchanger(async () => {
    attempt++;
    if (attempt === 1) return { tokens: null, error: 'network blip' };
    return { tokens: { access: 'recovered' } };
  });

  const failed = await exchange('CODE3');
  assert.equal(failed.tokens, null, 'first attempt fails');

  const retried = await exchange('CODE3');
  assert.equal(retried.tokens?.access, 'recovered', 'retry of the same code is allowed after a failure');
  assert.equal(attempt, 2);
});
