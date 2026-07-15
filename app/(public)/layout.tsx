import { getCategories } from "@/src/lib/posts";
import SiteHeader from "@/src/components/site/SiteHeader";
import SiteFooter from "@/src/components/site/SiteFooter";
import AdScript from "@/src/components/ads/AdScript";
import ConsentBanner from "@/src/components/ads/ConsentBanner";

// Public site chrome. Applies to everything under (public); NOT to /admin.
export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const categories = await getCategories();

  return (
    <>
      {/* Ad loader (dormant unless configured) + consent seam */}
      <AdScript />
      <ConsentBanner />

      <SiteHeader categories={categories} />
      <main className="flex-1">{children}</main>
      <SiteFooter categories={categories} />
    </>
  );
}
