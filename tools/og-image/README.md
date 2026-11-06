# Share images (Open Graph)

`public/og/{az,ru,en}.png` (1200×630) are the link-preview cards, one per language.
`SeoHead.astro` uses `/og/<lang>.png` unless `PUBLIC_OG_IMAGE` is set.

They are temporary, built from the site's own colours and the hero shelf until a real logo exists.
To regenerate after changing the text or design:

```sh
python3 tools/og-image/generate.py /tmp/og   # writes az.html, ru.html, en.html
```

Open each file in Chrome at a 1200×630 viewport (DevTools → device toolbar) and take a
screenshot of the page (DevTools → ⌘⇧P → "Capture screenshot"). Save it as `public/og/<lang>.png`.
The hero title and genre names come from `src/i18n/<lang>.json`.

After changing an image, you can refresh cached previews with the
[Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/) ("Scrape Again").
