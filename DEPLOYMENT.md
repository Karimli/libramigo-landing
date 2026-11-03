# Deployment: GitHub Pages + libramigo.az

The site is static (`npm run build` → `dist/`). GitHub Actions builds and publishes it to
GitHub Pages on every push to `main` ([`.github/workflows/deploy.yml`](.github/workflows/deploy.yml)).

## 1. Repository

1. Create a GitHub repository and push this project to `main`.
   GitHub Pages is free for **public** repositories; a private repository needs a paid plan.
   The internal brief (`LANDING_BRIEF.md`) and design exports (`reference/`) are git-ignored
   and never published.
2. **Settings → Pages → Build and deployment → Source: GitHub Actions.**
3. **Settings → Secrets and variables → Actions → Variables** (all optional, all public values):

   | Variable | Value |
   |---|---|
   | `PUBLIC_WAITLIST_ENDPOINT` | Apps Script web app URL (see [`backend/README.md`](backend/README.md)) |
   | `PUBLIC_CONTACT_EMAIL` | Footer contact email |
   | `PUBLIC_OG_IMAGE` | Absolute URL of the 1200×630 share image |

## 2. Custom domain

1. **Verify the domain** first (prevents takeover): GitHub profile **Settings → Pages →
   Add a domain → `libramigo.az`**, then add the TXT record GitHub shows
   (`_github-pages-challenge-<username>`) at your DNS provider.
2. Repository **Settings → Pages → Custom domain:** `libramigo.az` → Save.
   (`public/CNAME` already contains `libramigo.az`.)
3. DNS records at the registrar / DNS provider (remove other A/AAAA records on `@`):

   | Type | Name | Value |
   |---|---|---|
   | A | `@` | `185.199.108.153` |
   | A | `@` | `185.199.109.153` |
   | A | `@` | `185.199.110.153` |
   | A | `@` | `185.199.111.153` |
   | AAAA | `@` | `2606:50c0:8000::153` |
   | AAAA | `@` | `2606:50c0:8001::153` |
   | AAAA | `@` | `2606:50c0:8002::153` |
   | AAAA | `@` | `2606:50c0:8003::153` |
   | CNAME | `www` | `<username>.github.io` |

4. After DNS propagates and the certificate is issued: **Enforce HTTPS**.

Check: `dig libramigo.az +short` should list the four GitHub IPs.

## URLs

The build uses `build.format: 'file'` (`az.html`, `ru.html`, `en.html`). GitHub Pages serves
`/az` from `az.html` without redirecting to `/az/`, matching the URLs the language switch
pushes and the canonical/hreflang tags (`https://libramigo.az/az` etc.).

## Local

```sh
nvm use        # Node 22.23.4 (.nvmrc)
npm ci
npm run dev    # http://localhost:4321
npm run build && npm run preview
```
