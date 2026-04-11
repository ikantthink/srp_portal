export interface Listing {
  id: string;
  address: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  sqft: number;
  photos: string[];
  description: string;
  status: string;
  listing_date: string;
}

export interface ListingSearchParams {
  query?: string;
  min_price?: number;
  max_price?: number;
  bedrooms?: number;
  bathrooms?: number;
  page?: number;
  limit?: number;
}

export interface ListingProvider {
  search(params: ListingSearchParams): Promise<{ listings: Listing[]; total: number }>;
  getById(id: string): Promise<Listing | null>;
  getFeatured(limit?: number): Promise<Listing[]>;
}
