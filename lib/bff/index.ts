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
  ProductOption, // Added ProductOption for transformCrystallizeProduct
  Article // Added Article type
} from './types';
import { dummyMenu, dummyCollections, dummyProducts, dummyCart, dummyArticles } from './dummy-data'; // Added dummyArticles
import client from 'lib/crystallize/index';

const LANGUAGE = "en"; // Default language for Crystallize API calls

// Common query fields for products, used by getProduct, getProducts, getCollectionProducts
const PRODUCT_COMMON_QUERY_FIELDS = `
  id
  itemId
  name
  path
  updatedAt
  
  components {
    id
    name
    type
    content {
      ... on PlainTextContent { plainText }
      ... on RichTextContent { json html }
    }
  }

  defaultVariant {
    sku
    name
    stockCount
    priceVariants { identifier price currency }
    firstImage { url altText width height }
  }

  variants {
    id
    sku
    name
    stock
    price
    priceVariants { identifier price currency }
    attributes { attribute value }
    images { url altText width height }
  }
  
  images { url altText width height }
  topics { name }
  meta: metaConnection(first: 5) { edges { node { key value } } }
`;

// Helper function to transform Crystallize product data to our Product type
const transformCrystallizeProduct = (node: any): Product | null => {
  if (!node || (node.__typename && node.__typename !== 'Product' && node.type !== 'product' && !node.name)) { // Basic check if it's a product-like item
    return null; 
  }
  const variants = node.variants?.map((variant: any) => ({
    id: variant.sku || variant.id,
    title: variant.name || node.name,
    availableForSale: (variant.stockCount || variant.stock || 0) > 0,
    selectedOptions: variant.attributes?.map((attr: any) => ({
      name: attr.attribute,
      value: attr.value
    })) || [],
    price: {
      amount: variant.priceVariants?.find((p:any) => p.identifier === 'default')?.price?.toString() || variant.price?.toString() || "0",
      currencyCode: variant.priceVariants?.find((p:any) => p.identifier === 'default')?.currency || "USD"
    }
  })) || [];

  let minPrice = Infinity;
  let maxPrice = 0;
  variants.forEach((v: any) => {
    const price = parseFloat(v.price.amount);
    if (price < minPrice) minPrice = price;
    if (price > maxPrice) maxPrice = price;
  });

  const firstImage = node.defaultVariant?.firstImage || node.variants?.[0]?.images?.[0] || node.images?.[0];
  const featuredImage: Image = firstImage ? {
    url: firstImage.url,
    altText: firstImage.altText || node.name,
    width: firstImage.width || 0,
    height: firstImage.height || 0
  } : { url: '', altText: 'Placeholder', width: 100, height: 100 };

  const allImages = node.variants?.flatMap((v: any) => v.images || []) || node.images || [];

  let description = '';
  let descriptionHtml = '';
  const summaryComponent = node.components?.find((c: any) => c.id === 'summary' || c.name === 'Summary' || c.type === 'singleLine');
  if (summaryComponent?.content?.plainText) {
    description = summaryComponent.content.plainText.join('\\n');
  } else if (summaryComponent?.content?.text) { // another common plain text field
    description = summaryComponent.content.text;
  }

  const descriptionComponent = node.components?.find((c: any) => c.id === 'description' || c.name === 'Description' || c.type === 'richText');
  if (descriptionComponent?.content?.json) {
    descriptionHtml = descriptionComponent.content.json.map((block: any) => `<p>${block.children?.map((child:any) => child.text).join('') || ''}</p>`).join('');
    if (!description && descriptionHtml) description = descriptionHtml.replace(/<[^>]*>?/gm, '');
  } else if (descriptionComponent?.content?.html) {
      descriptionHtml = descriptionComponent.content.html.join('\\n');
      if (!description && descriptionHtml) description = descriptionHtml.replace(/<[^>]*>?/gm, '');
  } else if (descriptionComponent?.content?.plainText) { // Fallback if rich text is actually plain
      descriptionHtml = `<p>${descriptionComponent.content.plainText.join('\\n')}</p>`;
      if (!description) description = descriptionComponent.content.plainText.join('\\n');
  }
  if (!descriptionHtml && description) descriptionHtml = `<p>${description}</p>`;
  
  const optionsMap = new Map<string, Set<string>>();
  variants.forEach((variant: any) => {
    variant.selectedOptions.forEach((opt: any) => {
      if (!optionsMap.has(opt.name)) {
        optionsMap.set(opt.name, new Set());
      }
      optionsMap.get(opt.name)!.add(opt.value);
    });
  });
  const productOptions: ProductOption[] = Array.from(optionsMap.entries()).map(([name, valuesSet], index) => ({
    id: `${node.id || node.itemId}-opt-${index}`,
    name,
    values: Array.from(valuesSet)
  }));

  const metaSeo = node.meta?.edges?.reduce((acc:any, edge:any) => {
    acc[edge.node.key] = edge.node.value;
    return acc;
  }, {}) || {};
  const seoTitle = metaSeo.title || node.name;
  const seoDescription = metaSeo.description || description || node.name;

  return {
    id: node.id || node.itemId,
    handle: node.path, // Assuming path is the full path, handle might need stripping /
    availableForSale: variants.some((v: any) => v.availableForSale),
    title: node.name,
    description,
    descriptionHtml,
    options: productOptions,
    priceRange: {
      minVariantPrice: { amount: minPrice === Infinity ? "0" : minPrice.toString(), currencyCode: variants[0]?.price.currencyCode || "USD" },
      maxVariantPrice: { amount: maxPrice.toString(), currencyCode: variants[0]?.price.currencyCode || "USD" }
    },
    variants: {
      edges: variants.map((v: any) => ({ node: v }))
    },
    featuredImage,
    images: {
      edges: allImages.map((img: any) => ({ node: { url: img.url, altText: img.altText || node.name, width: img.width || 0, height: img.height || 0 } }))
    },
    seo: { title: seoTitle, description: seoDescription },
    tags: node.topics?.map((topic: any) => topic.name) || [],
    updatedAt: node.updatedAt || new Date().toISOString(),
  };
};

// Helper function for transforming Crystallize Folder/Topic/Item to Collection
const transformCrystallizeCollection = (node: any): Collection | null => {
  if (!node || (node.__typename && !['Folder', 'Topic', 'Product'].includes(node.__typename) && node.type !== 'folder' && !node.name) ) { // Basic check
      return null;
  }

  let description = '';
  const summaryComponent = node.components?.find((c: any) => c.id === 'summary' || c.name === 'Summary' || c.type === 'singleLine');
   if (summaryComponent?.content?.plainText) {
    description = summaryComponent.content.plainText.join('\\n');
  } else if (summaryComponent?.content?.text) {
    description = summaryComponent.content.text;
  } else { // Fallback to a generic description component if summary is not found
    const genericDescComp = node.components?.find((c:any) => c.name === 'Description' || c.id === 'description');
    if (genericDescComp?.content?.plainText) {
        description = genericDescComp.content.plainText.join('\\n');
    } else if (genericDescComp?.content?.json) { // Basic plain text extraction from rich text
        description = genericDescComp.content.json.map((b:any) => b.children?.map((c:any) => c.text).join('')).join(' ');
    }
  }


  const firstImage = node.images?.[0] || node.defaultVariant?.firstImage; // Use case for product as collection
  const featuredImage: Image | undefined = firstImage ? {
    url: firstImage.url,
    altText: firstImage.altText || node.name,
    width: firstImage.width || 0,
    height: firstImage.height || 0
  } : undefined;

  const metaSeo = node.meta?.edges?.reduce((acc:any, edge:any) => {
    acc[edge.node.key] = edge.node.value;
    return acc;
  }, {}) || {};
  const seoTitle = metaSeo.title || node.name;
  const seoDescription = metaSeo.description || description || node.name;
  
  // Handle is the last part of the path
  const handle = node.path?.split('/').pop() || node.path || '';

  return {
    handle,
    title: node.name,
    description,
    seo: { title: seoTitle, description: seoDescription },
    updatedAt: node.updatedAt || new Date().toISOString(),
    path: node.path, // Full path
    featuredImage
  };
};


/**
 * Creates a new cart.
 * Simulates creating a cart in a real backend.
 * @returns {Promise<Cart>} A promise that resolves to the created cart object.
 */
export async function createCart(): Promise<Cart> {
  return Promise.resolve(dummyCart);
}

/**
 * Adds items to an existing cart.
 * Simulates adding items to a cart in a real backend.
 * @param {object[]} lines - An array of line items to add. Each object should have merchandiseId and quantity.
 * @param {string} lines[].merchandiseId - The ID of the product variant.
 * @param {number} lines[].quantity - The quantity of the item to add.
 * @returns {Promise<Cart>} A promise that resolves to the updated cart object.
 */
export async function addToCart(
  lines: { merchandiseId: string; quantity: number }[]
): Promise<Cart> {
  console.log('addToCart called with lines:', lines);
  return Promise.resolve(dummyCart);
}

/**
 * Removes items from an existing cart.
 * Simulates removing items from a cart in a real backend.
 * @param {string[]} lineIds - An array of line item IDs to remove.
 * @returns {Promise<Cart>} A promise that resolves to the updated cart object.
 */
export async function removeFromCart(lineIds: string[]): Promise<Cart> {
  console.log('removeFromCart called with lineIds:', lineIds);
  return Promise.resolve(dummyCart);
}

/**
 * Updates items in an existing cart.
 * Simulates updating items (e.g., quantity) in a cart in a real backend.
 * @param {object[]} lines - An array of line items to update. Each object should have id, merchandiseId, and quantity.
 * @param {string} lines[].id - The ID of the line item to update.
 * @param {string} lines[].merchandiseId - The ID of the product variant (often used for cart line identification).
 * @param {number} lines[].quantity - The new quantity for the line item.
 * @returns {Promise<Cart>} A promise that resolves to the updated cart object.
 */
export async function updateCart(
  lines: { id: string; merchandiseId: string; quantity: number }[]
): Promise<Cart> {
  console.log('updateCart called with lines:', lines);
  return Promise.resolve(dummyCart);
}

/**
 * Retrieves the current cart.
 * Simulates fetching the current user's cart from a real backend.
 * @returns {Promise<Cart | undefined>} A promise that resolves to the cart object, or undefined if no cart exists.
 */
export async function getCart(): Promise<Cart | undefined> {
  return Promise.resolve(dummyCart);
}

/**
 * Retrieves a specific collection by its handle.
 * Simulates fetching a collection (e.g., a category of products) from a real backend.
 * @param {string} handle - The handle (slug) of the collection to retrieve.
 * @returns {Promise<Collection | undefined>} A promise that resolves to the collection object, or undefined if not found.
 */
export async function getCollection(
  handle: string
): Promise<Collection | undefined> {
  try {
    const collectionPath = handle.startsWith('/') ? handle : `/${handle}`; // Ensure path starts with /
    
    const response = await client.catalogueApi.call({
      query: `
        query GET_COLLECTION_BY_PATH($path: String!, $language: String!) {
          catalogue(path: $path, language: $language) {
            # Could be a Folder, Topic, or even a Product used as a category
            ... on Item { # Generic Item fields
              id
              name
              path
              updatedAt
              components {
                id
                name
                type
                content {
                  ... on SingleLineContent { text }
                  ... on PlainTextContent { plainText }
                  ... on RichTextContent { json }
                }
              }
              images(first: 1) { url altText width height }
              meta: metaConnection(first: 5) { edges { node { key value } } }
            }
            # Specific types if you want to query differently based on type
             ... on Product { # If a product can be a collection
              ${PRODUCT_COMMON_QUERY_FIELDS}
            }
            ... on Folder {
              children(first: 0) { totalCount } # Example: check if folder has children
            }
          }
        }
      `,
      variables: { path: collectionPath, language: LANGUAGE }
    });

    const collectionData = response?.data?.catalogue;
    if (!collectionData) {
      return undefined;
    }
    return transformCrystallizeCollection(collectionData);
  } catch (error) {
    console.error(`Error fetching collection (handle: ${handle}) from Crystallize:`, error);
    throw new Error(`Failed to fetch collection: ${handle}.`);
  }
}

/**
 * Retrieves products belonging to a specific collection.
 * Simulates fetching products filtered by a collection from a real backend.
 * @param {object} params - Parameters for fetching collection products.
 * @param {string} params.collection - The handle of the collection.
 * @param {boolean} [params.reverse] - Whether to reverse the order of products.
 * @param {string} [params.sortKey] - The key to sort products by (e.g., 'CREATED_AT', 'PRICE_ASC').
 * @returns {Promise<Product[]>} A promise that resolves to an array of product objects.
 */
export async function getCollectionProducts({
  collection,
  reverse,
  sortKey
}: {
  collection: collectionHandle,
  reverse,
  sortKey
}: {
  collection: string;
  reverse?: boolean;
  sortKey?: string;
}): Promise<Product[]> {
  const itemsPerCall = 25; // Consistent with getProducts

  let sortField = "ITEM_NAME";
  if (sortKey === 'CREATED_AT') {
    sortField = "ITEM_PUBLISHED_AT";
  } else if (sortKey === 'PRICE_ASC' || sortKey === 'PRICE_DESC') {
    sortField = "PRICE";
  }
  const sortDirection = reverse ? "DESC" : "ASC";

  // Strategy: Filter products by path (if collection is a folder) or by topic
  // This assumes collectionHandle is the slug part of the path or a topic name.
  const collectionPathFilter = `/${collectionHandle}`; // e.g. /my-collection

  const filter: any = {
    type: "PRODUCT",
    // Option 1: Filter by items being children of the collection path.
    // This requires `path` to be a searchable attribute or using specific folder queries.
    // Example: { path: { startsWith: collectionPathFilter } } - if SearchAPI supports this
    // Option 2: Filter by topic name. Assumes a topic is named identical to collectionHandle.
    // Example: { topics: { name: [collectionHandle] } }
    // For this implementation, let's try to use a product search that filters by a common ancestor path.
    // This is a common pattern if collections are folders.
    // A more robust way might be needed depending on exact Crystallize setup (e.g., specific API for folder children).
    // We can also use `searchTerm` combined with a specific folder structure, or filter by a "category" attribute on products.
    // For now, we'll use a general search and assume products might be tagged or have a path.
    // A common approach is to fetch products under a specific folder path.
    // The Search API might need specific input for this.
    // Let's assume for now that products directly under a collection path can be fetched by filtering path.
    // This is a simplification; a real scenario might involve fetching a folder by path, then its children.
    // Or using a specific filter like `ancestors: "/path/to/collection"` if available.
    // We'll use a `searchTerm` combined with a `pathPrefix` if that were a feature, or rely on topics.
    // For simplicity, let's try filtering by topic.
    // If that's not how collections are linked, this will need adjustment.
    // Alternative: Fetch the collection item first, then see if it has product children or associated products.
    // Given the constraints, we'll attempt a search filter by topic.
    or: [
      { path: { startsWith: collectionPathFilter } }, // If products are directly under the collection path
      { topics: { name: [collectionHandle] } }        // If products are tagged with the collection name
    ]
  };
  
  try {
    const searchResponse = await client.searchApi.call({
      query: `
        query GET_COLLECTION_PRODUCTS(
          $first: Int, 
          $orderBy: OrderByInput, 
          $filter: SearchFilterInput,
          $language: String
        ) {
          search(
            first: $first, 
            orderBy: $orderBy, 
            filter: $filter,
            language: $language
          ) {
            edges {
              node {
                ... on Product {
                  ${PRODUCT_COMMON_QUERY_FIELDS}
                }
              }
            }
          }
        }
      `,
      variables: {
        first: itemsPerCall,
        orderBy: { field: sortField, direction: sortDirection },
        filter: filter,
        language: LANGUAGE,
      }
    });

    const productsData = searchResponse?.data?.search?.edges || [];
    // Filter out nulls in case some nodes were not products
    const transformedProducts = productsData.map((edge: any) => transformCrystallizeProduct(edge.node)).filter(p => p !== null) as Product[];
    
    return transformedProducts;

  } catch (error) {
    console.error(`Error fetching products for collection ${collectionHandle} from Crystallize:`, error);
    throw new Error(`Failed to fetch products for collection ${collectionHandle}.`);
  }
}

/**
 * Retrieves all collections.
 * Simulates fetching a list of all product collections (categories) from a real backend.
 * @returns {Promise<Collection[]>} A promise that resolves to an array of collection objects.
 */
export async function getCollections(): Promise<Collection[]> {
  try {
    // This query assumes collections are represented by top-level folders or items of a specific shape.
    // It might need adjustment based on actual Crystallize structure.
    // Example: Fetching children of a root "collections" folder, or items with a "collection" shape.
    // For this example, let's assume we fetch items under a known root path like '/collections'
    // Or, fetch all items of a specific shape if your collections have one.
    // This is a simplified query for fetching root level items / children of a root node.
    const response = await client.catalogueApi.call({
      query: `
        query GET_ALL_COLLECTIONS($language: String!) {
          # Option 1: Children of a root catalogue item (e.g. a "Collections" folder)
          # catalogue(path: "/collections", language: $language) {
          #   ... on Folder {
          #     children(first: 50) { # Adjust count as needed
          #       edges { node { ...CollectionFields }}
          #     }
          #   }
          # }
          # Option 2: Search for items of a specific shape or type (if collections have a dedicated shape)
          search(
            first: 50, # Adjust as needed
            filter: { type: FOLDER }, # Or SHAPE, with shapeIdentifier: "my-collection-shape"
            language: $language
          ) {
            edges {
              node {
                # Common fields for a collection-like item
                ... on Folder { # Or whatever type your collections are
                    id
                    name
                    path
                    updatedAt
                    components { id name type content { ... on SingleLineContent { text } ... on PlainTextContent { plainText } } }
                    images(first: 1) { url altText width height }
                    meta: metaConnection(first: 5) { edges { node { key value } } }
                }
              }
            }
          }
        }
        # Fragment for CollectionFields if using Option 1 to avoid repetition (not used in current Option 2)
        # fragment CollectionFields on Item {
        #   id
        #   name
        #   path
        #   updatedAt
        #   components { id name type content { ... on SingleLineContent { text } ... on PlainTextContent { plainText } } }
        #   images(first: 1) { url altText width height }
        #   meta: metaConnection(first: 5) { edges { node { key value } } }
        # }
      `,
      variables: { language: LANGUAGE }
    });

    // Processing based on search (Option 2)
    const collectionsData = response?.data?.search?.edges || [];
    const transformedCollections = collectionsData
      .map((edge: any) => transformCrystallizeCollection(edge.node))
      .filter(c => c !== null) as Collection[]; // Filter out nulls if some nodes are not transformable

    return transformedCollections;

  } catch (error) {
    console.error("Error fetching collections from Crystallize:", error);
    throw new Error("Failed to fetch collections.");
  }
}

/**
 * Retrieves menu items for a given handle.
 * Simulates fetching navigation menu items from a real backend.
 * @param {string} handle - The handle of the menu to retrieve (e.g., 'main-menu', 'footer-menu').
 * @returns {Promise<Menu[]>} A promise that resolves to an array of menu item objects.
 */
export async function getMenu(handle: string): Promise<Menu[]> {
  console.log('getMenu called with handle:', handle);
  // Assuming dummyMenu is an array of all menu items.
  // If `handle` is meant to fetch a specific menu, logic would go here.
  // For now, returning the whole dummyMenu.
  return Promise.resolve(dummyMenu);
}

/**
 * Retrieves a specific page by its handle.
 * Simulates fetching a static page (e.g., 'about-us', 'contact') from a real backend.
 * @param {string} handle - The handle (slug) of the page to retrieve.
 * @returns {Promise<Page>} A promise that resolves to the page object.
 */
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

/**
 * Retrieves all pages.
 * Simulates fetching a list of all static pages from a real backend.
 * @returns {Promise<Page[]>} A promise that resolves to an array of page objects.
 */
export async function getPages(): Promise<Page[]> {
  // Example: return Promise.resolve(dummyPages);
  return Promise.resolve([]); // No global dummy pages list for now
}

/**
 * Retrieves a specific product by its handle.
 * Simulates fetching a single product's details from a real backend.
 * @param {string} handle - The handle (slug) of the product to retrieve.
 * @returns {Promise<Product | undefined>} A promise that resolves to the product object, or undefined if not found.
 */
export async function getProduct(handle: string): Promise<Product | undefined> {
  // Helper function to transform Crystallize product data to our Product type
  // This function is designed to work with data from both catalogueApi and searchApi
  const transformCrystallizeProduct = (node: any): Product => {
    const variants = node.variants?.map((variant: any) => ({
      id: variant.sku || variant.id, // Use SKU as ID, fallback to variant ID
      title: variant.name || node.name, // Variant name, fallback to product name
      availableForSale: (variant.stockCount || variant.stock || 0) > 0,
      selectedOptions: variant.attributes?.map((attr: any) => ({
        name: attr.attribute,
        value: attr.value
      })) || [],
      price: {
        amount: variant.priceVariants?.find((p:any) => p.identifier === 'default')?.price?.toString() || variant.price?.toString() || "0", // Ensure amount is string
        currencyCode: variant.priceVariants?.find((p:any) => p.identifier === 'default')?.currency || "USD" // Default currency
      }
    })) || [];

    let minPrice = Infinity;
    let maxPrice = 0;
    variants.forEach((v: any) => {
      const price = parseFloat(v.price.amount);
      if (price < minPrice) minPrice = price;
      if (price > maxPrice) maxPrice = price;
    });

    const firstImage = node.defaultVariant?.firstImage || node.variants?.[0]?.images?.[0] || node.images?.[0];
    const featuredImage: Image = firstImage ? {
      url: firstImage.url,
      altText: firstImage.altText || node.name,
      width: firstImage.width || 0,
      height: firstImage.height || 0
    } : { url: '', altText: 'Placeholder', width: 100, height: 100 }; // Fallback image

    const allImages = node.variants?.flatMap((v: any) => v.images || []) || node.images || [];

    // Extract description and descriptionHtml from components
    // This assumes 'summary' (PlainText) and 'description' (RichText) components
    let description = '';
    let descriptionHtml = '';
    const summaryComponent = node.components?.find((c: any) => c.id === 'summary' || c.name === 'Summary');
    if (summaryComponent?.content?.plainText) {
      description = summaryComponent.content.plainText.join('\\n');
    }
    const descriptionComponent = node.components?.find((c: any) => c.id === 'description' || c.name === 'Description');
    if (descriptionComponent?.content?.json) { // Assuming rich text is in JSON format
      // Basic transformation for rich text JSON to HTML (very simplified)
      descriptionHtml = descriptionComponent.content.json.map((block: any) => `<p>${block.children?.map((child:any) => child.text).join('') || ''}</p>`).join('');
      if (!description && descriptionHtml) description = descriptionHtml.replace(/<[^>]*>?/gm, ''); // Fallback for plain description
    } else if (descriptionComponent?.content?.html) { // If HTML is directly available
        descriptionHtml = descriptionComponent.content.html.join('\\n');
        if (!description && descriptionHtml) description = descriptionHtml.replace(/<[^>]*>?/gm, '');
    }
     if (!descriptionHtml && description) descriptionHtml = `<p>${description}</p>`; // Fallback for HTML desc


    // Product Options (deriving from variant attributes)
    const optionsMap = new Map<string, Set<string>>();
    variants.forEach((variant: any) => {
      variant.selectedOptions.forEach((opt: any) => {
        if (!optionsMap.has(opt.name)) {
          optionsMap.set(opt.name, new Set());
        }
        optionsMap.get(opt.name)!.add(opt.value);
      });
    });
    const productOptions: ProductOption[] = Array.from(optionsMap.entries()).map(([name, valuesSet], index) => ({
      id: `${node.id}-opt-${index}`, // Generate a unique ID for option
      name,
      values: Array.from(valuesSet)
    }));

    const seoTitle = node.meta?.find((m:any) => m.key === 'title')?.value || node.name;
    const seoDescription = node.meta?.find((m:any) => m.key === 'description')?.value || description || node.name;

    return {
      id: node.id || node.itemId,
      handle: node.path,
      availableForSale: variants.some((v: any) => v.availableForSale),
      title: node.name,
      description,
      descriptionHtml,
      options: productOptions,
      priceRange: {
        minVariantPrice: { amount: minPrice === Infinity ? "0" : minPrice.toString(), currencyCode: variants[0]?.price.currencyCode || "USD" },
        maxVariantPrice: { amount: maxPrice.toString(), currencyCode: variants[0]?.price.currencyCode || "USD" }
      },
      variants: {
        edges: variants.map((v: any) => ({ node: v }))
      },
      featuredImage,
      images: {
        edges: allImages.map((img: any) => ({ node: { url: img.url, altText: img.altText || node.name, width: img.width || 0, height: img.height || 0 } }))
      },
      seo: {
        title: seoTitle,
        description: seoDescription,
      },
      tags: node.topics?.map((topic: any) => topic.name) || [],
      updatedAt: node.updatedAt || new Date().toISOString(),
      // brand: node.components?.find((c: any) => c.id === 'brand')?.content?.text, // Example: if brand is a simple text component
      // category: node.topics?.find((t:any) => t.isCategory)?.name, // Example: if a topic can be marked as category
    };
  };

  try {
    const catalogueResponse = await client.catalogueApi.call({
      query: `
        query GET_PRODUCT_BY_HANDLE ($path: String!, $language: String!) {
          catalogue(path: $path, language: $language) {
            ... on Product {
              ${PRODUCT_COMMON_QUERY_FIELDS}
            }
          }
        }
      `,
      variables: { path: handle, language: LANGUAGE }
    });

    const productData = catalogueResponse?.data?.catalogue;

    if (!productData ) { 
      return undefined;
    }
    return transformCrystallizeProduct(productData);

  } catch (error) {
    console.error(`Error fetching product (handle: ${handle}) from Crystallize:`, error);
    throw new Error(`Failed to fetch product (handle: ${handle}) from Crystallize.`);
  }
}

/**
 * Retrieves product recommendations for a given product ID.
 * Simulates fetching recommended or related products from a real backend.
 * @param {string} productId - The ID of the product to get recommendations for.
 * @returns {Promise<Product[]>} A promise that resolves to an array of recommended product objects.
 */
export async function getProductRecommendations(
  productId: string
): Promise<Product[]> {
  const recommendationLimit = 5; // Number of recommendations to fetch + 1 (for original product)
  const actualRecommendationsCount = recommendationLimit -1; // Max 4 actual recommendations

  try {
    // Step 1: Fetch the current product to get its context (topics or path)
    // We need to use Catalogue API here as product ID is an item ID, not a path/handle
    // However, the current getProduct function takes a handle (path).
    // So, we'll construct a direct item query.
    const currentProductResponse = await client.catalogueApi.call({
      query: `
        query GET_PRODUCT_DETAILS_FOR_RECOS($itemId: ID!, $language: String!) {
          product: item(id: $itemId, language: $language) {
            ... on Product {
              id
              name
              path
              topics { name path } # Fetch topics for recommendation strategy
              # parentId: parent { id } # Could fetch parent folder ID if needed
            }
          }
        }
      `,
      variables: { itemId: productId, language: LANGUAGE }
    });

    const currentProductData = currentProductResponse?.data?.product;

    if (!currentProductData) {
      console.warn(`Product recommendations: Original product with ID ${productId} not found.`);
      return [];
    }

    // Step 2: Construct a filter for related products
    let recommendationFilter: any = {
      type: "PRODUCT",
      // Exclude the original product by its ID (itemId)
      // Assuming Search API supports filtering out specific itemIds.
      // This might need to be `n_itemIds: [productId]` or similar depending on exact API spec.
      // For now, we'll filter it out manually after fetching if direct exclusion isn't straightforward.
    };

    const orConditions = [];

    // Strategy: Use topics first, then fallback to parent path (sibling products)
    if (currentProductData.topics && currentProductData.topics.length > 0) {
      const topicNames = currentProductData.topics.map((t: any) => t.name);
      // Search for products that share any of these topics
      orConditions.push({ topics: { name: topicNames } });
    } else if (currentProductData.path) {
      // Fallback: try to get products from the same parent folder
      const pathSegments = currentProductData.path.split('/');
      if (pathSegments.length > 2) { // e.g. /folder/product, needs at least /folder
        const parentPath = pathSegments.slice(0, -1).join('/');
        orConditions.push({ path: { startsWith: parentPath } });
      }
    }
    
    if (orConditions.length > 0) {
      recommendationFilter.or = orConditions;
    } else {
      // If no topics and no valid parent path, fetch any other products (very basic fallback)
      // This will just fetch some random products, excluding the current one later.
    }
    
    // Step 3: Fetch related products
    const recommendationsResponse = await client.searchApi.call({
      query: `
        query GET_RECOMMENDED_PRODUCTS(
          $first: Int, 
          $filter: SearchFilterInput,
          $language: String
        ) {
          search(
            first: $first, 
            filter: $filter,
            language: $language
            # orderBy: {isRandom: true} # If API supports random sort for variety
          ) {
            edges {
              node {
                ... on Product {
                  ${PRODUCT_COMMON_QUERY_FIELDS}
                }
              }
            }
          }
        }
      `,
      variables: {
        first: recommendationLimit, // Fetch a bit more to allow filtering out the original product
        filter: recommendationFilter,
        language: LANGUAGE,
      }
    });

    const recommendedNodes = recommendationsResponse?.data?.search?.edges || [];

    // Step 4: Transform and filter
    const transformedRecommendations = recommendedNodes
      .map((edge: any) => transformCrystallizeProduct(edge.node))
      .filter(p => p !== null && p.id !== productId) as Product[]; // Exclude nulls and the original product

    return transformedRecommendations.slice(0, actualRecommendationsCount);

  } catch (error) {
    console.error(`Error fetching product recommendations for productId ${productId}:`, error);
    return []; // Return empty array on error
  }
}

/**
 * Retrieves a list of products, optionally filtered by a query and sorted.
 * Simulates fetching a list of products, like for a search results page, from a real backend.
 * @param {object} params - Parameters for fetching products.
 * @param {string} [params.query] - A search query to filter products by (e.g., product title, tag).
 * @param {boolean} [params.reverse] - Whether to reverse the order of products.
 * @param {string} [params.sortKey] - The key to sort products by (e.g., 'CREATED_AT', 'PRICE_ASC').
 * @returns {Promise<Product[]>} A promise that resolves to an array of product objects.
 */
export async function getProducts({
  query,
  reverse,
  sortKey
}: {
  query?: string;
  query?: string;
  reverse?: boolean;
  sortKey?: string;
}): Promise<Product[]> {
  const itemsPerCall = 25;

  let sortField = "ITEM_NAME"; 
  if (sortKey === 'CREATED_AT') {
    sortField = "ITEM_PUBLISHED_AT"; 
  } else if (sortKey === 'PRICE_ASC' || sortKey === 'PRICE_DESC') {
    sortField = "PRICE"; 
  }
  const sortDirection = reverse ? "DESC" : "ASC";
  
  const filter: any = {
    type: "PRODUCT",
  };
  if (query) {
    filter.searchTerm = query; 
  }

  try {
    const searchResponse = await client.searchApi.call({ 
      query: `
        query GET_PRODUCTS_SEARCH(
          $first: Int, 
          $orderBy: OrderByInput, 
          $filter: SearchFilterInput,
          $language: String
        ) {
          search(
            first: $first, 
            orderBy: $orderBy, 
            filter: $filter,
            language: $language
          ) {
            edges {
              node {
                ... on Product { 
                  ${PRODUCT_COMMON_QUERY_FIELDS}
                }
              }
            }
          }
        }
      `,
      variables: {
        first: itemsPerCall,
        orderBy: { field: sortField, direction: sortDirection },
        filter: filter,
        language: LANGUAGE,
      }
    });

    const productsData = searchResponse?.data?.search?.edges || [];
    const transformedProducts = productsData.map((edge: any) => transformCrystallizeProduct(edge.node)).filter(p => p !== null) as Product[];
    
    return transformedProducts;

  } catch (error) {
    console.error("Error fetching products from Crystallize:", error);
    throw new Error("Failed to fetch products from Crystallize.");
  }
}

/**
 * Handles revalidation requests.
 * In a real backend scenario, this might trigger a cache clear or data refresh.
 * For a BFF using dummy data, it typically indicates that revalidation is not applicable.
 * @param {any} req - The request object (can be of any type, as it's often framework-specific).
 * @returns {Promise<NextResponse>} A promise that resolves to a Next.js response object.
 */
// This is called from `app/api/revalidate.ts` so providers can control revalidation logic.
export async function revalidate(req: any): Promise<NextResponse> {
  return NextResponse.json({ status: 200, message: 'Revalidation not applicable in BFF mode' });
}

/**
 * Retrieves all articles.
 * Simulates fetching a list of all articles or blog posts from a real backend.
 * @returns {Promise<Article[]>} A promise that resolves to an array of article objects.
 */
// New function to get all articles
export async function getArticles(): Promise<Article[]> {
  return Promise.resolve(dummyArticles);
}

/**
 * Retrieves a specific article by its handle.
 * Simulates fetching a single article or blog post from a real backend.
 * @param {string} handle - The handle (slug) of the article to retrieve.
 * @returns {Promise<Article | undefined>} A promise that resolves to the article object, or undefined if not found.
 */
// New function to get a single article by handle
export async function getArticle(handle: string): Promise<Article | undefined> {
  const article = dummyArticles.find((a) => a.handle === handle);
  return Promise.resolve(article);
}
