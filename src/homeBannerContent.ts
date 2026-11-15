export const HOME_BANNER_FIELDS = ['title', 'subtitle'] as const;
export type HomeBannerCopy = Record<typeof HOME_BANNER_FIELDS[number], string>;
export type HomeBannerContent = Record<'fa' | 'en', HomeBannerCopy>;
export const HOME_BANNER_DEFAULTS: HomeBannerContent = {
  fa: {
    title: 'ما براتون شکل‌های علمی و آکادمیک طراحی می‌کنیم.',
    subtitle: 'سریع، دقیق و باکیفیت',
  },
  en: {
    title: 'We design scientific and academic figures for you.',
    subtitle: 'Fast, precise and high-quality',
  },
};
export function normalizeHomeBanner(value: unknown): HomeBannerContent {
  const input = value as Partial<Record<'fa' | 'en', Partial<HomeBannerCopy>>> | null;
  return Object.fromEntries((['fa', 'en'] as const).map(locale => [locale,
    Object.fromEntries(HOME_BANNER_FIELDS.map(key => [key,
      typeof input?.[locale]?.[key] === 'string' ? input[locale]![key] : HOME_BANNER_DEFAULTS[locale][key],
    ])),
  ])) as HomeBannerContent;
}
