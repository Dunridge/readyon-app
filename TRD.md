# Technical Requirements Document: ReadyOn Time-Off Management Frontend

**Project:** ReadyOn Time-Off Management  
**Date:** 2026-06-06  
**Author:** Frontend Engineer  

---

## 1. Problem Statement

ReadyOn's HR system (HCM) manages employee time-off balances per location. The frontend must surface these balances accurately while also providing a fast, responsive experience when employees submit requests and managers approve them. The fundamental tension is:

1. **HCM is the authority on balance data** — but it is accessed over the network, making it inherently latency-prone.
2. **Users expect instant UI feedback** — if submitting a request takes 2–3 seconds before anything happens on screen, confidence erodes.
3. **HCM can silently fail** — 5% of write operations return HTTP 200 but do not actually persist. The frontend cannot blindly trust an HTTP 200.
4. **Background events can mutate balances** — work anniversary bonuses trigger server-side balance increases that the client did not initiate.
5. **Manager decisions need accurate data at time-of-decision** — approving based on stale balance data can create compliance issues.

Any solution must navigate all five constraints simultaneously.

---

## 2. Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        Browser (Client)                          │
│                                                                  │
│  ┌────────────────┐   ┌──────────────────┐   ┌──────────────┐  │
│  │  Employee Page │   │   Manager Page   │   │  Home Page   │  │
│  └───────┬────────┘   └────────┬─────────┘   └──────────────┘  │
│          │                     │                                  │
│  ┌───────▼─────────────────────▼──────────────────────────────┐ │
│  │                    React Component Tree                      │ │
│  │  BalanceCard  RequestForm  RequestList  ManagerRequestCard  │ │
│  └───────┬──────────────────────────┬──────────────────────────┘ │
│          │                          │                             │
│  ┌───────▼──────────┐   ┌───────────▼──────────────────────┐   │
│  │  TanStack Query  │   │         Zustand Store              │   │
│  │  (server state)  │   │  (optimistic client-only state)    │   │
│  │                  │   │                                    │   │
│  │  - balances      │   │  - OptimisticRequest[]             │   │
│  │  - requests      │   │  - reconciliation timers           │   │
│  │  - polling 60s   │   │  - getOptimisticDeductions()       │   │
│  └───────┬──────────┘   └────────────────────────────────────┘  │
│          │                                                        │
└──────────┼────────────────────────────────────────────────────────┘
           │ HTTP
┌──────────▼────────────────────────────────────────────────────────┐
│                    Next.js API Routes (App Router)                 │
│                                                                    │
│  GET  /api/hcm/balance         — single cell, real-time           │
│  GET  /api/hcm/balances        — batch for employee               │
│  POST /api/hcm/request         — submit request (5% silent fail)  │
│  GET  /api/hcm/requests        — list by employee or pending      │
│  POST /api/hcm/requests/[id]/approve                              │
│  POST /api/hcm/requests/[id]/deny                                 │
│  POST /api/hcm/trigger-anniversary — add bonus days               │
└──────────┬────────────────────────────────────────────────────────┘
           │ in-process function calls
┌──────────▼────────────────────────────────────────────────────────┐
│                    In-Memory HCM Store (Singleton)                 │
│                                                                    │
│  globalThis.__hcmStore — survives hot reload in Next.js dev       │
│  Seed data: 2 employees, 3 balance rows, 2 pending requests       │
└────────────────────────────────────────────────────────────────────┘
```

---

## 3. Technology Choices

### Next.js 16 App Router
Next.js 16 uses React 19 and provides API Route Handlers via `route.ts` files in the `app/` directory. Route handlers use standard Web `Request`/`Response` APIs. Dynamic route segments (e.g., `app/api/hcm/requests/[id]/approve/route.ts`) require `await params` since Next.js 15+. We use this pattern throughout.

### TanStack Query v5
Chosen over React's built-in `useOptimistic` for several reasons:
- **Cache management** — automatic garbage collection, background refetch, stale-while-revalidate
- **Polling** — `refetchInterval` for background balance polling (every 60s)
- **Query invalidation** — surgical cache invalidation after mutations
- **Window focus refetch** — free reconciliation on tab visibility change
- **DevTools** — built-in devtools for debugging cache state

TanStack Query owns all *server state* (data that lives in the HCM system). It is the source of truth for what HCM has persisted.

### Zustand
Chosen for *client-only optimistic state* because:
- **Lightweight** — no boilerplate, no reducers
- **Synchronous** — can read/write state outside of React (needed for reconciliation timer callbacks)
- **Not query-tied** — optimistic entries need a lifecycle that is independent of the query cache
- **Timer management** — the store owns reconciliation timers and can cancel them on cleanup

Zustand owns `OptimisticRequest[]` — entries that represent in-flight writes not yet confirmed by HCM.

### Tailwind CSS v4
Already present. Used throughout for all styling. No additional CSS files created.

### Storybook 8 with `@storybook/nextjs`
Provides component isolation and visual regression baseline. The `@storybook/nextjs` framework handles Next.js-specific imports (fonts, navigation) automatically in story context.

### Vitest + Testing Library
Vitest runs in JSDOM environment. Testing Library provides `render`, `screen`, `fireEvent`, `waitFor`. All tests are co-located in `__tests__/` and run in under 2 seconds.

---

## 4. Optimistic vs. Pessimistic Updates

### Decision: Optimistic with Mandatory Reconciliation

We chose **optimistic updates** for the submit-request flow because:
- Employees often submit requests in a planning context (picking dates, checking balance) — they expect the UI to respond instantly
- The common path (HCM accepts the request) is happy and fast
- The failure rate is low enough that rollbacks are the exception

However, we impose **mandatory reconciliation** rather than trusting the 200 OK. This is the critical distinction:

| Approach | Behavior | Risk |
|---|---|---|
| Pure optimistic (naive) | Trust HTTP 200, update UI immediately, done | Silent failures go undetected |
| Pessimistic | Wait for confirmed HCM state, then update | Slow UX, no benefit on happy path |
| **Our approach** | Deduct immediately, but verify within 30s | Best of both: fast UI + correctness guarantee |

### The 30-Second Reconciliation Window

When a request is submitted:
1. Immediately: display balance decremented, "Submitting..." badge shown
2. HTTP 200 received: badge changes to "Pending HCM confirmation", 30s timer starts
3. Within 30s: re-fetch real balance
   - If HCM applied it: real balance matches prediction → `markConfirmed()`, entry removed from optimistic list, no visual disruption
   - If HCM didn't apply it (silent failure): real balance does NOT match → `markVerificationWarning()`, orange banner shown
4. HTTP 4xx/5xx received: immediate rollback, balance restored, error message shown

### Why 30 Seconds?

30 seconds is long enough to cover:
- Slow HCM processing pipelines (async job queue scenarios)
- Network retries on the HCM side
- Database replication lag in distributed HCM systems

It is short enough that users get feedback within a session.

### Never Tell the User "Approved" If Uncertain

This is a hard requirement. The `verification-warning` state is preserved until the user explicitly refreshes or navigates away. We do not:
- Auto-dismiss the warning
- Change the state to "confirmed" without a fresh balance read
- Hide the pending deduction while warning is active

---

## 5. Balance Reconciliation Strategy

### Display Formula

```
displayBalance = realBalance.availableDays 
               - sum(optimisticRequests where state ∈ [submitting, pending-confirmation, verification-warning])
```

This formula is computed in `BalanceCard.tsx` by combining TanStack Query data (real balance) with Zustand state (optimistic deductions). When a work-anniversary bonus arrives via background refresh:
- `realBalance.availableDays` increases (from the 60s poll or focus refetch)
- `optimisticDeductions` stay the same
- `displayBalance` increases correctly — the bonus is reflected

This is the critical merge: **background server updates never clobber in-flight optimistic entries** because they exist in separate state trees.

### Polling Strategy

- **Balance polling**: every 60 seconds via `refetchInterval` in `useEmployeeBalances` and `useBalance`
- **Window focus refetch**: enabled by default in TanStack Query config (`refetchOnWindowFocus: true`)
- **Manager view**: balance data re-fetched just-in-time at component mount (before approval action)

### Staleness Indicators

Data older than 2 minutes triggers a visual staleness indicator (amber badge). Threshold is configurable per use case:
- Employee balance cards: passive indicator
- Manager decision context: more prominent warning with recommendation to refresh

---

## 6. Cache Invalidation Strategy

| Event | Invalidation Target |
|---|---|
| Request submitted | `balances.byEmployee(empId)`, `requests.byEmployee(empId)` |
| Request rolled back | `balances.byEmployee(empId)` |
| Manager approves | `requests.pending`, `['balances']` (all) |
| Manager denies | `requests.pending` |
| Anniversary trigger | Caller should invalidate `balances.byEmployee(empId)` |

Query keys are structured as arrays: `['balances', 'employee', empId]`. This allows partial invalidation (all balances for an employee) without affecting unrelated employees' cached data.

---

## 7. Component Tree Mapping

```
app/employee/page.tsx (Client Component)
├── <VerificationWarningBanner> — shown when any opt. request is in verification-warning
├── <BalanceCard> (×N locations)
│   ├── Reads: TanStack Query balance data
│   ├── Reads: Zustand optimistic deductions
│   └── <StalenessIndicator> — inline when lastUpdated is old
├── <RequestForm>
│   ├── Reads: balance list (for location selector + available days)
│   ├── Writes: useTimeOffMutation → adds OptimisticRequest to Zustand + fires POST
│   └── Validation: client-side insufficient balance check using displayBalance
└── <RequestList>
    ├── Server requests: from useEmployeeRequests (TanStack Query)
    └── Optimistic requests: from Zustand store
        └── <OptimisticBadge> per entry

app/manager/page.tsx (Client Component)
└── <ManagerRequestCard> (×N pending requests)
    ├── <StalenessIndicator> on balance panel
    ├── Balance: useBalance (single cell, real-time)
    ├── Approve button → useManagerActionMutation.approveMutation
    └── Deny button → useManagerActionMutation.denyMutation
```

---

## 8. Mock HCM API Design

### Silent Failure Simulation

5% of `POST /api/hcm/request` calls return `{ success: true, requestId: null }` without creating a database entry. This tests the reconciliation path. The check is `Math.random() < 0.05`.

In production, silent failures would come from async job queues that accept the write but fail during processing. The pattern is the same: HTTP 200 but no observable state change.

### Conflict Responses (409)

Insufficient balance returns HTTP 409. The frontend catches this in `onError` and calls `rollback()` with the server's error message.

### In-Memory Singleton

The store uses `globalThis.__hcmStore` to survive Next.js hot-reloads in development. In production, this would be replaced with a real database connection. The pattern is deliberately minimal to make the mock obvious.

---

## 9. Test Strategy

### Layer 1: Store unit tests (`optimistic-flow.test.tsx`)
Tests the Zustand optimistic store state machine directly. Verifies all transitions: submitting → pending-confirmation → confirmed, submitting → rolled-back, pending-confirmation → verification-warning. Also verifies deduction math including edge cases (different locations, rolled-back entries not counted).

### Layer 2: Component tests (`BalanceCard.test.tsx`, `RequestForm.test.tsx`)
Tests UI rendering and interaction. BalanceCard tests: skeleton state, optimistic deduction math, staleness indicator. RequestForm tests: validation errors, day count preview, insufficient balance check. Uses `@testing-library/react` and `jsdom`.

### Layer 3: API/store integration tests (`hcm-api.test.ts`)
Tests the HCM store functions directly (not via HTTP, since vitest doesn't spawn a Next.js server). Covers: balance reads, batch reads, request creation, balance deduction on approval, anniversary bonus. Resets the global singleton between each test via `vi.resetModules()` and `delete globalThis.__hcmStore`.

### Layer 4: Storybook visual states
Stories document every meaningful UI state without test assertions. Serves as a living style guide and visual regression baseline. Stories cover:
- BalanceCard: loading, default, with deduction, low balance, zero balance, stale, post-anniversary
- RequestForm: default, low balance, single location
- RequestList: empty, loading, all statuses, all 4 optimistic states
- ManagerRequestCard: loading, fresh, stale, insufficient balance, no data

---

## 10. Alternatives Considered

### React `useOptimistic` (built-in)
Pros: no extra dependency, co-located with component. Cons: tied to component lifecycle, cannot persist across re-renders triggered by cache updates, no timer management. We chose Zustand because reconciliation timers need to outlive individual render cycles.

### SWR instead of TanStack Query
Pros: lighter weight. Cons: less granular cache invalidation, no `onMutate`/`onError`/`onSuccess` hooks with context passing, weaker devtools. TanStack Query v5 provides the mutation context pattern we rely on for `localId` propagation from `onMutate` to `onSuccess`/`onError`.

### Server-Sent Events for real-time balance updates
Would eliminate polling. Rejected because: adds server complexity, requires long-lived connections, SSE connections drop on mobile network changes. Polling is simpler and sufficient for the 60s refresh requirement.

### Redux Toolkit with RTK Query
Mature ecosystem, excellent devtools. Rejected because: heavy boilerplate for this scope, RTK Query's cache model is less ergonomic for the merge-optimistic-with-server pattern we need.

---

## 11. Known Limitations and Future Work

1. **No authentication** — the employee/manager switch is a URL change. Production would integrate with an identity provider.
2. **Silent failure detection is probabilistic** — the 30s reconciliation timer fires a balance re-fetch, but if the HCM balance was already correct before the request (e.g., it was a duplicate), we might incorrectly mark as confirmed. Production would compare server-side request IDs.
3. **In-memory store is not persistent** — server restarts clear all data. Production uses a real database.
4. **No WebSocket/SSE** — the manager view does not receive real-time push notifications when employees submit requests. The 30s refetch interval is a reasonable substitute.
5. **Manager identity is hardcoded** — `MANAGER_ID = 'emp-002'`. Production reads from session/JWT.
