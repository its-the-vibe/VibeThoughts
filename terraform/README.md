## Terraform for deploying VibeAuth

### Configure variables

Copy `terraform.tfvars.example` to `terraform.tfvars` and replace the example
values with the credentials for your environment.

Alternatively, provide variables through `TF_VAR_<variable_name>` environment
variables. Do not commit `terraform.tfvars` or expose secret values in logs. Terraform marks secrets as sensitive, but they are still stored 
in Terraform state; protect access to the state backend accordingly.

### Deploy

```
terraform init -backend-config .backend.tfvars

# allow multi arch
terraform providers lock -platform=linux_arm64 -platform=darwin_arm64

terraform plan -out tf.plan

terraform apply tf.plan
```
