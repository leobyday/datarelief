export interface CrisisOrg {
  slug: string;
  name: string;
  donationUrl: string;
  volunteerUrl?: string;
}

export interface CrisisResource {
  title: string;
  url: string;
  source: string;
  type: 'article' | 'guide' | 'report' | 'donate' | 'volunteer';
}

export interface Crisis {
  id: string;
  name: string;
  country: string;
  slug: string;
  peopleAffected: number;
  fundingGapUSD: number;
  fundingReceivedUSD: number;
  urgencyScore: number;
  lastUpdated: string;
  criticalNeeds: string[];
  organizations: CrisisOrg[];
  resources?: CrisisResource[];
  source?: string;
}
