# Architectural Decisions

## CSV Import Pipeline
- **Decision:** The system will never silently fix data anomalies that affect financial totals or user attribution.
- **Rationale:** Financial data integrity is critical. Incorrect assumptions (like guessing missing payers or correcting >100% sums) lead to loss of trust.
- **Implementation:** The CSV import will be a multi-step wizard. Step 1: Parsing & Validation. Step 2: Anomaly Resolution (UI prompts user for missing data, corrections, alias mapping). Step 3: Final Import.

## Data Normalization
- **Decision:** Minor formatting issues (casing, trailing spaces, commas in numbers, >2 decimal places) will be auto-corrected during import without blocking the user.
- **Rationale:** Reduces friction for obvious typos that don't change the underlying meaning or mathematical correctness.

## Unknown Entities
- **Decision:** Unrecognized users in the CSV will trigger a mapping step where the user can either map them to an existing user (e.g., "Priya S" -> "Priya") or create a new guest member.
- **Rationale:** Prevents duplicate accounts and ensures balances remain accurate across different names for the same person.
