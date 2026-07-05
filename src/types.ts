export interface CrisisOrg {
  slug: string;
  name: string;
  donationUrl: string;
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
}
