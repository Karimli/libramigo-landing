# Deployment: GitHub Pages + libramigo.az

The site is static (`npm run build` → `dist/`). GitHub Actions builds and publishes it to
GitHub Pages on every push to `main` ([`.github/workflows/deploy.yml`](.github/workflows/deploy.yml)).

## 1. Repository

1. Create a GitHub repository and push this project to `main`.
   GitHub Pages is free for **public** repositories; a private repository needs a paid plan.
   The internal brief (`LANDING_BRIEF.md`) and design exports (`reference/`) are git-ignored
   and never published.
2. **Settings → Pages → Build and deployment → Source: GitHub Actions.**
3. **Settings → Secrets and variables → Actions → Variables** (all optional, all public values).
   A variable set here overrides the default written in the workflow file:

   | Variable | Value | Default in `deploy.yml` |
   |---|---|---|
   | `PUBLIC_WAITLIST_ENDPOINT` | Apps Script web app URL (see [`backend/README.md`](backend/README.md)) | the current Apps Script deployment |
   | `PUBLIC_CONTACT_EMAIL` | Footer contact email | `info@libramigo.az` |
   | `PUBLIC_OG_IMAGE` | Absolute URL of a 1200×630 share image | none: the site uses `/og/<lang>.png` |

## 2. Custom domain

1. **Verify the domain** first (prevents takeover): GitHub profile **Settings → Pages →
   Add a domain → `libramigo.az`**, then add the TXT record GitHub shows
   (`_github-pages-challenge-<username>`) at your DNS provider.
2. Repository **Settings → Pages → Custom domain:** `libramigo.az` → Save.
   (`public/CNAME` already contains `libramigo.az`.)
3. DNS records. DNS is hosted on Cloudflare (free plan; nameservers `chase.ns.cloudflare.com` and
   `sureena.ns.cloudflare.com` set at the `.az` registrar). Keep every record **DNS only** (grey cloud):
   proxying breaks the GitHub Pages certificate. Remove other A/AAAA records on `@`.

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

## 3. Email (info@libramigo.az)

Incoming mail is forwarded to the owner's Gmail by Cloudflare Email Routing
(**Email → Email Routing → Routing rules**: `info@libramigo.az` → the Gmail address; catch-all disabled).
Replies are sent from Gmail with "Send mail as" through `smtp.gmail.com` and a Google app password.

DNS records for mail (the MX, DKIM and the first SPF include are added by Cloudflare):

| Type | Name | Value |
|---|---|---|
| MX | `@` | `route1.mx.cloudflare.net`, `route2.mx.cloudflare.net`, `route3.mx.cloudflare.net` |
| TXT | `@` | `v=spf1 include:_spf.mx.cloudflare.net include:_spf.google.com ~all` |
| TXT | `cf2024-1._domainkey` | DKIM key (managed by Cloudflare) |
| TXT | `_dmarc` | `v=DMARC1; p=none; rua=mailto:info@libramigo.az` |

Keep a single SPF record: a second `v=spf1` TXT makes SPF fail.

## 4. Search engines

- `@` also carries a `google-site-verification=…` TXT record for Google Search Console
  (Domain property `libramigo.az`). Do not delete it.
- Sitemap: `https://libramigo.az/sitemap.xml`, submitted in Search Console and listed in `robots.txt`.

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
