# Deployment configuration

## Vercel environment variables

Set these in Vercel under Project Settings > Environment Variables for Production and, if needed, Preview:

```env
PUBLIC_APP_URL=https://your-domain.com
PUBLIC_API_BASE_URL=
ALLOWED_ORIGINS=https://your-domain.com

SESSION_SECRET=use-a-long-random-secret
JWT_SECRET=use-a-different-long-random-secret

GOOGLE_CLIENT_ID=your-google-oauth-client-id
GOOGLE_CLIENT_SECRET=your-google-oauth-client-secret

FACEBOOK_APP_ID=
FACEBOOK_APP_SECRET=

BREVO_API_KEY=
BARBER_EMAIL=
```

`GOOGLE_CLIENT_SECRET`, `SESSION_SECRET`, `JWT_SECRET`, `BREVO_API_KEY`, and provider secrets must stay server-side only. Do not add them to frontend JavaScript or expose them with a public prefix.

`PUBLIC_API_BASE_URL` can stay empty when the static pages and API are served from the same Vercel domain. If the frontend is hosted separately from the backend, set it to the backend origin, for example `https://api.example.com`.

## Google OAuth

In Google Cloud Console, configure the OAuth client with:

```text
Authorized JavaScript origins:
https://your-domain.com

Authorized redirect URIs:
https://your-domain.com/auth/google/callback
```

For Preview deployments, add the exact preview domain only when you need Google login there. Avoid broad wildcards for production credentials.

After changing any Vercel environment variable, redeploy the project so the new values are applied.
