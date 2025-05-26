import Link from 'next/link';
import Image from 'next/image'; // Using next/image for optimized images
import { getCollections } from 'lib/bff';
import type { Collection } from 'lib/bff/types';

export async function CategoryShowcase() {
  let collections: Collection[] = [];
  try {
    collections = await getCollections();
  } catch (error) {
    console.error('Failed to fetch collections for CategoryShowcase:', error);
    return null; // Render nothing if fetching fails
  }

  const displayCollections = collections
    .filter(collection => collection.featuredImage && collection.featuredImage.url)
    .slice(0, 4); // Take up to 4 collections with featured images

  if (displayCollections.length === 0) {
    return null; // Render nothing if no suitable collections are found
  }

  return (
    <section className="py-12 sm:py-16 lg:py-20 bg-white dark:bg-gray-900">
      <div className="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
        {/* Optional: Add a title for the section if desired */}
        {/* <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-3xl lg:text-4xl mb-8 sm:mb-10 lg:mb-12 text-center">
          Shop by Category
        </h2> */}
        <div className="grid grid-cols-1 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6">
          {displayCollections.map((collection) => (
            <Link
              key={collection.handle}
              href={collection.path}
              className="group block rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200 ease-in-out"
            >
              <div className="relative h-48 w-full overflow-hidden"> {/* Container for Image */}
                {collection.featuredImage && ( // Ensure featuredImage exists before trying to render
                  <Image
                    src={collection.featuredImage.url}
                    alt={collection.featuredImage.altText || collection.title}
                    width={collection.featuredImage.width || 400} // Provide default or actual width
                    height={collection.featuredImage.height || 300} // Provide default or actual height
                    className="h-full w-full object-cover"
                  />
                )}
              </div>
              <div className="p-4"> {/* Padding for text content below image */}
                <h3 className="mt-2 text-lg font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400">
                  {collection.title}
                </h3>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
