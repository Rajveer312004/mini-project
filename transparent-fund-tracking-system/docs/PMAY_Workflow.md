# PMAY Scheme Workflow (End-to-End)

## Overview
- Add scheme (Admin), track fund utilization, and maintain an auditable history.
- Works with blockchain (on-chain) and gracefully falls back to database-only mode when chain is unavailable.

## Add Scheme (Admin)
1. Admin → Add Scheme page: enter
   - Name: “PMAY-2025”
   - Total Funds (INR), e.g., 10,00,00,000
   - Eligibility Criteria (free text), e.g., “Urban poor; Income ≤ ₹3L; Valid Aadhaar”
2. Frontend → POST `/api/admin/add-scheme` with `{ name, amount, eligibilityCriteria }`.
3. Backend behavior:
   - If blockchain available: `contract.addScheme(name, amount)`, await tx → `schemeId = schemeCount` → save to Mongo `Fund` with `{ schemeId, name, totalFunds, usedFunds: 0, eligibilityCriteria }`.
   - If blockchain unavailable: DB-only mode → `schemeId = last+1` → save `Fund` in Mongo.
4. Result: PMAY appears in View Schemes with totals and criteria.

## View Scheme Status (Transparency)
1. Frontend → GET `/api/admin/schemes`.
2. Backend:
   - If chain available: read `schemeCount`, load each scheme from contract, enrich with `eligibilityCriteria` from DB.
   - Else: return `Fund` entries from DB (sorted by `schemeId`).
3. UI displays PMAY: Total/Used/Remaining funds, Utilization bar, Eligibility Criteria.

## Use Funds (Disbursement)
1. Admin → Use Fund:
   - Select PMAY-2025 (`schemeId`, e.g., 1)
   - Enter amount (e.g., 5,00,000), optional purpose (“Beneficiary tranche #1”)
2. Frontend → POST `/api/admin/use-fund` with `{ schemeId, amount, executor, purpose }`.
   - Executor:
     - With MetaMask: user wallet address
     - Without MetaMask: fallback executor “admin-offchain” (DB-only mode)
3. Backend:
   - If blockchain available: `contract.useFund(schemeId, amount)` → receipt → save `Transaction` { schemeId, amount, executor, purpose, txHash } → increment `Fund.usedFunds`.
   - If chain unavailable: DB-only mode → validate remaining ≥ amount → generate mock `txHash` → save `Transaction` → update `Fund.usedFunds`.
4. Result: PMAY used/remaining updates; transaction recorded and visible in history.

## Audit Trail (Accountability)
1. Frontend → GET `/api/transactions`.
2. UI shows entries: Scheme ID, Amount, Purpose, Executor, Tx Hash (clickable on real networks), Timestamp.
3. Auto-refresh ensures near real-time visibility.

## Data Model
### Fund (MongoDB)
- `schemeId: Number` (matches on-chain id if available)
- `name: String` (e.g., “PMAY-2025”)
- `totalFunds: Number`
- `usedFunds: Number`
- `eligibilityCriteria: String` (free text)

### Transaction (MongoDB)
- `schemeId: Number`
- `amount: Number`
- `purpose: String`
- `executor: String` (wallet or “admin-offchain”)
- `txHash: String` (real or mock; unique)

## Contract (If On-Chain)
`FundTracker.sol`
- `schemeCount`, `schemes[id] = { id, name, totalFunds, usedFunds }`
- `addScheme(name, amount)`: admin-only; increments count, stores scheme
- `useFund(id, amount)`: admin-only; checks balance; increments used
- `getScheme(id)`: returns scheme

## Roles & Security
- Admin-only actions (UI-protected + on-chain admin enforced by private key wallet).
- Session-based login (frontend) before dashboard usage.
- On-chain admin defined by the private key used by backend.

## Failure Handling
- Chain not reachable: Add/Use still work in DB-only mode; UI shows warnings.
- DB not reachable: On-chain reads possible, but rich metadata (criteria/tx) won’t persist.

## Example Lifecycle
1. Add: PMAY-2025 with ₹10 Cr and criteria “Urban poor; Income ≤ ₹3L”.
2. Use: ₹50 Lakh for tranche-1 (purpose noted).
3. View: Utilization 5%, Remaining ₹9.5 Cr, criteria shown.
4. Audit: Transaction entry with txHash/executor/timestamp.


