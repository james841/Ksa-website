-- The homepage carousel used to hold one card per service, which repeated the
-- services page. It now holds one card per part of the website. This removes the
-- old single-service cards and puts the four cards in their place, so the live
-- site is correct without anyone having to press anything in the admin.
--
-- Cards the team added themselves are left alone: only cards pointing at a single
-- service page, or at nothing at all, are removed.

DELETE FROM "home_slides"
WHERE "href" IS NULL
   OR "href" = ''
   OR "href" LIKE '/services/%'
   OR "title" IN ('For institutions', 'For individuals');
--> statement-breakpoint
INSERT INTO "home_slides" ("title", "caption", "href", "image", "position", "published")
SELECT v.title, v.caption, v.href, v.image, v.position, TRUE
FROM (
  VALUES
    ('Research services', 'All eight services, for individuals and for institutions.', '/services', '/images/services/design-blue.webp', 0),
    ('Free monthly webinars', 'Live sessions on Zoom, every month, open to everyone.', '/webinars', '/images/services/topic-blue.webp', 1),
    ('Self-paced online courses', 'Short courses you can take at your own pace, on your own time.', '/courses', '/images/services/proposal-blue.webp', 2),
    ('Publishing and conferences', 'Journal support, our partner journal and scholarly events.', '/publishing', '/images/services/manuscript-blue.webp', 3)
) AS v(title, caption, href, image, position)
WHERE NOT EXISTS (SELECT 1 FROM "home_slides");
