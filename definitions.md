# Domain Definitions

## Core Entities

### Test (Experiment)
A container for an A/B test. It defines the parameters of the experiment, including the target section of the application, the type of assignment algorithm (static vs. dynamic), and traffic filters.

**Types:**
*   **static**: Uses deterministic hashing for consistent, stateless assignment.
*   **dynamic**: Uses Multi-Armed Bandit algorithms (Thompson Sampling) to optimize for the best-performing variation over time.

### Variation
A specific version of the experience being tested (e.g., "Control", "Blue Button", "New Layout"). Users are assigned to exactly one variation per test.

**Properties:**
*   Contains a `weight` (probability of selection).
*   Contains a `data` payload (JSON configuration sent to the client).

### Subject
The entity being tested. This is usually a user, but could be a browser fingerprint, device ID, or account ID. It is the key used for consistent hashing and assignment.

### Section
A specific area or feature of the application where tests run (e.g., "checkout_page", "pricing_modal"). Multiple tests can target the same section, but a subject usually participates in only one test per section at a time.

### Session
Represents a user's interaction period. It tracks which tests the user has seen (`test_ids`) and which variations they were assigned (`variation_ids`) to ensure consistency (stickiness) across requests.

---

## Assignment & Logic

### Participation
The act of a subject entering a test and being assigned a variation. This logic handles:
*   **Stickiness**: Returning the same variation if the user has already participated.
*   **Exclusion**: Checking if the user matches specific filters.
*   **Queueing**: Determining which test to show if multiple tests exist for a section.

### Filter
A rule set used to include or exclude subjects from a test based on their attributes (e.g., "Country is US", "Device is Mobile").

### Queue
A mechanism (stored in Redis/Valkey) that orders tests for a specific `subject_id` and `section_id`. This ensures users don't get enrolled in conflicting tests simultaneously.

### SKIP
A special state indicating that a subject was evaluated for a test but was deliberately skipped (e.g., due to filters or random sampling), preventing them from being re-evaluated for that specific test instance.

---

## Metrics & Analytics

### Event
A user action recorded during a test (e.g., "clicked_button", "purchased").

### Conversion
A specific type of event that represents a successful outcome for the test.

### Impression
A record that a subject viewed a specific variation.

### Alpha / Beta
Statistical terms used in the Thompson Sampling algorithm:
*   **Alpha**: Represents the number of successes (conversions).
*   **Beta**: Represents the number of failures (impressions minus conversions).

---

## Infrastructure

### Migrator
The system responsible for versioning the database schema. It supports different storage backends (Postgres, ClickHouse, etc.).

### Dict (Dictionary)
A fast key-value store (Redis/Valkey) used for caching test configurations, session data, and managing the test queues.

### Store
The primary relational database (Postgres) holding the configuration of tests, users, and organizations.

### Metrics Store
A high-volume analytical database (ClickHouse or DuckDB) used to store raw event logs and compute statistical performance.
