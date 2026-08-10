import type { Request, Response } from "express";

import { db } from "../db/index.js";

import {
  links,
  clicks
} from "../db/schema.js";

import {
  and,
  eq,
  ilike,
  isNull,
  lt,
  or,
  sql,
  desc
} from "drizzle-orm";

import { generateSlug } from "../services/slug.service.js";

export async function createLink(
    req: Request,
    res: Response
) {
    try {
        const {
            destinationUrl,
            customSlug,
            clickCap
        } = req.body;

        // Validate destination URL
        let url: URL;

        try {
            url = new URL(destinationUrl);
        } catch {
            return res.status(400).json({
                error: "Invalid destination URL"
            });
        }

        if (
            url.protocol !== "http:" &&
            url.protocol !== "https:"
        ) {
            return res.status(400).json({
                error: "Destination URL must use HTTP or HTTPS"
            });
        }

        // Validate click cap
        if (
            clickCap !== undefined &&
            clickCap !== null &&
            (
                !Number.isInteger(clickCap) ||
                clickCap <= 0
            )
        ) {
            return res.status(400).json({
                error: "Click cap must be a positive integer"
            });
        }

        // Validate custom slug
        if (
            customSlug &&
            !/^[a-zA-Z0-9-]+$/.test(customSlug)
        ) {
            return res.status(400).json({
                error: "Invalid slug"
            });
        }

        let slug = customSlug;

        // Generate random slug if user didn't provide one
        if (!slug) {
            slug = generateSlug(6);

            // Extremely unlikely collision protection
            let exists = await db
                .select({ id: links.id })
                .from(links)
                .where(eq(links.slug, slug))
                .limit(1);

            while (exists.length > 0) {
                slug = generateSlug(6);

                exists = await db
                    .select({ id: links.id })
                    .from(links)
                    .where(eq(links.slug, slug))
                    .limit(1);
            }
        }

        // Check custom slug conflict
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

        const [newLink] = await db
            .insert(links)
            .values({
                slug,
                destinationUrl: url.toString(),
                clickCap: clickCap ?? null
            })
            .returning();

        if (!newLink) {
            return res.status(500).json({
                error: "Failed to create link"
            });
        }


        return res.status(201).json({
            id: newLink.id,
            slug: newLink.slug,
            destinationUrl: newLink.destinationUrl,
            clickCap: newLink.clickCap,
            clickCount: newLink.clickCount,
            disabled: newLink.disabled,
            createdAt: newLink.createdAt,
            shortUrl: `http://localhost:${process.env.PORT || 5000}/r/${newLink.slug}`
        });

    } catch (error) {
        console.error(error);

        return res.status(500).json({
            error: "Something went wrong"
        });
    }
}


export async function redirectLink(
    req: Request,
    res: Response
) {
    const slugParam = req.params.slug;
    const slug = Array.isArray(slugParam)
        ? slugParam[0]
        : slugParam;

    // Guard to ensure slug is defined
    if (!slug) {
        return res.status(400).json({
            error: "Slug is required"
        });
    }

    try {
        // First find the link.
        const result = await db
            .select()
            .from(links)
            .where(eq(links.slug, slug))
            .limit(1);

        if (result.length === 0) {
            return res.status(404).json({
                error: "Link not found"
            });
        }

        const link = result[0];
        
        // Fix 2: Guard to ensure link is defined (narrow type from Link | undefined to Link)
        if (!link) {
            return res.status(404).json({
                error: "Link not found"
            });
        }

        /*
         * The increment must happen atomically.
         *
         * We only increment when the link is active
         * and either has no cap or still has capacity.
         */
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

        if (updated.length === 0) {
            return res.status(410).json({
                error: "Link is disabled or click cap reached"
            });
        }

        // Record the successful click.
        await db.insert(clicks).values({
            linkId: link.id,
            timestamp: new Date(),
            referrer: req.get("referer") || null
        });

        // Successful short-link redirect.
        return res.redirect(302, link.destinationUrl);

    } catch (error) {
        console.error(error);

        return res.status(500).json({
            error: "Something went wrong"
        });
    }
}

export async function disableLink(
  req: Request,
  res: Response
) {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id)) {
      return res.status(400).json({
        error: "Invalid link ID"
      });
    }

    const updated = await db
      .update(links)
      .set({
        disabled: true
      })
      .where(eq(links.id, id))
      .returning();

    if (updated.length === 0) {
      return res.status(404).json({
        error: "Link not found"
      });
    }

    return res.json({
      message: "Link disabled",
      link: updated[0]
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: "Something went wrong"
    });
  }
}


export async function deleteLink(
  req: Request,
  res: Response
) {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id)) {
      return res.status(400).json({
        error: "Invalid link ID"
      });
    }

    const deleted = await db
      .delete(links)
      .where(eq(links.id, id))
      .returning();

    if (deleted.length === 0) {
      return res.status(404).json({
        error: "Link not found"
      });
    }

    return res.json({
      message: "Link deleted"
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: "Something went wrong"
    });
  }
}


export async function getLinks(
  req: Request,
  res: Response
) {
  try {
    const search =
      typeof req.query.search === "string"
        ? req.query.search.trim()
        : "";

    const page =
      Math.max(
        Number(req.query.page) || 1,
        1
      );

    const limit =
      Math.min(
        Math.max(
          Number(req.query.limit) || 10,
          1
        ),
        100
      );

    const offset = (page - 1) * limit;

    const searchCondition = search
      ? or(
          ilike(
            links.slug,
            `%${search}%`
          ),
          ilike(
            links.destinationUrl,
            `%${search}%`
          )
        )
      : undefined;

    const data = await db
      .select()
      .from(links)
      .where(searchCondition)
      .orderBy(desc(links.createdAt))
      .limit(limit)
      .offset(offset);

    const countResult = await db
      .select({
        count: sql<number>`count(*)`
      })
      .from(links)
      .where(searchCondition);

    const total = Number(
      countResult[0]?.count ?? 0
    );

    return res.json({
      links: data,
      page,
      limit,
      total
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: "Something went wrong"
    });
  }
}

export async function getLinkById(
  req: Request,
  res: Response
) {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id)) {
      return res.status(400).json({
        error: "Invalid link ID"
      });
    }

    const result = await db
      .select()
      .from(links)
      .where(eq(links.id, id))
      .limit(1);

    if (result.length === 0) {
      return res.status(404).json({
        error: "Link not found"
      });
    }

    return res.json(result[0]);

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: "Something went wrong"
    });
  }
}

export async function getLinkStats(
  req: Request,
  res: Response
) {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id)) {
      return res.status(400).json({
        error: "Invalid link ID"
      });
    }

    const link = await db
      .select()
      .from(links)
      .where(eq(links.id, id))
      .limit(1);

    if (link.length === 0) {
      return res.status(404).json({
        error: "Link not found"
      });
    }

    const result = await db.execute(sql`
      SELECT
        TO_CHAR(
          DATE_TRUNC('day', timestamp AT TIME ZONE 'UTC'),
          'YYYY-MM-DD'
        ) AS date,
        COUNT(*)::int AS clicks
      FROM clicks
      WHERE link_id = ${id}
        AND timestamp >= CURRENT_TIMESTAMP - INTERVAL '6 days'
      GROUP BY DATE_TRUNC(
        'day',
        timestamp AT TIME ZONE 'UTC'
      )
      ORDER BY date;
    `);

    const rows = result.rows as Array<{
      date: string;
      clicks: number;
    }>;

    const clickMap = new Map(
      rows.map(row => [
        row.date,
        Number(row.clicks)
      ])
    );

    const days = [];

    const today = new Date();

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);

      date.setUTCDate(
        date.getUTCDate() - i
      );

      const dateString =
        date.toISOString().slice(0, 10);

      days.push({
        date: dateString,
        clicks: clickMap.get(dateString) || 0
      });
    }

    return res.json({
      days
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: "Something went wrong"
    });
  }
}