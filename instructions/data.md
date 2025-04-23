
## Database Team Tasks

| Task                                            | Priority | Depends On                     | Est. Effort | Notes                                     |
|-------------------------------------------------|:--------:|--------------------------------|:-----------:|-------------------------------------------|
| **Schema Design**                               |          |                                |             |                                           |
| Users, Orgs, Roles, Permissions tables          | P0       | Auth requirements              | 2 FP        | Use UUID PKs                              |
| Accounts, Transactions, TaxRate tables          | P0       | Accounting module              | 3 FP        | Composite indexes on (date, account_id)   |
| Items, Warehouses, StockEntry tables            | P1       | Inventory module               | 3 FP        | Foreign keys with cascade on delete       |
| Invoices, Payments, CreditNotes tables          | P1       | Invoicing module               | 2 FP        | Enforce referential integrity             |
| Documents, DocumentLink tables                  | P1       | Doc service                    | 2 FP        | JSON metadata column                      |
| ReportTemplates & Instances tables              | P1       | Reporting feature              | 2 FP        | Partition Instances by date               |
| **Optimization & Maintenance**                  |          |                                |             |                                           |
| Create materialized views for metrics           | P0       | Initial transaction load       | 2 FP        | Refresh schedule (hourly)                 |
| Index tuning & slow‑query analysis              | P1       | QA environment                 | 3 FP        | Use EXPLAIN                               |
| Backup & Restore policy (daily snapshots)       | P1       | DevOps backup infra            | 2 FP        | Test restores quarterly                   |
| DB migrations & version control setup           | P0       | CI/CD pipeline                 | 1 FP        | Use Flyway or Liquibase                   |

