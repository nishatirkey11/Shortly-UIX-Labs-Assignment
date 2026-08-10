export interface Link {
  id: number;
  slug: string;
  destinationUrl: string;
  clickCap: number | null;
  clickCount: number;
  disabled: boolean;
  createdAt: string;
}

export interface CreateLinkRequest {
  destinationUrl: string;
  customSlug?: string;
  clickCap?: number;
}

export interface CreateLinkResponse
  extends Link {
  shortUrl: string;
}

export interface LinksResponse {
  links: Link[];
  page: number;
  limit: number;
  total: number;
}

export interface StatsResponse {
  days: {
    date: string;
    clicks: number;
  }[];
}