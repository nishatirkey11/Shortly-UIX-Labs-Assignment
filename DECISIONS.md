# Engineering Architecture & Design Decisions

This document details the core technical decisions, concurrency strategies, database designs, and trade-offs implemented in **Shortly**—a high-performance, full-stack URL shortening application. These considerations align with production-grade engineering principles, focusing on data consistency, timezone standardization, resource scaling, and application resilience.

---

## 1. Custom Slug Conflict Resolution
When creating a short link, custom slugs must be globally unique to ensure routing determinism. A duplicate custom slug returns a **409 Conflict** HTTP status code.

### Architectural Choice & Data Integrity
* **Routing Determinism**: If duplicate custom slugs were permitted, the lookup query for a redirected route `/r/:slug` would become non-deterministic, routing users to incorrect destinations.
* **Double-Layered Uniqueness**: We enforce uniqueness at two levels:
  1. **Database Constraint**: A strict `UNIQUE` constraint is set on the `slug` column in the `links` table in [schema.ts](file:///c:/Users/neela/Desktop/UIX-Assignment/shortly/server/src/db/schema.ts#L14-L16).
  2. **Application Guard**: An upfront check in [link.controller.ts](file:///c:/Users/neela/Desktop/UIX-Assignment/shortly/server/src/controllers/link.controller.ts#L102-L113) rejects requests before hitting database exceptions, avoiding unhandled Postgres transaction rollbacks.

```typescript
// server/src/controllers/link.controller.ts
const existingLink = await db
    .select({ id: links.id })
    .from(links)
    .where(eq(links.slug, slug))
    .limit(1);

if (existingLink.length > 0) {
    return res.status(409).json({
        error: "Slug already exists"
    });
}
```

---

## 2. Atomic Click Cap Enforcement (High Concurrency Protection)
A critical requirement is that a link must never exceed its configured `clickCap`, even under massive concurrent request volume. 

### The Concurrency Problem (TOCTOU)
A naive approach would perform a **Time-of-Check to Time-of-Use (TOCTOU)** flow:
1. Read current `clickCount` from the database.
2. Verify `clickCount < clickCap` in application memory.
3. Increment `clickCount` and redirect the user.

Under high concurrency (e.g. flash sales, social media spikes), multiple threads can simultaneously check the count, find it below the cap, and proceed to redirect. This results in exceeding the cap (e.g., 105 clicks recorded for a cap of 100).

### The Atomic SQL Solution
To prevent race conditions without relying on slow application-level locks, we handle the validation and increment in a **single atomic SQL update statement** with row-level locks, executed in [link.controller.ts](file:///c:/Users/neela/Desktop/UIX-Assignment/shortly/server/src/controllers/link.controller.ts#L197-L212):

```typescript
const updated = await db
    .update(links)
    .set({
        clickCount: sql`${links.clickCount} + 1`
    })
    .where(
        and(
            eq(links.id, link.id),
            eq(links.disabled, false),
            or(
                isNull(links.clickCap),
                lt(links.clickCount, links.clickCap)
            )
        )
    )
    .returning();
```

### Execution Flow under Concurrency:
1. When multiple concurrent requests target the final click (e.g., click `99` of `100`), PostgreSQL serializes the updates on that specific row using row-level locking.
2. The transaction that acquires the write lock first will evaluate the `WHERE` condition. It finds `clickCount (99) < clickCap (100)`, increments `clickCount` to `100`, and commits.
3. The waiting transactions acquire the lock sequentially. Upon acquiring the lock, they re-evaluate the `WHERE` condition against the newly updated state (`clickCount = 100`). Since `100 < 100` is false, the condition fails.
4. The database updates `0` rows for the subsequent transactions. The application detects the empty result (`updated.length === 0`) and immediately returns a **410 Gone / disabled** HTTP status, successfully enforcing the cap.

---

## 3. Decoupling Metrics Retention from Redirection Restrictions (Stats After Cap)
When a link reaches its click cap or is manually disabled, future redirections are blocked. However, historical analytics must remain fully queryable.

### Architectural Separation
We decouple the status of a redirect from its analytics history. In [schema.ts](file:///c:/Users/neela/Desktop/UIX-Assignment/shortly/server/src/db/schema.ts#L35-L49), clicks are stored in a separate `clicks` table with a foreign key relationship to the `links` table:
```typescript
export const clicks = pgTable("clicks", {
  id: serial("id").primaryKey(),
  linkId: integer("link_id").notNull().references(() => links.id, { onDelete: "cascade" }),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  referrer: text("referrer")
});
```
When a link becomes capped, only the redirection route (`/r/:slug`) rejects requests. The management dashboard and analytics aggregation endpoint (`/api/links/:id/stats`) continue to function normally. This ensures creators can access post-campaign performance reviews and inspect historical referral metrics.

---

## 4. Timezone Standardization (UTC Daily Aggregation)
Analytics aggregate click volume per day. We standardize all date truncations and aggregations to **UTC (Coordinated Universal Time)**.

### Implementation
In [link.controller.ts](file:///c:/Users/neela/Desktop/UIX-Assignment/shortly/server/src/controllers/link.controller.ts#L455-L470), date truncation is executed on the database server using PostgreSQL's native timezone formatting:

```sql
SELECT
  TO_CHAR(
    DATE_TRUNC('day', timestamp AT TIME ZONE 'UTC'),
    'YYYY-MM-DD'
  ) AS date,
  COUNT(*)::int AS clicks
FROM clicks
WHERE link_id = ${id}
  AND timestamp >= CURRENT_TIMESTAMP - INTERVAL '6 days'
GROUP BY DATE_TRUNC('day', timestamp AT TIME ZONE 'UTC')
ORDER BY date;
```

### Why UTC Standardization is Crucial:
1. **Consistency**: Prevents layout inconsistencies or mismatched charts between different users (or the same user traveling between timezones).
2. **Daylight Saving Time (DST) Immunity**: Normalizing to UTC prevents daily buckets from experiencing double-counted hours or missing hours during DST transitions.
3. **Database Performance**: Querying and grouping on standardized timestamp zones allows PostgreSQL to optimize database index scans.

---

## 5. Architectural Trade-offs & Scaling Strategy
As a high-traffic production service, URL redirection must optimize for low latency and high availability.

### Cache Layering (Proposed Redis Cache)
* **Current Limitation**: Every redirection request hits PostgreSQL twice: once to check/update the link status, and once to record the click event. Under high load, this causes a major database resource bottleneck.
* **Optimization**: Introduce an in-memory key-value cache (e.g., Redis) to cache the slug-to-destination URL mapping.
* **Write-Back Policy**: Redirection lookups resolve in `<2ms` from memory. Click count increments and click events are buffered in memory and flushed to PostgreSQL asynchronously in batches (e.g., every 5 seconds or via a message queue like RabbitMQ/Kafka), separating hot path reads from slow storage writes.

### Slug Generation Mechanics
* **Current Mechanism**: A randomly generated slug is created, followed by a check in a loop to resolve collisions.
* **Production Risk**: As the database grows to millions of links, slug collisions will increase, scaling check queries linearly.
* **Scalable Alternatives**:
  * **Base62 ID Encoding**: Convert the auto-incrementing integer primary key (or a Snowflake ID) to a Base62 representation (e.g., `12345` -> `3d7`). This guarantees absolute uniqueness with zero lookup queries.
  * **Pre-generated Tokens**: Use a background worker to pre-populate a pool of unique slugs (e.g. in Redis), allowing the web server to pop a slug instantly during link creation.

---

## 6. Technical Debt & Code Cleanup
### Frontend CreateLinkForm Delay
In the current React client [CreateLinkForm.tsx](file:///c:/Users/neela/Desktop/UIX-Assignment/shortly/client/src/components/CreateLinkForm.tsx#L91-L94), there is an artificial delay:
```typescript
// client/src/components/CreateLinkForm.tsx
//   onCreated();
setTimeout(() => {
  onCreated();
}, 5000);
```
* **Implications**: When a link is created, the dashboard dashboard list does not refresh for 5 seconds. This is a negative UX pattern.
* **Resolution**: This delay should be removed. The dashboard should either re-fetch instantly on callback (`onCreated()`) or implement optimistic UI updates, showing the newly generated link immediately in a loading state.

---

## 7. AI Assistant Utilization Disclosure
AI assistant systems were utilized during development to verify concurrency patterns, review SQL optimizations, and format comprehensive system documents.
* **Concurrency Validation**: Verified that the SQL condition within the update clause acts as a concurrency barrier under PostgreSQL transactional guarantees.
* **Refactoring and Review**: Assisted in refactoring endpoint types and cleaning up Express route definitions.
