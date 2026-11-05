terraform {
  required_version = ">= 1.15.0"

  required_providers {
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 5.0"
    }
  }
}

provider "cloudflare" {
  api_token = var.cloudflare_api_token
}

resource "cloudflare_worker" "my_worker" {
  account_id = var.cloudflare_account_id
  name       = "vibe-thoughts"

  observability = {
    enabled = true
  }

  subdomain = {
    enabled          = true
    previews_enabled = true
  }
}

resource "cloudflare_d1_database" "my_database" {
  account_id = var.cloudflare_account_id
  name       = var.cloudflare_d1_database_name
}

resource "cloudflare_worker_version" "my_worker_version" {
  account_id         = var.cloudflare_account_id
  worker_id          = cloudflare_worker.my_worker.id
  compatibility_date = "2026-10-26"
  main_module        = "index.js"

  modules = [
    {
      name         = "index.js"
      content_type = "application/javascript+module"
      content_file = "${path.module}/../app/dist/index.js"
    }
  ]

  bindings = [
    {
      name = "AI"
      type = "ai"
    },
    {
      name = "DB"
      type = "d1"
      id   = cloudflare_d1_database.my_database.id
    }
  ]
}

resource "cloudflare_workers_deployment" "my_worker_deployment" {
  account_id  = var.cloudflare_account_id
  script_name = cloudflare_worker.my_worker.name
  strategy    = "percentage"
  versions = [{
    percentage = 100
    version_id = cloudflare_worker_version.my_worker_version.id
  }]
}

resource "cloudflare_workers_cron_trigger" "my_worker_cron" {
  account_id  = var.cloudflare_account_id
  script_name = cloudflare_worker.my_worker.name

  schedules = [{
    cron = "0 7 * * *"
  }]

  depends_on = [cloudflare_workers_deployment.my_worker_deployment]
}

resource "cloudflare_workers_custom_domain" "worker_domain" {
  account_id = var.cloudflare_account_id
  zone_id    = var.cloudflare_zone_id
  hostname   = var.cloudflare_worker_hostname
  service    = cloudflare_worker.my_worker.name
}
