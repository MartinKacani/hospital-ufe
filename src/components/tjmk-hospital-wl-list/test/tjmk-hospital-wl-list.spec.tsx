import { newSpecPage } from '@stencil/core/testing';
import { TjmkHospitalWlList } from '../tjmk-hospital-wl-list';
import { describe, it, expect } from 'vitest';
import { WaitingListEntry } from '../../../api/hospital-wl/models';
import fetchMock from 'jest-fetch-mock';

describe('tjmk-hospital-wl-list', () => {
  const sampleEntries: WaitingListEntry[] = [
    {
      id: "entry-1",
      patientId: "p-1",
      name: "Juraj Prvý",
      waitingSince: new Date("20240203T12:00"),
      estimatedDurationMinutes: 20
    },
    {
      id: "entry-2",
      patientId: "p-2",
      name: "James Druhý",
      waitingSince: new Date("20240203T12:00"),
      estimatedDurationMinutes: 5
    }
  ];

  beforeAll(() => {
    fetchMock.enableMocks();
  });

  afterEach(() => {
    fetchMock.resetMocks();
  });

  it('renders sample entries', async () => {
    // Mock the API response using sampleEntries
    fetchMock.mockResponseOnce(JSON.stringify(sampleEntries));

    // Set up the page with your component
    const page = await newSpecPage({
      components: [TjmkHospitalWlList],
      html: `<tjmk-hospital-wl-list hospital-id="test-hospital" api-base="http://test/api"></tjmk-hospital-wl-list>`,
    });
   
    const wlList = page.rootInstance as TjmkHospitalWlList;
    const expectedPatients = wlList?.waitingPatients?.length

    // Wait for the DOM to update
    await page.waitForChanges();

    // Query the rendered list items
    const items = page.root.shadowRoot.querySelectorAll("md-list-item");

    // Assert that the expected number of patients and rendered items match the sample entries
    expect(expectedPatients).toEqual(sampleEntries.length);
    expect(items.length).toEqual(expectedPatients);


  });
});
