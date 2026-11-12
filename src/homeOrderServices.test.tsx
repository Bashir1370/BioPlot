import {describe, expect, it} from 'vitest';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {HomeOrderServices} from './HomeOrderServices';

describe('Home design service cards', () => {
  it('displays exactly three direct request links in Persian', () => {
    const html=renderToStaticMarkup(createElement(HomeOrderServices,{locale:'fa'}));
    expect(html).toContain('چه نوع طراحی علمی نیاز دارید؟');
    expect(html).toContain('طراحی تصویر علمی');
    expect(html).toContain('طراحی چکیده تصویری');
    expect(html).toContain('طراحی پوستر علمی');
    for (const kind of ['figure','graphical_abstract','poster']) {
      expect(html).toContain(`href="/design?kind=${kind}"`);
    }
    expect(html.match(/class="home-order-service-cta"/g)).toHaveLength(3);
    expect(html).not.toContain('href="/editor"');
  });

  it('provides English equivalents and accessible headings', () => {
    const html=renderToStaticMarkup(createElement(HomeOrderServices,{locale:'en'}));
    expect(html).toContain('What would you like us to design?');
    expect(html).toContain('Scientific illustration');
    expect(html).toContain('Graphical abstract design');
    expect(html).toContain('Scientific poster design');
    expect(html).toContain('aria-labelledby="home-order-services-title"');
    expect(html.match(/Start an order/g)).toHaveLength(3);
  });
});
