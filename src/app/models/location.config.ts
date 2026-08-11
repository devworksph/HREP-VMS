export type LocationSlug = 'museum' | 'library' | 'combined';

export interface ILocationConfig {
  slug: LocationSlug;
  /** Exact display name expected by the backend's `locationType` field. */
  displayName: string;
  contactNo: string;
  email: string;
  xAccount: string;
  tiktokAccount?: string;
  fbAccount?: string;
  infoBgImage: string;
  formTitle: string;
  scheduleSectionTitle: string;
  showPreferredTime: boolean;
  showPurposeOfVisit: boolean;
  purposeOfVisitRequired: boolean;
  showHouseLogo: boolean;
  showLibraryLogo: boolean;
}

export const LOCATIONS: Record<LocationSlug, ILocationConfig> = {
  museum: {
    slug: 'museum',
    displayName: 'The Legislative Museum of the House of Representatives',
    contactNo: '+63(02) 886-31023 loc. 7649 / 7650',
    email: 'legislativemuseum@house.gov.ph',
    xAccount: 'thehouse.museum',
    infoBgImage: 'info-bg.jpg',
    formTitle: 'Booking Form',
    scheduleSectionTitle: 'Tour Schedule',
    showPreferredTime: true,
    showPurposeOfVisit: false,
    purposeOfVisitRequired: false,
    showHouseLogo: true,
    showLibraryLogo: false
  },
  library: {
    slug: 'library',
    displayName: 'Library and Archives',
    contactNo: '+63(2) 893-15001 local 7101/7603  +63(995) 427-0655  +63(968) 411-1045',
    email: 'info.services@house.gov.ph',
    xAccount: 'HRepLAM',
    tiktokAccount: 'HREPLibraryArchivesMuseum',
    infoBgImage: 'lib-bg-info.jpg',
    formTitle: 'Registration Form',
    scheduleSectionTitle: 'Visit',
    showPreferredTime: false,
    showPurposeOfVisit: true,
    purposeOfVisitRequired: true,
    showHouseLogo: false,
    showLibraryLogo: true
  },
  combined: {
    slug: 'combined',
    displayName: 'Library, Archives and The House',
    contactNo: '+63(2) 893-15001 local 7101/7603  +63(995) 427-0655  +63(968) 411-1045',
    email: 'info.services@house.gov.ph',
    xAccount: 'HRepLAM',
    tiktokAccount: 'HREPLibraryArchivesMuseum',
    infoBgImage: 'lib-archive-house-bg-info.jpg',
    formTitle: 'Booking Form',
    scheduleSectionTitle: 'Tour Schedule',
    showPreferredTime: true,
    showPurposeOfVisit: true,
    purposeOfVisitRequired: false,
    showHouseLogo: true,
    showLibraryLogo: true
  }
};

export function isLocationSlug(value: string | null): value is LocationSlug {
  return !!value && value in LOCATIONS;
}

export function getLocationConfig(slug: string | null): ILocationConfig | undefined {
  return isLocationSlug(slug) ? LOCATIONS[slug] : undefined;
}
