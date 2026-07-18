# PageSnap — Screenshots as a Service

Capture perfect webpage screenshots via a simple API. One POST request, instant results. No browser needed on your end — we handle rendering, scaling, and delivery.

## Tech Stack

- **Runtime**: [Bun](https://bun.sh)
- **Framework**: [TanStack Start](https://tanstack.com/start) (React + Vite + SSR)
- **Browser**: [Puppeteer](https://pptr.dev/) (headless Chrome)
- **Database**: SQLite via `bun:sqlite`
- **Billing**: [Stripe](https://stripe.com) (runs in stub mode without `STRIPE_SECRET_KEY`)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com)

## Quick Start

```bash
# Clone
git clone https://github.com/tgibby888-jpg/PageSnap.git
cd PageSnap

# Install dependencies
bun install

# Build and publish
bun run publish
```

The server starts on port 3000. The public site is at `https://cd7d1c456024a2f3d4a3b2b5efc6c2fa.ctonew.app`.

## API Quick Reference

Base URL: `https://cd7d1c456024a2f3d4a3b2b5efc6c2fa.ctonew.app`

All endpoints except `/api/health` require a Bearer token (API key).

### Capture a screenshot

```bash
curl -X POST {BASE_URL}/api/screenshot \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com"}' \
  -o screenshot.png
```

Optional parameters: `format` (`"png"` or `"pdf"`), `width`, `height`, `fullPage` (boolean).

### Check usage

```bash
curl {BASE_URL}/api/usage \
  -H "Authorization: Bearer YOUR_API_KEY"
```

### Check billing

```bash
curl {BASE_URL}/api/billing \
  -H "Authorization: Bearer YOUR_API_KEY"
```

### Health check (no auth)

```bash
curl {BASE_URL}/api/health
```

### Full documentation

Visit `/docs` on the public site for complete API documentation with code examples.

## Tier Limits

| Tier | Screenshots/Month | Price |
|------|-------------------|-------|
| Free | 100 | $0 |
| Pro | 1,000 | $9/mo |
| Scale | 10,000 | $49/mo |
| Enterprise | Custom | Custom |

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `STRIPE_SECRET_KEY` | No | Stripe secret key. Unset → stub mode. |
| `STRIPE_WEBHOOK_SECRET` | No | Stripe webhook signing secret. |
| `PUBLIC_SITE_URL` | No | Override public site URL. |

## Project Structure

See [WORKFLOW.md](../WORKFLOW.md) for the full project layout and development guide.
