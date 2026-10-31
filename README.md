# Appie simulated prototype

A local-only React prototype for a fictional digital healthcare workflow in India. It is **not a healthcare service, medical advice, a diagnosis, treatment advice, a valid prescription, or a payment service**. The app uses only local mock services and fictional sample identities.

## Run locally

```sh
npm install
npm run dev
```

Open `http://localhost:5173/#/` to reach the role-selection entry page.

## Verification commands

```sh
npm run lint
npm run typecheck
npm run test
npm run build
```

## Demo roles

The entry page (`/#/`) shows one card per role. **Continue as demo user** opens that role's workspace as its single seeded identity. There is no password, account or backend sign-in. **Choosing a role is not authentication or access control**; it only selects which demo workspace you see. **Sign out / Change demo role** in every workspace header returns to the entry page. The selected role is persisted across reloads.

| Role | Seeded demo user | Workspace home |
|---|---|---|
| Patient | Aarav (demo) | `/patient` |
| Doctor | Dr. Meera Iyer (sample) | `/doctor` |
| Pharmacist | Rohan Desai (sample) | `/pharmacist` |
| Fulfillment / Delivery Operations | Kavya Rao (sample) | `/operations` |

## Routes (hash router)

- `/` role selection
- `/patient`, `/patient/intake`, `/patient/episodes/:episodeId` (plus `/consent`, `/who-for`, `/intake`, `/assessment`, `/prescription`, `/checkout`, `/confirmation`, `/teleconsult`, `/in-person-care`), `/patient/orders/:orderId`, `/patient/records`, `/patient/records/:episodeId`, `/patient/help`, `/patient/in-person-care`, `/patient/privacy`
- `/doctor`, `/doctor/cases/:episodeId`
- `/pharmacist`, `/pharmacist/checks/:episodeId`
- `/operations`, `/operations/orders/:orderId`
- Legacy redirects: `/ops` → `/operations`, `/doctor/review/:id` → `/doctor/cases/:id`, `/pharmacist/check/:id` → `/pharmacist/checks/:id`, `/patient/episodes/:id/tracking` → `/patient/orders/:orderId`.

The pharmacist detail route is keyed by episode (`/pharmacist/checks/:episodeId`), not by order. No order exists until the patient pays, and payment requires the pharmacist check first.

Loading a workspace URL directly with no role selected shows "Choose a demo role to open this page" with a continue button. Loading it as a different role shows which workspace the page belongs to. Unknown URLs show a not-found page.

## Data and state

- `src/seed/demoSeed.json` holds the four demo users, the routine, urgent, unclear and historical scenario templates, mock service settings (partners, order lines, prices, delivery estimate) and the placeholder catalog labels. `src/data/seed.ts` builds the typed `AppState` from it.
- All roles read the same episode entities by stable ID (`ep-routine-01`, `ep-urgent-01`, `ep-unclear-01`, `ep-hist-01`). Orders live on their episode; the patient order page, operations order page, records and queues all resolve the same object.
- Every change goes through `applyAction` in `src/app/stateMachine.ts`, which enforces role permissions and workflow gates and writes the audit history (time, role and actor for each event).
- Progress is stored in `localStorage` under `appie-demo-state-v2`. The old `appie-demo-state-v1` key is removed on load. **Reset demo data** (entry page and every workspace footer) restores the seed state and keeps the current demo role.

## Walkthroughs

### Routine journey

1. **Patient**: Start a health check, accept consent, choose **Myself**, answer the five steps with warning signs **No**, submit.
2. **Doctor**: open the case, **Start review**, choose **Approve guidance and simulated prescription**, save.
3. **Pharmacist**: open the item under **Awaiting check**, **Confirm medication & fulfillment check**.
4. **Patient**: open the episode, continue to simulated checkout, choose UPI, Card or Wallet, **Pay (simulated)**.
5. **Fulfillment / Delivery Operations**: open the order in **Active** and use **Mark as preparing → dispatched → out for delivery → delivered**. Only orders that passed doctor approval, pharmacist confirmation and simulated payment appear here.
6. **Patient**: the order page (`/patient/orders/:orderId`) shows the same status and who updated it. Patients cannot change fulfillment status.

### Potentially urgent journey

Use `ep-urgent-01` or answer **Yes** to the warning-sign question. The episode shows **Routine Appie flow paused** with emergency and in-person guidance. It never appears in the pharmacist or operations queues, and prescription, checkout, confirmation and tracking URLs show a blocked state.

### Unclear journey

`ep-unclear-01` appears in the doctor's pending queue as "Needs more human input". The doctor can request more information, route to teleconsultation, decline or escalate. It cannot reach the pharmacist, checkout or operations unless a doctor approves a simulated care plan.

## Prototype boundaries

- Every route has the persistent notice: “Simulated prototype for demonstration only. Content is illustrative and not medical advice.”
- All assessment, review guidance, prescription, price, payment, pharmacy, delivery, and tracking content is fictional, local, and labelled simulated or demo.
- The simulated prescription is explicitly **not a valid prescription**. It contains placeholder labels only, with no real medication, dosage, strength, frequency, or treatment instruction.
- Doctor care-plan edits are limited to an allowlist of non-clinical simulated variants.
- The app has no real API calls, authentication, AI, payment gateway, pharmacy, delivery, clinical, identity, analytics, or health-record connection. Future services appear only as “Mock integration boundary – not connected”.
- Caregiver/dependent profiles, chronic care, insurance, diagnostic booking, specialist marketplaces, and a physical Appie touchpoint are excluded.
