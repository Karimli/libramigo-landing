interface ImportMetaEnv {
  readonly PUBLIC_WAITLIST_ENDPOINT?: string;
  readonly PUBLIC_CONTACT_EMAIL?: string;
  readonly PUBLIC_OG_IMAGE?: string;
}
interface ImportMeta {
  readonly env: ImportMetaEnv;
}
