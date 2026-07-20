/**
 * Newsletter signup — PLACEHOLDER. Wire to your ESP (ConvertKit / Beehiiv /
 * Mailchimp) by handling the form submit against their API or a Route Handler.
 * Non-functional by design for now (no network, no storage).
 */
export default function Newsletter() {
  return (
    <section
      id="newsletter"
      aria-labelledby="newsletter-heading"
      className="rounded-2xl border border-border bg-muted p-8 text-center"
    >
      <h2
        id="newsletter-heading"
        className="text-xl font-semibold tracking-tight"
      >
        Get new posts in your inbox
      </h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
        Occasional updates on SEO and content strategy. No spam.
      </p>
      <form
        className="mx-auto mt-5 flex max-w-md flex-col gap-2 sm:flex-row"
        // Placeholder: prevent navigation. Replace with your ESP integration.
        action="#"
      >
        <input
          type="email"
          required
          placeholder="you@example.com"
          aria-label="Email address"
          className="field flex-1"
        />
        <button type="submit" className="btn btn-primary">
          Subscribe
        </button>
      </form>
    </section>
  );
}
