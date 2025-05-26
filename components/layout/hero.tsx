import Link from 'next/link';

/**
 * Renders the main hero section for the homepage.
 * It typically includes a background image, a headline, a short description,
 * and a call-to-action button linking to the search page.
 * This is a presentational component and does not fetch any data.
 */
export function Hero() {
  // Placeholder for the Hero component JSX
  return (
    <section className="py-16 sm:py-24 lg:py-32 bg-gray-100 dark:bg-gray-800 bg-[url('https://via.placeholder.com/1920x600.png?text=Hero+Background')] bg-cover bg-center">
      <div className="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8 text-center">
        <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-5xl lg:text-6xl">
          Winter Collection is Here
        </h1>
        <p className="mt-4 max-w-xl text-lg text-gray-700 dark:text-gray-300 sm:mt-6 mx-auto">
          Discover the latest trends for the season.
        </p>
        <Link
          href="/search"
          className="mt-8 inline-block rounded-md border border-transparent bg-blue-600 px-8 py-3 text-base font-medium text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
        >
          Shop Now
        </Link>
      </div>
    </section>
  );
}

// Using named export as per convention in other components
// export default Hero;
// If a default export is strictly required by the problem, I can change this.
// For now, named export seems fine based on existing project structure.
// The problem statement says "export function Hero() { ... }" or "export default Hero;", so named export is fine.
