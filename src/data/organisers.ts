import type { Organiser, OrganiserType } from '../types';

// All fictional.
export const ORGANISERS: Organiser[] = [
  { id: 'org-thames', name: 'Thames Tech Training', type: 'provider', cities: ['London'] },
  { id: 'org-citypm', name: 'City Project Academy', type: 'provider', cities: ['London'] },
  { id: 'org-northline', name: 'Northline Bank', type: 'employer', cities: ['London', 'Manchester'] },
  { id: 'org-buildright', name: 'Buildright Projects', type: 'employer', cities: ['Manchester'] },
  { id: 'org-mancunian', name: 'Mancunian University Apprenticeships', type: 'uni', cities: ['Manchester'] },
  { id: 'org-collective', name: 'Apprentice Collective', type: 'apprentice', cities: ['London', 'Manchester'] },
];

export const ORGANISER_TYPE_LABEL: Record<OrganiserType, string> = {
  employer: 'Employer',
  provider: 'Provider',
  uni: 'University',
  apprentice: 'Apprentice-run',
};

/** Rule 5: only employer, provider and uni organisers can tag KSBs. */
export function canTagKsbs(o: Organiser | undefined): boolean {
  return !!o && o.type !== 'apprentice';
}
