import {
  pgTable,
  serial,
  varchar,
  text,
  integer,
  boolean,
  timestamp
} from "drizzle-orm/pg-core";

export const links = pgTable("links", {
  id: serial("id").primaryKey(),

  slug: varchar("slug", {
    length: 100
  }).notNull().unique(),

  destinationUrl: text("destination_url").notNull(),

  clickCap: integer("click_cap"),

  clickCount: integer("click_count")
    .notNull()
    .default(0),

  disabled: boolean("disabled")
    .notNull()
    .default(false),

  createdAt: timestamp("created_at")
    .notNull()
    .defaultNow()
});

export const clicks = pgTable("clicks", {
  id: serial("id").primaryKey(),

  linkId: integer("link_id")
    .notNull()
    .references(() => links.id, {
      onDelete: "cascade"
    }),

  timestamp: timestamp("timestamp")
    .notNull()
    .defaultNow(),

  referrer: text("referrer")
});