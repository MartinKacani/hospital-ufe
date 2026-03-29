import { newSpecPage } from '@stencil/core/testing';
import { TjmkHospitalWlList } from '../tjmk-hospital-wl-list';
import { describe, it, expect } from 'vitest';

describe('tjmk-hospital-wl-list', () => {
  it('renders', async () => {
    const page = await newSpecPage({
      components: [TjmkHospitalWlList],
      html: `<tjmk-hospital-wl-list></tjmk-hospital-wl-list>`,
    });
    expect(page.root).toEqualHtml(`
      <tjmk-hospital-wl-list>
        <mock:shadow-root>
          <slot></slot>
        </mock:shadow-root>
      </tjmk-hospital-wl-list>
    `);
  });
});
