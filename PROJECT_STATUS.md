# Libramigo landing: aktual vəziyyət

Son yenilənmə: 12 noyabr 2026.

Bu sənəd saytın **indi necə olduğunu** təsvir edir. `LANDING_BRIEF.md` isə işə başlamazdan əvvəl
yazılmış ilkin tapşırıqdır və yenilənmir. İkisi ziddiyyət təşkil edəndə bu sənəd əsasdır.
Saytda nəsə dəyişəndə bu faylı da yeniləyin.

## Qısa xülasə

| | |
|---|---|
| Canlı ünvan | https://libramigo.az (`www` və köhnə `github.io` ünvanı bura yönlənir) |
| Repo | GitHub: `Karimli/libramigo-landing`, `main` budağı |
| Texnologiya | Astro 7.4.5 (statik), adi CSS, GSAP 3.15.0, xətt-rəsm kitabxanası (`src/lineart/lib`) |
| Node | 22.23.4 (`.nvmrc`) |
| Dillər | AZ (əsas), RU, EN: `/az`, `/ru`, `/en` |
| Hosting | GitHub Pages, hər `main` push-unda GitHub Actions avtomatik deploy edir |
| DNS | Cloudflare (pulsuz plan), bütün qeydlər "DNS only" |

## Səhifənin bölmələri (sıra ilə)

| # | Bölmə | Fayl | Nə var |
|---|---|---|---|
| 0 | Header | `Header.astro` | Loqo, 3 keçid (Necə işləyir, Yol xəritəsi, İcma), dil keçidi. 900 px-dən aşağı mobil menyu. Brifdəki "Siyahıya yazıl" düyməsi header-də yoxdur. |
| 1 | Hero | `Hero.astro` | Başlıq, alt mətn, düymə. Sağda kitab rəfi və sitat kartı. Oğlan rəfin önündə gəzib kitablara toxunur. |
| 2 | Problem | `Problem.astro` | "Kiminlə danışırsan?" başlığı, kitabla gəzən oxucu zolağı, sürüşən sitat lenti. |
| 3 | Necə işləyir | `HowItWorks.astro` | Üç addım kartı, hər birində mini interfeys nümunəsi. |
| 4 | Rəfini qur | `ShelfBuilder.astro` | Yalnız izlənən demo: kursor kitabları seçir, onlar rəfə düşür. |
| 5 | Kimin üçündür | `WhoFor.astro` | Üç persona kartı. |
| 6 | Yol xəritəsi | `Roadmap.astro` | Dörd mərhələli zaman xətti. Hazırkı mərhələnin kartında oturub kitab oxuyan oxucu. |
| 7 | İcma | `Community.astro` | Dörd "bilet" kartı (klub, çağırış, görüşlər, müəlliflər), hamısı "Hazırlanır" statusunda. Söhbət edən iki oxucu. |
| 8 | Gözləmə siyahısı | `Waitlist.astro` | E-poçt formu. Poçt qutusu səhnəsi. |
| 9 | Footer | `Footer.astro` | © və `info@libramigo.az` keçidi. |

"Rəfini qur" və "İcma" bölmələri ilkin brifdə yox idi, sonradan əlavə olunub.

## Dillər

- Bir şablon, üç lüğət: `src/i18n/az.json`, `ru.json`, `en.json`. Açarlar üçündə də eyni olmalıdır.
- Dil keçidi səhifəni yenidən yükləmir (`src/scripts/lang-switch.ts`), ünvan dəyişir, seçim yadda qalır.
- **Kök ünvan (`/`) həmişə `/az`-a aparır.** Brauzerin dilinə baxılmır. Yeganə istisna:
  ziyarətçi əvvəl saytda özü başqa dil seçibsə, həmin dil açılır.
- Kök səhifə indekslənmir, amma paylaşım teqlərini daşıyır ki, `libramigo.az` linkinin önizləməsi çıxsın.

## Animasiyalar

Üç növ animasiya var:

| Növ | Harada | Fayllar |
|---|---|---|
| CSS | Kartların görünməsi, sitat lenti, yol xəritəsi xətti, mini interfeyslər | `src/styles/animations.css` |
| GSAP | Hero-nun girişi və sitat kartı, "Rəfini qur" demosu | `src/scripts/hero.ts`, `shelf.ts` |
| Xətt-rəsm (SVG) | Beş səhnə, aşağıdakı cədvəl | `src/lineart/` |

Xətt-rəsm səhnələri:

| Səhnə | Bölmə | Davranış | Fayl |
|---|---|---|---|
| Rəfdə gəzən oğlan | Hero | Kitaba toxunur, kitab qalxır, sitat kartı dəyişir. Kitaba kliklədikdə ona gedir, özünə kliklədikdə əl yelləyir. | `browser.ts`, `boy.ts` |
| Kitabla gəzən oxucu | Problem | Zolaq boyu gəzir. Kliklədikdə əl yelləyir, siçan hərəkəti şərfini yelləyir. | `street.ts`, `reader.ts` |
| Söhbət edən iki oxucu | İcma | Növbə ilə danışır və dinləyirlər. Kliklədikdə söz ona keçir. Telefonda birinci kartın üstündə otururlar. | `talk.ts`, `sitter.ts` |
| Poçt qutusu | Gözləmə siyahısı | Bölmə ekranda olanda oğlan məktub atır, gedəndən 5 saniyə sonra qayıdır. Qeydiyyatdan sonra dərhal gəlir. | `postbox.ts`, `boy.ts` |
| Kartın küncündə oturan oxucu | Yol xəritəsi | "İdeya mərhələsi" kartının sağ üst küncündə oturub ayaqlarını sallayaraq kitab oxuyur. Kliklədikdə əl yelləyir. | `perch.ts`, `percher.ts` |

Bütün animasiyalar üçün qaydalar:
- Hərəkəti azaltma ayarı (`prefers-reduced-motion`) açıq olanda heç nə hərəkət etmir, məzmun son vəziyyətində görünür.
- Səhnələr yalnız ekranda olanda işləyir.
- Dekorativ hissələr `aria-hidden`-dir; JavaScript olmadan sayt tam oxunur.
- `src/lineart/lib/` qovluğundakı üç fayl [line-art-animation](https://github.com/JDhruv14/line-art-animation)
  reposundan dəyişdirilmədən götürülüb (MIT). Onlara toxunmayın; fiqurlar bir qovluq yuxarıdadır.
- Header-dəki loqo statikdir. Yazılma animasiyası sınaqdan keçirilib və rədd edilib.

## Gözləmə siyahısı

- Form `{ email, lang, source, createdAt }` məlumatını Google Apps Script veb tətbiqinə göndərir.
- Skript məlumatı sahibin Google hesabındakı **Libramigo Waitlist** cədvəlinin `Waitlist` vərəqinə yazır.
  Eyni e-poçt ikinci dəfə yazılmır.
- Hər yeni qeydiyyatda sahibin Gmail-inə bildiriş gəlir; "Reply" qeydiyyatdan keçən adama yazır.
- Göndərmə zamanı düymə bağlanır və içində spinner fırlanır.
- Skriptin kodu və quraşdırma addımları: `backend/google-apps-script/Code.gs`, `backend/README.md`.
  Kodu dəyişəndə Apps Script-də yeni versiya deploy etmək lazımdır.
- Lokalda `.env` olmadıqda form heç yerə göndərmir, məlumatı brauzer konsoluna yazır.

## E-poçt: info@libramigo.az

- Gələn məktublar: Cloudflare Email Routing onları sahibin Gmail-inə yönləndirir.
- Göndərilən məktublar: Gmail-in "Send mail as" ayarı ilə `info@` adından gedir.
- DNS-də MX (Cloudflare), SPF (Cloudflare + Google), DKIM və DMARC (`p=none`) qeydləri var.
- Yönləndirilən məktublar bəzən Gmail-də spama düşür. Bunun qarşısını `To: info@libramigo.az` üçün
  "Never send it to Spam" filtri alır (Gmail → Settings → Filters).
- Avtomatik (`no-reply`) məktub göndərişi yoxdur.

## SEO və paylaşım

- Hər dil üçün `<title>`, təsvir, `canonical`, `hreflang`, Open Graph və X kartı teqləri (`SeoHead.astro`).
- Paylaşım şəkilləri: `public/og/az.png`, `ru.png`, `en.png` (1200×630). Generator: `tools/og-image/`.
- `sitemap.xml` (`src/pages/sitemap.xml.ts`), `robots.txt`, JSON-LD (təşkilat və sayt), iPhone ikonu, `theme-color`.
- Google Search Console qoşulub (domen DNS ilə təsdiqlənib), sitemap göndərilib.

## Konfiqurasiya

Dəyərlər build zamanı mühit dəyişənlərindən gəlir. GitHub-da repo dəyişəni təyin edilməyibsə,
`.github/workflows/deploy.yml` faylındakı defolt işləyir:

| Dəyişən | Defolt (deploy faylında) |
|---|---|
| `PUBLIC_WAITLIST_ENDPOINT` | Apps Script veb tətbiqinin ünvanı |
| `PUBLIC_CONTACT_EMAIL` | `info@libramigo.az` |
| `PUBLIC_OG_IMAGE` | boş; boş olanda `/og/<dil>.png` istifadə olunur |

Domen, DNS və deploy addımları: `DEPLOYMENT.md`.

## Brifdən fərqli qəbul edilmiş qərarlar

| Brifdə | Qərar |
|---|---|
| Animasiyalar yalnız CSS ilə | GSAP və xətt-rəsm kitabxanası sahibin razılığı ilə əlavə olunub. Başqa kitabxana üçün yenə razılıq lazımdır. |
| İlk açılışda brauzerin dili | Həmişə AZ (bax: "Dillər"). |
| Backend qurulmasın | Google Sheets + Apps Script quruldu. |
| Hosting Azure-da | Hələlik GitHub Pages. |
| Əlaqə e-poçtu, domen, OG şəkli açıq sual idi | Hamısı həll olunub. |

## Hələ qüvvədə olan qaydalar

- Uydurma rəqəm, rəy və ya istifadəçi sayı yazılmır: layihə ideya mərhələsindədir.
- Mətnlər yalnız `src/i18n/*.json` fayllarında saxlanılır, üç dildə birlikdə dəyişdirilir.
- Kod, fayl adları və commit mesajları ingiliscədir.
- `git push`, deploy və xarici xidmətə qoşulma yalnız sahibin açıq icazəsi ilə edilir.

## Açıq işlər

- **Loqo:** hazır olanda `public/favicon.svg`, `public/apple-touch-icon.png` və OG şəkilləri ondan yenilənməlidir.
  İndikilər müvəqqətidir (kursiv "L" və saytın rəngləri).
- **Sürət ölçüsü:** mobil Lighthouse sonuncu dəfə xətt-rəsm səhnələrindən **əvvəl** ölçülüb
  (Performance 87–89, Accessibility 100). Səhnələrdən sonra yenidən ölçülməyib.
- **Analitika:** qoşulmayıb. `BaseLayout.astro`-da yeri saxlanılıb.
- **Search Console:** sitemap statusunun "Success" olduğunu yoxlamaq.
- **İstəyə bağlı:** GSAP-ı səhifənin əsas yüklənməsindən sonra yükləmək (sürəti artıra bilər).

## Lokal iş

```sh
nvm use          # Node 22.23.4
npm ci
npm run dev      # http://localhost:4321/az
npm run build    # nəticə: dist/
```
