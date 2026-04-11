import type { ListingProvider, Listing, ListingSearchParams } from "./provider";

export class ResoProvider implements ListingProvider {
  private token: string;
  private baseUrl: string;

  constructor(token: string, baseUrl: string) {
    this.token = token;
    this.baseUrl = baseUrl;
  }

  async search(params: ListingSearchParams) {
    // RESO Web API (OData v4) integration placeholder
    // In production: build OData query with $filter, $select, $orderby
    return { listings: [] as Listing[], total: 0 };
  }

  async getById(id: string) {
    return null;
  }

  async getFeatured(limit = 6) {
    return [] as Listing[];
  }
}
