/**
 * Newsletter signup — PLACEHOLDER. Wire to your ESP (ConvertKit / Beehiiv /
 * Mailchimp) by handling the form submit against their API or a Route Handler.
 * Non-functional by design for now (no network, no storage).
 */
export default function Newsletter() {
  return (
    <section
      aria-labelledby="newsletter"
      className="rounded-2xl border border-zinc-200 bg-zinc-50 p-8 text-center dark:border-zinc-800 dark:bg-zinc-900/40"
    >
      <h2 id="newsletter" className="text-xl font-semibold tracking-tight">
        Get new posts in your inbox
      </h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-zinc-500">
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
          className="flex-1 rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-950"
        />
        <button
          type="submit"
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white dark:bg-white dark:text-zinc-900"
        >
          Subscribe
        </button>
      </form>
    </section>
  );
}
