export const HOME_HERO_SLOTS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16] as const;
export type HomeHeroSlot = typeof HOME_HERO_SLOTS[number];

// Independent defaults: each can be replaced in Admin → Showcase → Home Hero.
export const HOME_HERO_DEFAULTS = [
  'https://cdn.21st.dev/assets/mirror/2f/2f52f0ddd94c14a93f42a61ff2bb8842b52b78e27051e7e0f6fb579d50a5524f.jpg',
  'https://cdn.21st.dev/assets/mirror/94/94fe535ff9ce491f4943129b6ff6b4e5c9465bb578892a2447ecdbbca1907d37.jpg',
  'https://cdn.21st.dev/assets/mirror/ce/ce27c3636cc87ff0803227125972049f68bd4e2c0c5219fa2540549464abc51c.jpg',
  '/images/scientific-cell-hero.webp',
  ...[
    '1532094349884-543bc11b234d',
    '1579154204601-01588f351e67',
    '1582719471384-894fbb16e074',
    '1532187863486-abf9dbad1b69',
    '1559757148-5c350d0d3c56',
    '1576091160399-112ba8d25d1d',
    '1587854692152-cbe660dbde88',
    '1579684385127-1ef15d508118',
    '1511174511562-5f7f18b874f8',
    '1581595220892-b0739db3ba8c',
    '1576671081837-49000212a370',
    '1584362917165-526a968579e8',
  ].map(id => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=400&q=80`),
];
