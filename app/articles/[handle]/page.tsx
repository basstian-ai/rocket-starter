import { getArticle, getArticles } from 'lib/bff';
import type { Article } from 'lib/bff/types';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Image from 'next/image'; // For optional featuredImage

// Function to generate static paths for all articles
export async function generateStaticParams() {
  const articles = await getArticles();
  return articles.map((article) => ({
    handle: article.handle,
  }));
}

// Function to generate metadata for the page
export async function generateMetadata(props: { params: Promise<{ handle: string }> }): Promise<Metadata> {
  const params = await props.params;
  const article = await getArticle(params.handle);

  if (!article) {
    return {
      title: 'Article Not Found',
      description: 'The requested article could not be found.',
    };
  }

  return {
    title: article.seo?.title || article.title,
    description: article.seo?.description || article.body.substring(0, 150),
    openGraph: article.featuredImage?.url ? {
      images: [
        {
          url: article.featuredImage.url,
          width: article.featuredImage.width,
          height: article.featuredImage.height,
          alt: article.featuredImage.altText,
        },
      ],
    } : undefined,
  };
}

// The main ArticlePage component
export default async function ArticlePage(props: { params: Promise<{ handle: string }> }) {
  const params = await props.params;
  const article = await getArticle(params.handle);

  if (!article) {
    notFound();
  }

  return (
    <article className="prose prose-lg mx-auto p-4 sm:p-6 lg:p-8 dark:prose-invert max-w-3xl">
      <h1>{article.title}</h1>
      
      {article.author?.name && (
        <p className="text-sm text-gray-600 dark:text-gray-400">
          By {article.author.name}
          {article.createdAt && 
            <span> | Published: {new Date(article.createdAt).toLocaleDateString()}</span>
          }
        </p>
      )}

      {article.featuredImage?.url && (
        <div className="my-8">
          <Image
            src={article.featuredImage.url}
            alt={article.featuredImage.altText || article.title}
            width={article.featuredImage.width || 700} // Default width if not provided
            height={article.featuredImage.height || 400} // Default height if not provided
            className="rounded-lg shadow-lg"
          />
        </div>
      )}

      {/* Assuming article.body is plain text. If it can contain HTML, use dangerouslySetInnerHTML after sanitization. */}
      <div className="mt-6 whitespace-pre-line text-gray-800 dark:text-gray-200">
        {article.body}
      </div>

      {article.tags && article.tags.length > 0 && (
        <div className="mt-8 pt-4 border-t border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold mb-2">Tags:</h3>
          <div className="flex flex-wrap gap-2">
            {article.tags.map((tag) => (
              <span key={tag} className="px-3 py-1 text-sm font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full">
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}
    </article>
  );
}
