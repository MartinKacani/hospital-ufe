import { newSpecPage } from '@stencil/core/testing';
import { TjmkHospitalWlList } from '../tjmk-hospital-wl-list';
import { describe, it, expect } from 'vitest';

describe('tjmk-hospital-wl-list', () => {
  it('renders', async () => {
    const page = await newSpecPage({
      components: [TjmkHospitalWlList],
      html: `<tjmk-hospital-wl-list></tjmk-hospital-wl-list>`,
    });
   
    const wlList = page.rootInstance as TjmkHospitalWlList;
    const expectedPatients = wlList?.waitingPatients?.length

    const items = page.root.shadowRoot.querySelectorAll("md-list-item");
    expect(items.length).toEqual(expectedPatients);

  });
});
