import type { Cart, Product, Menu, Collection } from './types';

export const dummyMenu: Menu[] = [
  { title: 'Home', path: '/' },
  { title: 'All Products', path: '/search' },
  { title: 'About Us (Dummy)', path: '/about-dummy' }
];

export const dummyCollections: Collection[] = [
  {
    handle: 'summer-collection',
    title: 'Summer Collection',
    description: 'Bright and sunny items for summer.',
    path: '/search/summer-collection',
    updatedAt: new Date().toISOString(),
    seo: { title: 'Summer Collection', description: 'Our summer items.'}
  },
  {
    handle: 'featured-items',
    title: 'Featured Items',
    description: 'Hand-picked featured items.',
    path: '/search/featured-items',
    updatedAt: new Date().toISOString(),
    seo: { title: 'Featured Items', description: 'Check out our featured items.'}
  },
  // Add a default "All" collection to match existing behavior if needed
  {
    handle: '',
    title: 'All',
    description: 'All products',
    seo: {
      title: 'All',
      description: 'All products'
    },
    path: '/search',
    updatedAt: new Date().toISOString()
  }
];

export const dummyProducts: Product[] = [
  {
    id: 'gid://shopify/Product/1', // Dummy ID
    handle: 'dummy-product-1',
    availableForSale: true,
    title: 'Dummy Product 1',
    description: 'This is a fantastic dummy product.',
    descriptionHtml: '<p>This is a <strong>fantastic</strong> dummy product.</p>',
    options: [{ id: 'opt1', name: 'Size', values: ['S', 'M', 'L'] }],
    priceRange: {
      maxVariantPrice: { amount: '29.99', currencyCode: 'USD' },
      minVariantPrice: { amount: '19.99', currencyCode: 'USD' }
    },
    variants: { edges: [
      { node: {
        id: 'gid://shopify/ProductVariant/101',
        title: 'S',
        availableForSale: true,
        selectedOptions: [{ name: 'Size', value: 'S' }],
        price: { amount: '19.99', currencyCode: 'USD' }
      }},
      { node: {
        id: 'gid://shopify/ProductVariant/102',
        title: 'M',
        availableForSale: true,
        selectedOptions: [{ name: 'Size', value: 'M' }],
        price: { amount: '24.99', currencyCode: 'USD' }
      }}
    ] }, // Removed extra } here by ensuring variants is a property of the product node.
    featuredImage: { url: 'https://via.placeholder.com/300x300.png?text=Dummy+Product+1', altText: 'Dummy Product 1', width: 300, height: 300 },
    images: { edges: [
      { node: { url: 'https://via.placeholder.com/600x600.png?text=Dummy+Product+1_Image1', altText: 'Dummy Product 1 Image 1', width: 600, height: 600 }},
      { node: { url: 'https://via.placeholder.com/600x600.png?text=Dummy+Product+1_Image2', altText: 'Dummy Product 1 Image 2', width: 600, height: 600 }}
    ] }, // Removed extra } here
    seo: { title: 'Dummy Product 1', description: 'Description for Dummy Product 1' },
    tags: ['dummy', 'featured-items'], // Added featured-items tag
    updatedAt: new Date().toISOString()
  },
  {
    id: 'gid://shopify/Product/2',
    handle: 'dummy-product-2-summer',
    availableForSale: true,
    title: 'Dummy Product 2 (Summer)',
    description: 'Another great dummy product, perfect for summer.',
    descriptionHtml: '<p>Another great dummy product, <em>perfect</em> for summer.</p>',
    options: [{ id: 'opt2', name: 'Color', values: ['Red', 'Blue'] }],
    priceRange: {
      maxVariantPrice: { amount: '45.00', currencyCode: 'USD' },
      minVariantPrice: { amount: '45.00', currencyCode: 'USD' }
    },
    variants: { edges: [
       { node: {
        id: 'gid://shopify/ProductVariant/201',
        title: 'Red',
        availableForSale: true,
        selectedOptions: [{ name: 'Color', value: 'Red' }],
        price: { amount: '45.00', currencyCode: 'USD' }
      }}
    ] }, // Removed extra } here
    featuredImage: { url: 'https://via.placeholder.com/300x300.png?text=Dummy+Product+2', altText: 'Dummy Product 2', width: 300, height: 300 },
    images: { edges: [{ node: { url: 'https://via.placeholder.com/600x600.png?text=Dummy+Product+2_Image1', altText: 'Dummy Product 2 Image 1', width: 600, height: 600 }}] }, // Removed extra } here
    seo: { title: 'Dummy Product 2', description: 'Description for Dummy Product 2' },
    tags: ['dummy', 'summer-collection'],
    updatedAt: new Date().toISOString()
  }
];

export const dummyCart: Cart = {
  id: 'gid://shopify/Cart/dummy-cart-id',
  checkoutUrl: '#', // Using '#' for dummy link
  cost: {
    subtotalAmount: { amount: '0.00', currencyCode: 'USD' },
    totalAmount: { amount: '0.00', currencyCode: 'USD' },
    totalTaxAmount: { amount: '0.00', currencyCode: 'USD' }
  },
  lines: { edges: [] },
  totalQuantity: 0
};
