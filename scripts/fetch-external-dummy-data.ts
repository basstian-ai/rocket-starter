const fs = require('fs'); 
const path = require('path'); 
// Removed all 'import type' statements to prevent 'export {}' issues with ts-node in CommonJS mode.
// Type safety for BffProduct, BffArticle, etc. will be enforced in lib/bff/dummy-data.ts itself.

// RawProduct, RawPost interfaces, slugify, transformProduct, transformPost, fetchDummyProducts, fetchDummyPosts functions remain the same.

interface RawProduct {
  id: number;
  title: string;
  description: string;
  price: number;
  stock: number;
  brand?: string;
  category?: string;
  thumbnail: string;
  images: string[];
  tags?: string[];
  meta?: {
    createdAt: string;
    updatedAt: string;
    barcode: string;
    qrCode: string;
  };
  [key: string]: any; 
}

interface RawPost {
  id: number;
  title: string;
  body: string;
  tags?: string[];
  userId: number;
  reactions: {
    likes: number;
    dislikes: number;
  };
  views: number;
  [key: string]: any; 
}

function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-');
}

// transformProduct will return an object structurally compatible with BffProduct
function transformProduct(dummyProduct: RawProduct): any { // Return type changed to any for script simplicity
  const featuredImg = { // Structurally BffImage
    url: dummyProduct.thumbnail,
    altText: dummyProduct.title,
    width: 300, 
    height: 300, 
  };

  const productImages = dummyProduct.images.map((imgUrl: string, index: number) => ({ // Structurally BffImage[]
    url: imgUrl,
    altText: `${dummyProduct.title} - image ${index + 1}`,
    width: 600,
    height: 600,
  }));

  const product = { // Assign to 'product' variable
    id: `gid://dummyjson/Product/${dummyProduct.id}`,
    handle: slugify(dummyProduct.title),
    availableForSale: dummyProduct.stock > 0,
    title: dummyProduct.title,
    description: dummyProduct.description,
    descriptionHtml: `<p>${dummyProduct.description}</p>`,
    options: [],
    priceRange: {
      maxVariantPrice: { amount: dummyProduct.price.toString(), currencyCode: 'USD' },
      minVariantPrice: { amount: dummyProduct.price.toString(), currencyCode: 'USD' },
    },
    variants: {
      edges: [
        {
          node: {
            id: `gid://dummyjson/ProductVariant/${dummyProduct.id}-0`,
            title: 'Default',
            availableForSale: dummyProduct.stock > 0,
            selectedOptions: [],
            price: { amount: dummyProduct.price.toString(), currencyCode: 'USD' },
          }
        }
      ]
    },
    featuredImage: featuredImg,
    images: {
      edges: productImages.map(img => ({ node: img }))
    },
    seo: {
      title: dummyProduct.title,
      description: dummyProduct.description,
    },
    tags: dummyProduct.tags || [],
    updatedAt: dummyProduct.meta?.updatedAt || new Date().toISOString(),
    brand: dummyProduct.brand,
    category: dummyProduct.category,
  };

  // Add conditional tags
  if (dummyProduct.id === 1) {
    product.tags.push('hidden-homepage-featured-items');
  }
  if (dummyProduct.id === 2) {
    product.tags.push('hidden-homepage-featured-items');
  }
  if (dummyProduct.id === 3) {
    product.tags.push('hidden-homepage-featured-items');
  }
  if (dummyProduct.id >= 4 && dummyProduct.id <= 8) {
    product.tags.push('hidden-homepage-carousel');
  }

  return product; // Return the 'product' variable
}

// transformPost will return an object structurally compatible with BffArticle
function transformPost(dummyPost: RawPost): any { // Return type changed to any
  return {
    id: `gid://dummyjson/Post/${dummyPost.id}`,
    handle: slugify(dummyPost.title),
    title: dummyPost.title,
    body: dummyPost.body,
    tags: dummyPost.tags || [],
    seo: {
      title: dummyPost.title,
      description: dummyPost.body.substring(0, 150),
    },
    author: { name: `User ${dummyPost.userId}` }, 
    createdAt: new Date().toISOString(), 
    updatedAt: new Date().toISOString(), 
    // featuredImage: { url: `https://via.placeholder.com/400x200.png?text=${slugify(dummyPost.title)}`, altText: dummyPost.title, width: 400, height: 200 },
  };
}

async function fetchDummyProducts(limit: number = 40): Promise<RawProduct[]> {
  try {
    const response = await fetch(`https://dummyjson.com/products?limit=${limit}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data.products || [];
  } catch (error) {
    console.error('Failed to fetch dummy products:', error);
    return [];
  }
}

async function fetchDummyPosts(limit: number = 3): Promise<RawPost[]> {
  try {
    const response = await fetch(`https://dummyjson.com/posts?limit=${limit}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data.posts || [];
  } catch (error) {
    console.error('Failed to fetch dummy posts:', error);
    return [];
  }
}

const hardcodedDummyMenu = [ // Removed BffMenu[] type for script simplicity
  { title: 'Home', path: '/' },
  { title: 'All Products', path: '/search' },
  { title: 'About Us (Dummy)', path: '/about-dummy' }
];

const hardcodedDummyCollections = [ // Removed BffCollection[] type
  {
    handle: 'summer-collection',
    title: 'Summer Collection',
    description: 'Bright and sunny items for summer.',
    path: '/search/summer-collection',
    updatedAt: '{{ISO_DATE_PLACEHOLDER}}', 
    seo: { title: 'Summer Collection', description: 'Our summer items.'},
    featuredImage: { url: 'https://via.placeholder.com/400x300.png?text=Summer+Collection', altText: 'Image for Summer Collection', width: 400, height: 300 }
  },
  {
    handle: 'featured-items',
    title: 'Featured Items',
    description: 'Hand-picked featured items.',
    path: '/search/featured-items',
    updatedAt: '{{ISO_DATE_PLACEHOLDER}}', 
    seo: { title: 'Featured Items', description: 'Check out our featured items.'},
    featuredImage: { url: 'https://via.placeholder.com/400x300.png?text=Featured+Items', altText: 'Image for Featured Items', width: 400, height: 300 }
  },
  {
    handle: '',
    title: 'All',
    description: 'All products',
    seo: {
      title: 'All',
      description: 'All products'
    },
    path: '/search',
    updatedAt: '{{ISO_DATE_PLACEHOLDER}}' 
  }
];

const hardcodedDummyCart = { // Removed BffCart type
  id: 'gid://shopify/Cart/dummy-cart-id',
  checkoutUrl: '#', 
  cost: {
    subtotalAmount: { amount: '0.00', currencyCode: 'USD' },
    totalAmount: { amount: '0.00', currencyCode: 'USD' },
    totalTaxAmount: { amount: '0.00', currencyCode: 'USD' }
  },
  lines: { edges: [] },
  totalQuantity: 0
};

async function main() {
  console.log('Fetching and transforming dummy data...');

  const rawProducts = await fetchDummyProducts();
  const rawPosts = await fetchDummyPosts();

  const transformedProducts = rawProducts.map(transformProduct);
  const transformedPosts = rawPosts.map(transformPost);

  console.log(`Fetched and transformed ${transformedProducts.length} products.`);
  console.log(`Fetched and transformed ${transformedPosts.length} posts.`);
  
  const nowISO = new Date().toISOString();
  const dynamicDummyCollectionsString = JSON.stringify(hardcodedDummyCollections, null, 2)
                                          .replace(/"{{ISO_DATE_PLACEHOLDER}}"/g, `"${nowISO}"`);

  const fileContentString = `// IMPORTANT: This file is generated by scripts/fetch-external-dummy-data.ts
// Do not edit this file manually, as your changes will be overwritten.

import type { Product, Collection, Menu, Article, Cart } from './types';

export const dummyMenu: Menu[] = ${JSON.stringify(hardcodedDummyMenu, null, 2)};

export const dummyCollections: Collection[] = ${dynamicDummyCollectionsString};

export const dummyProducts: Product[] = ${JSON.stringify(transformedProducts, null, 2)};

export const dummyArticles: Article[] = ${JSON.stringify(transformedPosts, null, 2)};

export const dummyCart: Cart = ${JSON.stringify(hardcodedDummyCart, null, 2)};
`;

  const outputPath = path.join(__dirname, '../lib/bff/dummy-data.ts');
  
  try {
    fs.writeFileSync(outputPath, fileContentString.trimStart(), 'utf8');
    console.log(`Successfully updated ${outputPath}`);
  } catch (error) {
    console.error(`Failed to write to ${outputPath}:`, error);
  }
}

main().catch(error => {
  console.error('Error in main execution:', error);
});
// Ensuring no 'export {};' or any other ES module export syntax is present at the end.
// This script is intended to be run as CommonJS.
