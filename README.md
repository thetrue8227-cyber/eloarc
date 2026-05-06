# Elo Arc — Your Chess. Evolved.

AI-powered continuous chess coaching platform that learns your game and builds a personalized evolution plan.

## Stack

- **Frontend**: React + Vite + Tailwind CSS + Framer Motion + i18next
- **Backend**: Node.js + Express + PostgreSQL
- **AI**: Anthropic Claude (sonnet-4-6 / opus-4-7)
- **Payments**: Stripe (subscriptions)
- **Deploy**: Render.com

---

## Local Development

### Prerequisites
- Node.js 20+
- PostgreSQL (or Docker)

### 1. Clone and set up env

```bash
cp .env.example .env
# Edit .env with your API keys
```

### 2. Start with Docker (easiest)

```bash
docker-compose up
```

This starts PostgreSQL, the backend (port 4000), and the frontend (port 5173).

### 3. Or start manually

**Database:**
```bash
# Start PostgreSQL, then create database
createdb eloarc
```

**Backend:**
```bash
cd server
npm install
node server.js        # auto-runs DB migrations on start
```

**Frontend:**
```bash
cd client
npm install
npm run dev
```

**Seed demo data (optional):**
```bash
cd server
node seed.js
# Demo login: demo@eloarc.com / demo1234
```

---

## Deploy on Render.com (Free Tier)

### Step 1 — Create a Render account
Go to [render.com](https://render.com) and sign up.

### Step 2 — Create PostgreSQL database
1. Dashboard → New → PostgreSQL
2. Name: `elo-arc-db`, Region: Oregon (US West), Plan: Free
3. Copy the **Internal Database URL**

### Step 3 — Deploy the backend
1. Dashboard → New → Web Service
2. Connect your GitHub repo
3. Settings:
   - **Name**: `elo-arc-server`
   - **Root Directory**: `server`
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
   - **Plan**: Free
4. Environment variables (set all from `.env.example`):
   - `DATABASE_URL` → Internal Database URL from Step 2
   - `ANTHROPIC_API_KEY` → Your Anthropic key
   - `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_*` → Stripe keys
   - `JWT_SECRET` → Any long random string
   - `EMAIL_*` → Your SMTP credentials
   - `CLIENT_URL` → Your frontend URL (set after deploying frontend)

### Step 4 — Deploy the frontend
1. Dashboard → New → Static Site
2. Connect your GitHub repo
3. Settings:
   - **Name**: `elo-arc-client`
   - **Root Directory**: `client`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`
4. Redirect/Rewrite rule: `/* → /index.html` (200)
5. Environment variable: `VITE_API_URL` → your backend URL

### Step 5 — Update CLIENT_URL
Go back to the backend service → Environment → update `CLIENT_URL` to your frontend Render URL.

---

## Custom Domain (Optional)

### Option A — Render paid plan ($7/mo)
1. Backend service → Settings → Custom Domain → Add `api.yourdomain.com`
2. Frontend service → Settings → Custom Domain → Add `yourdomain.com`
3. Follow DNS instructions in the Render dashboard

### Option B — Cloudflare (free)
1. Buy domain on [Namecheap](https://namecheap.com) or [Registro.br](https://registro.br)
2. Add domain to Cloudflare (free plan)
3. In Cloudflare DNS:
   - `CNAME yourdomain.com → your-frontend.onrender.com` (Proxied)
   - `CNAME api.yourdomain.com → your-backend.onrender.com` (Proxied)
4. In Cloudflare SSL/TLS → Full (strict)

---

## Stripe Setup

1. Create products in Stripe Dashboard:
   - Rising — $10/month recurring
   - Elite — $30/month recurring
   - Arc Master — $100/month recurring
2. Copy Price IDs (`price_xxx`) to `STRIPE_PRICE_*` env vars
3. Webhooks → Add endpoint: `https://your-backend.com/api/stripe/webhook`
   - Events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`
4. Copy Webhook Secret to `STRIPE_WEBHOOK_SECRET`

---

## Scaling on Render

When traffic grows:
- **Backend**: Upgrade to Starter ($7/mo) for always-on, then Standard ($25/mo) for auto-scaling
- **Database**: Upgrade from Free to Starter ($7/mo) for 1GB storage and backups
- **Frontend**: Static sites are always free with global CDN

---

## Environment Variables Reference

| Variable | Description |
|---|---|
| `ANTHROPIC_API_KEY` | Anthropic API key |
| `STRIPE_SECRET_KEY` | Stripe secret key |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret |
| `STRIPE_PRICE_RISING` | Stripe Price ID for Rising plan |
| `STRIPE_PRICE_ELITE` | Stripe Price ID for Elite plan |
| `STRIPE_PRICE_ARC_MASTER` | Stripe Price ID for Arc Master plan |
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Secret for signing JWTs |
| `EMAIL_HOST` | SMTP host (e.g. smtp.gmail.com) |
| `EMAIL_PORT` | SMTP port (587) |
| `EMAIL_USER` | SMTP username/email |
| `EMAIL_PASS` | SMTP password/app password |
| `CLIENT_URL` | Frontend URL (for CORS and email links) |
| `PORT` | Backend port (default 4000) |
| `NODE_ENV` | `development` or `production` |

---

## Plans

| Feature | Free | Rising | Elite | Arc Master |
|---|---|---|---|---|
| Analyses/month | 3 | Unlimited | Unlimited | Unlimited |
| Engine ELO | 1200 | 2200 | 2800 | 3000 |
| AI Chat | ✗ | 20/mo | Unlimited | Unlimited |
| Email reports | ✗ | Biweekly | Weekly | Weekly |
| Monthly PDF | ✗ | ✗ | ✗ | ✓ |
| Price | Free | $10/mo | $30/mo | $100/mo |
