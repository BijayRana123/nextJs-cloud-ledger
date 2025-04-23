

## Frontend Developer Tasks

| Task                                            | Priority | Depends On                          | Est. Effort | Notes                                    |
|-------------------------------------------------|:--------:|-------------------------------------|:-----------:|------------------------------------------|
| **Auth & Onboarding**                           |          |                                     |             |                                          |
| Build Login/Register pages                      | P0       | Auth API available                  | 3 FP        | Responsive, form validation              |
| “Forgot Password” & Reset UI                    | P0       | Password-reset endpoints            | 2 FP        | Include email confirmation flow          |
| Org Setup Wizard (first‑run)                    | P0       | Profile API                         | 3 FP        | Multi‑step, save progress                |
| **Dashboard & Analytics**                       |          |                                     |             |                                          |
| Dashboard Layout & Nav                          | P0       | UI kit + design assets              | 2 FP        | Sidebar, header                          |
| Stats Cards (revenue, expenses, stock)          | P0       | Metrics endpoints                   | 4 FP        | Card component with icon, tooltip        |
| Real‑time Chart Component                       | P0       | WebSocket/metrics API               | 3 FP        | Use Recharts or Chart.js                 |
| **Accounting Module**                           |          |                                     |             |                                          |
| Journal Entry List & Filters                    | P0       | Transactions API                    | 3 FP        | Table + pagination                       |
| New Journal Entry Form                          | P0       | Accounts API                        | 2 FP        | Debit/credit validation                  |
| VAT/Tax Report UI                               | P1       | Reporting API                       | 2 FP        | Date pickers + export buttons            |
| **Inventory Module**                            |          |                                     |             |                                          |
| Item Catalog (grid + search)                    | P1       | Inventory API                       | 4 FP        | Inline edit                              |
| Warehouse Stock View                            | P1       | StockTransfer API                   | 3 FP        | Drill‑down into item history             |
| **Invoicing & POS**                             |          |                                     |             |                                          |
| Quote → Order → Invoice Workflow UI             | P1       | Invoicing APIs                      | 6 FP        | Multi‑step modal                         |
| POS Quick‑Sell Screen                           | P2       | Payment API                         | 4 FP        | Barcode + numeric keypad                 |
| **Document Management**                         |          |                                     |             |                                          |
| File Upload & Preview Component                 | P1       | S3 pre‑signed URLs                  | 3 FP        | Drag‑and‑drop + thumbnail                |
| Link Documents to Transactions                  | P1       | DocumentLink API                    | 2 FP        | Context menu on transaction rows         |
| **Reporting Builder**                           |          |                                     |             |                                          |
| Report Builder UX (filters, tags, criteria)     | P1       | ReportTemplates API                 | 5 FP        | Save & reuse templates                   |
| Report Viewer & Export Buttons                  | P1       | ReportInstance API                  | 3 FP        | PDF/Excel download                       |

---

