// Removed HIDDEN_PRODUCT_TAG and TAGS from lib/constants
import { NextResponse } from 'next/server';
import {
  Cart,
  Collection,
  Connection, // Un-commented
  Image,      // Un-commented
  Menu,
  Page,
  Product,
  Article // Added Article type
} from './types';
import { dummyMenu, dummyCollections, dummyProducts, dummyCart, dummyArticles } from './dummy-data'; // Added dummyArticles

export async function createCart(): Promise<Cart> {
  return Promise.resolve(dummyCart);
}

export async function addToCart(
  lines: { merchandiseId: string; quantity: number }[]
): Promise<Cart> {
  console.log('addToCart called with lines:', lines);
  return Promise.resolve(dummyCart);
}

export async function removeFromCart(lineIds: string[]): Promise<Cart> {
  console.log('removeFromCart called with lineIds:', lineIds);
  return Promise.resolve(dummyCart);
}

export async function updateCart(
  lines: { id: string; merchandiseId: string; quantity: number }[]
): Promise<Cart> {
  console.log('updateCart called with lines:', lines);
  return Promise.resolve(dummyCart);
}

export async function getCart(): Promise<Cart | undefined> {
  return Promise.resolve(dummyCart);
}

export async function getCollection(
  handle: string
): Promise<Collection | undefined> {
  const collection = dummyCollections.find(c => c.handle === handle);
  // The dummyCollection already has the path property.
  return Promise.resolve(collection);
}

export async function getCollectionProducts({
  collection,
  reverse,
  sortKey
}: {
  collection: string;
  reverse?: boolean;
  sortKey?: string;
}): Promise<Product[]> {
  // Basic filtering, ignoring reverse and sortKey for dummy data
  let products = dummyProducts;
  if (collection) {
    products = dummyProducts.filter(p => p.tags.includes(collection));
  }

  // TODO: Implement reverse and sortKey if needed for dummy data
  if (reverse) {
    products = products.slice().reverse();
  }
  if (sortKey === 'CREATED_AT') { // Example sortKey
    products = products.slice().sort((a, b) =>
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  } else if (sortKey === 'PRICE_ASC') {
     products = products.slice().sort((a,b) => parseFloat(a.priceRange.minVariantPrice.amount) - parseFloat(b.priceRange.minVariantPrice.amount));
  } else if (sortKey === 'PRICE_DESC') {
    products = products.slice().sort((a,b) => parseFloat(b.priceRange.minVariantPrice.amount) - parseFloat(a.priceRange.minVariantPrice.amount));
  }


  return Promise.resolve(products);
}

export async function getCollections(): Promise<Collection[]> {
  // The dummyCollections already have the path property.
  return Promise.resolve(dummyCollections);
}

export async function getMenu(handle: string): Promise<Menu[]> {
  console.log('getMenu called with handle:', handle);
  // Assuming dummyMenu is an array of all menu items.
  // If `handle` is meant to fetch a specific menu, logic would go here.
  // For now, returning the whole dummyMenu.
  return Promise.resolve(dummyMenu);
}

export async function getPage(handle: string): Promise<Page> {
  // Return a generic page or find in dummy data if available
  // Example:
  // const page = dummyPages.find(p => p.handle === handle);
  // if (page) return Promise.resolve(page);

  return Promise.resolve({
    id: `dummy-page-${handle}`,
    title: `Dummy Page (${handle})`,
    handle: handle,
    body: `This is a dummy page for handle: ${handle}. Content can be fetched or generated here.`,
    bodySummary: `Summary for dummy page ${handle}.`,
    seo: { title: `Dummy Page ${handle}`, description: `Description for dummy page ${handle}` },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  } as Page);
}

export async function getPages(): Promise<Page[]> {
  // Example: return Promise.resolve(dummyPages);
  return Promise.resolve([]); // No global dummy pages list for now
}

export async function getProduct(handle: string): Promise<Product | undefined> {
  const product = dummyProducts.find(p => p.handle === handle);
  return Promise.resolve(product);
}

export async function getProductRecommendations(
  productId: string
): Promise<Product[]> {
  console.log('getProductRecommendations called for productId:', productId);
  // Simple recommendation: return up to 2 products that are not the same as productId.
  const recommendedProducts = dummyProducts.filter(p => p.id !== productId).slice(0,2);
  return Promise.resolve(recommendedProducts);
}

export async function getProducts({
  query,
  reverse,
  sortKey
}: {
  query?: string;
  reverse?: boolean;
  sortKey?: string;
}): Promise<Product[]> {
  console.log('getProducts called with:', { query, reverse, sortKey });
  let products = dummyProducts;

  if (query) {
    products = products.filter(p => p.title.toLowerCase().includes(query.toLowerCase()) || p.tags.includes(query));
  }

  if (reverse) {
    products = products.slice().reverse();
  }

  if (sortKey === 'CREATED_AT') {
     products = products.slice().sort((a, b) =>
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  } else if (sortKey === 'PRICE_ASC') {
     products = products.slice().sort((a,b) => parseFloat(a.priceRange.minVariantPrice.amount) - parseFloat(b.priceRange.minVariantPrice.amount));
  } else if (sortKey === 'PRICE_DESC') {
    products = products.slice().sort((a,b) => parseFloat(b.priceRange.minVariantPrice.amount) - parseFloat(a.priceRange.minVariantPrice.amount));
  }
  // Add more sort keys if needed

  return Promise.resolve(products);
}

// This is called from `app/api/revalidate.ts` so providers can control revalidation logic.
export async function revalidate(req: any): Promise<NextResponse> {
  return NextResponse.json({ status: 200, message: 'Revalidation not applicable in BFF mode' });
}

// New function to get all articles
export async function getArticles(): Promise<Article[]> {
  return Promise.resolve(dummyArticles);
}

// New function to get a single article by handle
export async function getArticle(handle: string): Promise<Article | undefined> {
  const article = dummyArticles.find((a) => a.handle === handle);
  return Promise.resolve(article);
}
