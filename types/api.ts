// API request and response types

export interface StageContactsRequest {
  contact_ids: string[];
  campaign_key: string;
}

export interface StageContactsResponse {
  success: boolean;
  staged_count: number;
  skipped_count: number;
  errors?: string[];
  error?: string;
}

export interface CampaignConfig {
  campaign_key: string;
  campaign_name: string;
  core_values_mapping: Record<string, string>;
  required_fields: string[];
  optional_fields: string[];
}
