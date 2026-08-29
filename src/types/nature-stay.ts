export interface PropertyType {
  id: string;
  code: string;
  name: string;
  description: string | null;
  icon: string | null;
  active: boolean;
  sort_order: number;
}

export interface UnitType {
  id: string;
  code: string;
  name: string;
  description: string | null;
  icon: string | null;
  active: boolean;
  sort_order: number;
}

export interface Amenity {
  id: string;
  code: string;
  name: string;
  description: string | null;
  icon: string | null;
  category: string;
  active: boolean;
  sort_order: number;
}

export interface HostPublicInfo {
  id: string;
  display_name: string;
  description: string | null;
  profile_image_path: string | null;
  cover_image_path: string | null;
  country_code: string;
  city: string | null;
  state: string | null;
  created_at: string;
}

export interface PropertyPublic {
  id: string;
  host_id: string;
  property_type_id: string;
  name: string;
  slug: string;
  short_description: string | null;
  description: string | null;
  country_code: string;
  state: string | null;
  city: string | null;
  municipality: string | null;
  timezone: string;
  check_in_time: string | null;
  check_out_time: string | null;
  instant_booking_enabled: boolean;
  pets_allowed: boolean | null;
  children_allowed: boolean | null;
  minimum_age: number | null;
  smoking_allowed: boolean | null;
  parties_allowed: boolean | null;
  accessibility_info: string | null;
  house_rules: string | null;
  created_at: string;
  updated_at: string;
}

export interface UnitPublic {
  id: string;
  property_id: string;
  unit_type_id: string;
  name: string;
  slug: string | null;
  description: string | null;
  quantity: number;
  max_guests: number;
  base_guests: number;
  max_adults: number | null;
  max_children: number | null;
  max_infants: number | null;
  bedrooms: number | null;
  beds: number | null;
  bathrooms: number | null;
  area_m2: number | null;
  pricing_mode: string;
  base_price: number;
  extra_guest_price: number | null;
  currency: string;
  minimum_nights: number;
  maximum_nights: number | null;
  pets_allowed: boolean | null;
  pet_fee: number | null;
  max_pets: number | null;
  check_in_time_override: string | null;
  check_out_time_override: string | null;
  created_at: string;
  updated_at: string;
}

export interface PropertyImagePublic {
  id: string;
  property_id: string;
  storage_path: string;
  alt_text: string | null;
  sort_order: number;
  is_cover: boolean;
  width: number | null;
  height: number | null;
  mime_type: string | null;
}

export interface PropertyAmenityPublic {
  property_id: string;
  amenity_id: string;
}

export interface UnitAmenityPublic {
  id: string;
  unit_id: string;
  amenity_id: string;
}

export interface UnitImagePublic {
  id: string;
  unit_id: string;
  storage_path: string;
  alt_text: string | null;
  caption: string | null;
  sort_order: number;
  is_cover: boolean;
  width: number | null;
  height: number | null;
  file_size: number | null;
  mime_type: string | null;
  created_at: string;
}

export interface PropertyTourLinkPublic {
  id: string;
  property_id: string;
  tour_id: string;
  active: boolean;
  featured: boolean;
  display_order: number;
  discount_type: string | null;
  discount_value: number | null;
  valid_from: string | null;
  valid_until: string | null;
  created_at: string;
}

export interface TourPublic {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  price: number | null;
  destination: string | null;
}

export interface UserRole {
  user_id: string;
  role: string;
  platform: string;
  is_active: boolean;
}
