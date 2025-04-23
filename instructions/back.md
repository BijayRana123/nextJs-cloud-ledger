## Backend Developer Tasks

| Task                                            | Priority | Depends On                     | Est. Effort | Notes                                      |
|-------------------------------------------------|:--------:|--------------------------------|:-----------:|--------------------------------------------|
| **Authentication**                              |          |                                |             |                                            |
| Signup/Login/JWT endpoints                      | P0       | User/Org DB schema             | 5 FP        | JWT access & refresh flows                 |
| Password Reset & Email Service                  | P0       | SMTP integration               | 3 FP        | Token expiry, rate‑limit                   |
| Role & Permission Middleware                    | P0       | Roles/Permissions schema       | 3 FP        | Use RBAC library                           |
| **Dashboard Metrics**                           |          |                                |             |                                            |
| Daily/Weekly/Monthly aggregates                 | P0       | Transactions + Inventory data  | 4 FP        | Materialized views or rollups              |
| Real‑time push via WebSockets                   | P1       | Redis pub/sub                  | 3 FP        | Authenticated channels                     |
| **Accounting APIs**                             |          |                                |             |                                            |
| CRUD for Accounts & Transactions                | P0       | DB schema                      | 6 FP        | Validation rules, atomicity                |
| Tax Calculation Service                         | P0       | Config store (tax rates)       | 3 FP        | Support multiple jurisdictions             |
| VAT/Tax Report endpoint                         | P1       | Transactions + config          | 4 FP        | CSV/PDF support                            |
| **Inventory APIs**                              |          |                                |             |                                            |
| Item, Warehouse, StockEntry CRUD                | P1       | DB schema                      | 5 FP        | Soft‑delete support                        |
| Stock Transfer Logic                            | P1       | Warehouse & Item tables        | 3 FP        | Validation (sufficient stock)              |
| **Invoicing & Payments**                        |          |                                |             |                                            |
| Invoice, Payment, CreditNote CRUD               | P1       | Transactions module            | 6 FP        | Idempotency on payment callbacks           |
| POS checkout endpoint                           | P2       | Payments gateway SDK           | 3 FP        | Webhook handling                           |
| **Document Service**                            |          |                                |             |                                            |
| S3 pre‑signed URL generator                     | P1       | AWS SDK config                 | 2 FP        | Expiry & ACL                               |
| Metadata & Links CRUD                           | P1       | DocumentLink schema            | 3 FP        | Soft deletes                               |
| **Reporting Engine**                            |          |                                |             |                                            |
| Template CRUD & storage                         | P1       | DB schema                      | 2 FP        | Versioning                                 |
| Dynamic Report Generator (PDF/Excel)            | P1       | Template + filtered data       | 6 FP        | Queue jobs, concurrency control            |

---
