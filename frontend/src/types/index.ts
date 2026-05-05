export type UserRole = "User" | "Admin" | "SuperAdmin";

export interface User {
  id: number;
  full_name: string;
  email: string;
  phone?: string;
  role: UserRole;
  status: string;
  email_verified: boolean;
  avatar_url?: string;
  created_at: string;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user_id: number;
  role: UserRole;
}

export type StarType =
  | "Main Sequence Star"
  | "Red Giant"
  | "Blue Giant"
  | "White Dwarf"
  | "Red Dwarf"
  | "Yellow Dwarf"
  | "Supergiant"
  | "Hypergiant"
  | "Neutron Star"
  | "Binary Star"
  | "Variable Star"
  | "Cepheid Variable"
  | "Pulsating Variable"
  | "Brown Dwarf"
  | "Protostar"
  | "Wolf-Rayet Star"
  | "Carbon Star"
  | "T Tauri Star"
  | "Subgiant"
  | "Spiral Galaxy"
  | "Barred Spiral Galaxy"
  | "Elliptical Galaxy"
  | "Irregular Galaxy"
  | "Lenticular Galaxy"
  | "Unknown / Unclassified";

export type RegistryStatus = "Available" | "Pending" | "Approved" | "Expired" | "Rejected";

export interface Star {
  id: number;
  catalog_id?: string;
  hip_id?: string;
  hd_id?: string;
  gaia_id?: string;
  bayer_designation?: string;
  flamsteed_designation?: string;
  common_name?: string;
  scientific_name?: string;
  custom_name?: string;
  ra: number;
  dec: number;
  ra_unit: "degrees" | "hours";
  magnitude?: number;
  absolute_magnitude?: number;
  constellation?: string;
  constellation_abbr?: string;
  spectral_class?: string;
  star_type: StarType;
  color_index_bv?: number;
  distance_light_years?: number;
  temperature_kelvin?: number;
  luminosity?: number;
  mass_solar?: number;
  radius_solar?: number;
  galaxy_name?: string;
  object_kind?: "star" | "galaxy";
  thumbnail_url?: string;
  is_visible_naked_eye: boolean;
  is_named: boolean;
  is_available_for_naming: boolean;
  registry_status: RegistryStatus;
}

export interface StarWithPosition extends Star {
  altitude?: number;
  azimuth?: number;
  is_visible: boolean;
  x?: number;
  y?: number;
  z?: number;
  dedication_type?: string;
  dedication_message?: string;
  recipient_name?: string;
  expiry_date?: string;
}

export type DedicationType =
  | "In Memory Of"
  | "Dedicated To"
  | "Self"
  | "Gift"
  | "Birthday"
  | "Anniversary"
  | "Wedding"
  | "Graduation"
  | "New Born Baby"
  | "Friendship"
  | "Parents"
  | "Spiritual Dedication"
  | "Teacher / Mentor"
  | "Corporate Gift"
  | "Custom Dedication";

export type ValidityPlan = "1year" | "5years" | "lifetime" | "custom";

export interface NamingRequest {
  id: number;
  star_id: number;
  user_id: number;
  requested_name: string;
  dedication_type: DedicationType;
  dedication_message?: string;
  relationship?: string;
  occasion?: string;
  recipient_name?: string;
  applicant_name: string;
  certificate_name?: string;
  validity_plan: ValidityPlan;
  visibility_preference: "Public" | "Private" | "Link Only";
  status: "Pending" | "Approved" | "Rejected" | "Expired" | "Cancelled";
  rejection_reason?: string;
  approved_at?: string;
  expiry_date?: string;
  renewal_count: number;
  certificate_id?: string;
  share_slug?: string;
  created_at: string;
}

export interface ObserverLocation {
  lat: number;
  lon: number;
  accuracy?: number;
  altitude?: number;
}

export interface DeviceOrientation {
  alpha: number | null;
  beta: number | null;
  gamma: number | null;
  absolute: boolean;
}

export type PermissionState = "prompt" | "granted" | "denied" | "unavailable" | "requesting";
