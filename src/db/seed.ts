import { config } from "dotenv";
// Load Neon credentials from .env.local BEFORE the db client module is
// evaluated. Static imports are hoisted, so the client is pulled in
// dynamically below to guarantee env vars exist first.
config({ path: ".env.local" });

async function seed() {
  const { db } = await import("./index");
  const { authors } = await import("./schema");

  const [author] = await db
    .insert(authors)
    .values({
      name: "Editorial Team",
      slug: "editorial-team",
      bio: "The in-house editorial team behind our SEO content.",
      avatarUrl: "https://www.gravatar.com/avatar?d=mp",
      jobTitle: "Content Editor",
      sameAs: ["https://twitter.com/example"],
    })
    // Idempotent: re-running the seed won't create duplicate authors.
    .onConflictDoNothing({ target: authors.slug })
    .returning();

  if (author) {
    console.log("Inserted author:", author.id, `(${author.slug})`);
  } else {
    const [existing] = await db.select().from(authors);
    console.log(
      "Author already present, skipped insert:",
      existing?.id,
      `(${existing?.slug})`,
    );
  }
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
  });
