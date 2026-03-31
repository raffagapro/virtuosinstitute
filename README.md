# Virtuós Institute

Marketing website + companion app for parents and school staff.

## Prerequisites

- Node.js 20+
- npm

## Setup

```bash
npm install
```

Copy the environment file and fill in the values:

```bash
cp .env.example .env.local
```

## Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Other Commands

```bash
npm run build        # Production build
npm run start        # Serve production build locally
npm run lint         # Run ESLint
npm test             # Run unit tests
npm run test:watch   # Run tests in watch mode
npm run storybook    # Component library (port 6006)
```

## Project Structure

```
app/                  Next.js app router pages
components/
  ui/                 Shared UI primitives (AppButton, AppCard, etc.)
  layout/             Navbar, Footer
  marketing/          Marketing-site section components
lib/
  i18n.ts             Locale resolution + translate()
  i18n/messages/      en-US.ts + es-MX.ts message maps
public/               Static assets (images, fonts)
tests/                Unit tests (mirrors src structure)
docs/                 Project documentation & execution plan
```

## Docs

See [docs/EXECUTION_PLAN.md](docs/EXECUTION_PLAN.md) for the full roadmap and progress tracker.

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
