// Demo readers shown on the illustrative quote cards (hero and quote belt).
// Fictional people with illustrated avatars – replace with real, consenting users later.
// Names are proper nouns and stay the same in every language.

export interface Reader {
  name: string;
  username: string;
  avatar: string;
}

export const heroReader: Reader = { name: 'Günel Hüseynova', username: 'gunel.oxuyur', avatar: '/avatars/gunel.svg' };

// One reader per quote card (problem.quotes.q1 … q6).
export const quoteReaders: Reader[] = [
  { name: 'Leyla Məmmədova', username: 'leyla.kitab', avatar: '/avatars/leyla.svg' },
  { name: 'Elvin Həsənov', username: 'elvin_reads', avatar: '/avatars/elvin.svg' },
  { name: 'Nigar Əliyeva', username: 'nigar.rafi', avatar: '/avatars/nigar.svg' },
  { name: 'Tural Quliyev', username: 'tural.q', avatar: '/avatars/tural.svg' },
  { name: 'Aytən İsmayılova', username: 'ayten_sitat', avatar: '/avatars/ayten.svg' },
  { name: 'Rəşad Babayev', username: 'resad.oxucu', avatar: '/avatars/resad.svg' },
];
