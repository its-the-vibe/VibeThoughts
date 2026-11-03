variable "cloudflare_account_id" {
  type        = string
  description = "Cloudflare Account ID"
}

variable "cloudflare_api_token" {
  type        = string
  sensitive   = true
  description = "Cloudflare API token with appropriate permissions"
}

variable "cloudflare_d1_database_name" {
  type        = string
  description = "Cloudflare D1 Database name"
}
