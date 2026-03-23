# JC Print Co Tools

A responsive, production-ready Next.js dashboard for small shirt-printing businesses.

## Included tools

- Background removal endpoint (stub for remove.bg/Clipdrop)
- Image upscaler endpoint (stub for ESRGAN provider)
- Raster-to-vector endpoint (stub for Potrace worker)
- Social media post generator endpoint
- Quote calculator UI
- Print readiness checker UI

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Deploy to Vercel

1. Push repo to GitHub.
2. Import repository in Vercel.
3. Add environment variables for your API providers.
4. Deploy.

## Next steps for production APIs

- Replace placeholder API route bodies in `src/app/api/*/route.ts` with real provider SDK calls.
- Add auth and usage limits (Supabase + middleware recommended).
- Add object storage for user uploads.
