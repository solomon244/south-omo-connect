# South Omo Connect — Hackathon Prototype

A mobile-friendly marketplace prototype for rural producers, community tourism providers, cooperatives, and buyers in South Omo. It is built to demonstrate the challenge requirements: discoverable listings, verification workflow, transparent cost-based pricing, direct buyer order requests, collective selling, offline listing drafts, and AI-assisted listing creation.

> **Important:** This is a hackathon prototype, not a production marketplace. Demo data and prices are illustrative, not verified South Omo market prices. The app does not process payments or confirm actual transport, bookings, product origin, or cultural permissions.

## Stack

- Frontend: React + Vite
- Backend: Node.js + Express
- Database: MongoDB + Mongoose
- AI: OpenAI-compatible Chat Completions API (optional key; local template fallback included)
- Offline: service worker app-shell cache + IndexedDB draft queue (localStorage fallback)

## Project layout

```text
south-omo-connect/
├── backend/
│   ├── src/models/       # Product, Order, ProducerGroup schemas
│   ├── src/routes/       # Products, orders, groups, AI listing helper
│   ├── src/server.js
│   └── .env.example
└── frontend/
    ├── public/sw.js
    ├── src/App.jsx
    ├── src/styles.css
    └── .env.example
```

## Requirements

- Node.js 20 or newer recommended
- npm
- MongoDB local instance or MongoDB Atlas URI (optional for demo mode)
- An AI API key is optional; the listing assistant has a template fallback.

## Run locally

### 1. Start the backend

```bash
cd backend
npm install
```

Copy `.env.example` to `.env`, then edit the values if needed. For MongoDB persistence, set `MONGODB_URI` to your local or Atlas connection string. If MongoDB is unreachable, the API starts in in-memory demo mode; new data is lost when the server restarts.

```bash
npm run dev
```

Backend runs at `http://localhost:5000`. Check `http://localhost:5000/api/health`.

### 2. Start the frontend

Open a second terminal:

```bash
cd frontend
npm install
```

Copy `.env.example` to `.env` if you need a different API URL. Then:

```bash
npm run dev
```

Open `http://localhost:5173`.

## AI setup

In `backend/.env`, set:

```env
OPENAI_API_KEY=your_api_key_here
OPENAI_MODEL=gpt-4o-mini
```

Restart the backend. The key must remain on the server; do not put it in a `VITE_` frontend environment variable. If no key is configured or the provider fails, the API returns a clearly labeled template fallback. Generated content is marked for human review.

## Core API endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/health` | Server/database status |
| GET | `/api/products` | List and search offers; accepts `search` and `category` query parameters |
| POST | `/api/products` | Create a listing (starts unverified) |
| PATCH | `/api/products/:id/verify` | Demo verification toggle; **not secured** |
| GET | `/api/groups` | List producer groups |
| POST | `/api/groups` | Create a group |
| GET | `/api/orders` | List order requests |
| POST | `/api/orders` | Submit an order request; no payment processing |
| POST | `/api/ai/listing` | Draft listing title/description with AI or fallback |

## Prototype flows to demonstrate to judges

1. Browse offers and search/filter by category.
2. Open **Add a listing**, submit a new offer, and see it marked unverified.
3. Open **Verification** and mark the new listing verified.
4. Submit a buyer order request and view it under **Order requests**.
5. Open **Producer groups** and create a cooperative/group.
6. Open **Fair pricing** and adjust costs, quantity, and markup to show the quotation calculation.
7. Open **AI assistant** and create a listing draft. Confirm that generated text requires human review.
8. Disconnect the internet, submit a listing draft, reconnect, and use **Sync saved drafts**. Test on `localhost` or HTTPS because service workers require a secure context.

## Assumptions and known limitations

- Seed products, producer groups, quantities, and ETB prices are fictional illustrative data for demo purposes.
- The app uses demo user identity; authentication, password reset, producer permissions, and protected admin roles are not implemented.
- Demo-mode storage is in memory. MongoDB is required for persistence across backend restarts.
- Offline support covers app-shell caching and local listing drafts, not live search, confirmed orders, or payments while disconnected.
- Image URLs are remote demo images; offline image availability is not guaranteed.
- AI translations for Hamer, Dasenech, Tsamai or other South Omo languages are not claimed. Validate language quality with fluent local speakers before launch.
- QR-based traceability, payment integrations, SMS/USSD, real delivery tracking, credit scoring, and custom model training are not implemented in this MVP.
- The verification endpoint is intentionally simple for a local demo. **Do not deploy publicly before adding authentication, authorization, rate limiting, validation, logging, and security hardening.**
- Browser service workers require localhost or HTTPS. For a production deployment, add PWA icons, a manifest, HTTPS, privacy notices, and tested conflict-resolution behavior.

## Before public deployment

1. Implement authentication and role-based authorization.
2. Add rate limiting, request schema validation, CSRF/CORS review, security headers, and structured audit logs.
3. Protect all admin and verification endpoints.
4. Add privacy/consent workflows for producer data, photographs, and culturally sensitive information.
5. Confirm local prices, seller consent, product origin, availability, and tourism permissions.
6. Add automated tests for duplicate sync attempts, order quantity validation, and API error states.
7. Test low-end Android devices, unreliable connections, and the selected local languages with community participants.
