import { getArticles } from 'lib/bff';
import type { Article } from 'lib/bff/types';
import Link from 'next/link';
import type { Metadata } from 'next';

// Optional but good practice: Add metadata for the page
export const metadata: Metadata = {
  title: 'Articles',
  description: 'Browse our latest articles and blog posts.',
};

export default async function ArticlesPage() {
  const articles = await getArticles();

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8 text-gray-900 dark:text-white">
        Articles
      </h1>

      {articles && articles.length > 0 ? (
        <div className="space-y-8">
          {articles.map((article) => (
            <article key={article.id} className="p-6 rounded-lg shadow-md bg-white dark:bg-gray-800 hover:shadow-lg transition-shadow duration-200 ease-in-out">
              <Link href={`/articles/${article.handle}`} className="group">
                <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                  {article.title}
                </h2>
              </Link>
              {article.author?.name && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  By {article.author.name}
                  {article.createdAt && 
                    <span> | Published: {new Date(article.createdAt).toLocaleDateString()}</span>
                  }
                </p>
              )}
              <p className="mt-3 text-gray-600 dark:text-gray-300">
                {article.body.substring(0, 200)}...
              </p>
              <Link
                href={`/articles/${article.handle}`}
                className="mt-4 inline-block text-blue-600 dark:text-blue-400 hover:underline"
              >
                Read more
              </Link>
            </article>
          ))}
        </div>
      ) : (
        <p className="text-gray-600 dark:text-gray-400">No articles found.</p>
      )}
    </div>
  );
}
