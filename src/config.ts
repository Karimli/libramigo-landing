// Site-wide settings that are not translatable copy.
// Values come from environment variables (see .env.example) so they can differ per deployment.

export const config = {
  /** Waitlist POST endpoint. Backend not chosen yet (brief step 9). */
  waitlistEndpoint: (import.meta.env.PUBLIC_WAITLIST_ENDPOINT ?? '').trim(),
  /** Public contact email shown in the footer. Not decided yet (brief step 10). */
  contactEmail: (import.meta.env.PUBLIC_CONTACT_EMAIL ?? '').trim(),
  /** Absolute URL of the Open Graph image. Not designed yet (brief step 12). */
  ogImage: (import.meta.env.PUBLIC_OG_IMAGE ?? '').trim(),
};

if (import.meta.env.SSR) {
  if (!config.contactEmail) console.warn('[config] PUBLIC_CONTACT_EMAIL is not set – footer shows a placeholder.');
  if (!config.waitlistEndpoint) console.warn('[config] PUBLIC_WAITLIST_ENDPOINT is not set – waitlist submissions are only logged in dev.');
}
