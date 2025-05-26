import { Hero } from 'components/layout/hero'; // New import
import { CategoryShowcase } from 'components/layout/category-showcase'; // New import
import { Carousel } from 'components/carousel';
import { ThreeItemGrid } from 'components/grid/three-items';
import Footer from 'components/layout/footer';

export const metadata = {
  description:
    'High-performance ecommerce store built with Next.js, Vercel, and Shopify.',
  openGraph: {
    type: 'website'
  }
};

export default function HomePage() {
  return (
    <>
      <Hero />

      {/* Explore Our Categories Section */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-3xl text-center my-8 sm:my-12 lg:my-16">
          Explore Our Categories
        </h2>
        <CategoryShowcase />
      </div>

      {/* Top Picks Section */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-3xl text-center my-8 sm:my-12 lg:my-16">
          Top Picks
        </h2>
        <Carousel />
      </div>
      
      {/* Optional: Title for ThreeItemGrid if desired, for now keeping it as is */}
      {/* <div>
        <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-3xl text-center my-8 sm:my-12 lg:my-16">
          Featured Highlights
        </h2>
        <ThreeItemGrid />
      </div> */}
      <ThreeItemGrid />

      <Footer />
    </>
  );
}
