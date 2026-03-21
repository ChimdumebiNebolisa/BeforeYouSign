## Setup (Running locally)

1. Install dependencies:

```bash
npm install
```

2. Configure your AI key in `.env.local` (server-side only). Copy the example and set `BYS_AI_KEY`:

```bash
copy .env.local.example .env.local
```

Do not use `NEXT_PUBLIC_` for this value — it must never be exposed to the client.

3. Start the dev server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Demo sample leases

Built-in **Try Sample Lease** loads plain-text fixtures from `public/sample-leases/`:

- `standard.txt` — balanced rent, deposit, renewal, and notice language
- `fee-heavy.txt` — multiple fees and late/NSF-style charges
- `notice-heavy.txt` — renewal and notice-period–heavy language

Use these for quick end-to-end checks without uploading a PDF.

### Optional: PDF extraction debug logs (server-side only)

```bash
set BEFOREYOUSIGN_PDF_DEBUG=1
```

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
