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
  ProductVariant, // Added ProductVariant
  Article // Added Article type
} from './types';
import { dummyMenu, dummyCart, dummyArticles } from './dummy-data'; // Removed dummyCollections, dummyProducts
import client from 'lib/crystallize/index';

const LANGUAGE = "en"; // Default language for Crystallize API calls

// TODO: THIS PRODUCT_COMMON_QUERY_FIELDS IS INTENTIONALLY MINIMAL TO ENSURE A SUCCESSFUL BUILD.
// IT MUST BE ENHANCED WITH SHAPE-SPECIFIC COMPONENT QUERIES AND OTHER FIELDS
// (REFERENCING starter-kit-catalogue.schema.json AND getToolsProducts AS AN EXAMPLE)
// TO RESTORE FULL PRODUCT DATA FOR THE PDP AND OTHER PRODUCT LISTINGS.
const PRODUCT_COMMON_QUERY_FIELDS = `
  id
  name
  path
  topics { name } # Keep existing topics

  # Attempt to get a product name from a common component pattern
  productNameFromComponent: component(id: "name") { # Assuming a component with id 'name' might hold the primary display name
    content {
      ... on SingleLineContent { text }
    }
  }

  # Attempt to get a featured image from a common component pattern
  productImageFromComponent: component(id: "images") { # Assuming a component with id 'images' might hold product images
    content {
      ... on ImageContent {
        images {
          url
          altText
          variants { width height url }
        }
      }
    }
  }

  # Detailed variant information
  variants {
    id
    sku
    name
    isDefault
    price # Direct price if available
    priceVariants { # Structured price variants
      identifier
      name
      price
      currency
    }
    stock # Direct stock if available
    stockLocations { # Structured stock information
        identifier
        name
        stock
    }
    images { # Images specific to this variant
      url
      altText
      variants { width height url }
    }
    attributes { # Attributes for variant selection (e.g., color, size)
      attribute
      value
    }
  }

  # General components which might contain fallback data or additional details
  # This is a generic way to fetch some component data if the specific ones above don't yield results
  # or if other details are needed by the transformer.
  components {
    id
    name
    type
    content {
      ... on SingleLineContent { text }
      ... on RichTextContent { json plainText } # Fetch multiple formats if available
      ... on ImageContent {
        images {
          url
          altText
          variants { width height url }
        }
      }
      ... on ParagraphCollectionContent {
        paragraphs {
          title { text }
          body { json plainText }
          images {
            url
            altText
            variants { width height url }
          }
        }
      }
      # Add other content types as needed, e.g., BooleanContent, PropertiesTableContent, etc.
    }
  }
`;

// (E.G., FOR DESCRIPTION, DETAILED IMAGES, SEO FIELDS, CUSTOM ATTRIBUTES)
// ONCE THE QUERIES ARE EXPANDED. REFER TO getToolsProducts for component examples.
const transformCrystallizeProduct = (node: any): Product | null => {
  if (!node || (node.__typename && node.__typename !== 'Product' && node.type !== 'product' && !node.name && !node.productNameFromComponent)) {
    return null;
  }

  // 1. Product Title
  const productTitle = node.productNameFromComponent?.content?.text || node.name || 'Untitled Product';

  // 3. Variants
  const transformedVariants = node.variants?.map((variant: any) => {
    const variantTitle = variant.name || productTitle;

    let amount = "0";
    let currencyCode = "USD"; // Default currency

    if (variant.priceVariants && variant.priceVariants.length > 0) {
      const defaultPriceVariant = variant.priceVariants.find((pv: any) => pv.identifier === 'default') || variant.priceVariants[0];
      if (defaultPriceVariant) {
        amount = defaultPriceVariant.price?.toString() || amount;
        currencyCode = defaultPriceVariant.currency || currencyCode;
      }
    } else if (variant.price) {
      amount = variant.price.toString();
      // currencyCode might need to be sourced from a global default or elsewhere if not in priceVariants
    }

    let availableForSale = (variant.stock || 0) > 0;
    if (variant.stockLocations && variant.stockLocations.length > 0) {
        availableForSale = variant.stockLocations.some((loc: any) => (loc.stock || 0) > 0);
    }


    return {
      id: variant.sku || variant.id,
      title: variantTitle,
      availableForSale,
      selectedOptions: variant.attributes?.map((attr: any) => ({
        name: attr.attribute,
        value: attr.value
      })) || [],
      price: { amount, currencyCode }
    };
  }) || [];

  // 4. Price Range
  let minPrice = Infinity;
  let maxPrice = 0;
  let rangeCurrencyCode = transformedVariants[0]?.price.currencyCode || "USD";

  transformedVariants.forEach((v: any) => {
    const price = parseFloat(v.price.amount);
    if (!isNaN(price)) {
      if (price < minPrice) minPrice = price;
      if (price > maxPrice) maxPrice = price;
    }
  });
  if (minPrice === Infinity) minPrice = 0; // Handle cases where no valid price was found


  // 2. Featured Image
  let featuredImageSource: any = null;
  if (node.productImageFromComponent?.content?.images && node.productImageFromComponent.content.images.length > 0) {
    featuredImageSource = node.productImageFromComponent.content.images[0];
  } else {
    const defaultVariant = node.variants?.find((v: any) => v.isDefault);
    if (defaultVariant?.images && defaultVariant.images.length > 0) {
      featuredImageSource = defaultVariant.images[0];
    } else if (node.variants?.[0]?.images && node.variants[0].images.length > 0) {
      featuredImageSource = node.variants[0].images[0];
    } else if (node.components) {
      // Iterate through generic components to find an image
      const imageComponent = node.components.find(
        (c: any) => c.type === 'images' && c.content?.images && c.content.images.length > 0
      );
      if (imageComponent) {
        featuredImageSource = imageComponent.content.images[0];
      }
    }
  }

  let featuredImage: Image = { url: '', altText: 'Placeholder', width: 0, height: 0 };
  if (featuredImageSource) {
    const imageVariant = featuredImageSource.variants?.[0]; // Assuming first variant is representative or default
    featuredImage = {
      url: featuredImageSource.url,
      altText: featuredImageSource.altText || productTitle || 'Product image',
      width: imageVariant?.width || featuredImageSource.width || 0,
      height: imageVariant?.height || featuredImageSource.height || 0
    };
  }

  // Ensure featuredImage has a URL, otherwise use a placeholder
  if (!featuredImage.url) {
    featuredImage.url = '/placeholder.svg'; // Or any other placeholder path
    featuredImage.altText = featuredImage.altText || productTitle || 'Placeholder image';
    featuredImage.width = featuredImage.width || 100; // Default placeholder width
    featuredImage.height = featuredImage.height || 100; // Default placeholder height
  }

  // 5. Images (Gallery)
  const collectedGalleryImages: any[] = [];
  const uniqueImageUrls = new Set<string>();

  const addImageToGallery = (img: any, title: string) => {
    if (img?.url && !uniqueImageUrls.has(img.url)) {
      const imageVariantDetails = img.variants?.[0];
      collectedGalleryImages.push({
        node: {
          url: img.url,
          altText: img.altText || title || 'Product gallery image',
          width: imageVariantDetails?.width || img.width || 0,
          height: imageVariantDetails?.height || img.height || 0,
        }
      });
      uniqueImageUrls.add(img.url);
    }
  };

  // From product.variants.images
  node.variants?.forEach((variant: any) => {
    variant.images?.forEach((img: any) => addImageToGallery(img, variant.name || productTitle));
  });

  // From product.productImageFromComponent (if not already featured and added)
  node.productImageFromComponent?.content?.images?.forEach((img: any) => {
     // Add to gallery even if it's the featured image, if not already present by URL
    addImageToGallery(img, productTitle);
  });

  // From generic components
  node.components?.forEach((component: any) => {
    if (component.type === 'images' && component.content?.images) {
      component.content.images.forEach((img: any) => addImageToGallery(img, component.name || productTitle));
    } else if (component.type === 'paragraphCollection' && component.content?.paragraphs) {
        component.content.paragraphs.forEach((paragraph:any) => {
            paragraph.images?.forEach((img:any) => addImageToGallery(img, paragraph.title?.text || productTitle));
        });
    }
  });

  const imagesForGallery = { edges: collectedGalleryImages };


  // 6. Description
  let description = '';
  let descriptionHtml = '';

  const descriptionComponent = node.components?.find((c: any) => c.id === 'description' || c.name === 'Description' || c.type === 'richText');
  const summaryComponent = node.components?.find((c: any) => c.id === 'summary' || c.name === 'Summary' || c.type === 'plainText' || c.type === 'singleLine');
  const bodyComponent = node.components?.find((c: any) => c.id === 'body' || c.name === 'Body');


  if (descriptionComponent?.content?.json) {
    // Basic JSON to HTML (highly simplified, needs a proper renderer for complex structures)
    descriptionHtml = descriptionComponent.content.json.map((block: any) => {
      if (block.type === 'paragraph') {
        return `<p>${block.children?.map((child: any) => child.text).join('') || ''}</p>`;
      }
      return ''; // Add more block types as needed
    }).join('');
    description = descriptionComponent.content.plainText?.join('\n') || descriptionHtml.replace(/<[^>]*>?/gm, '');
  } else if (descriptionComponent?.content?.plainText) {
    description = descriptionComponent.content.plainText.join('\n');
    descriptionHtml = `<p>${description.replace(/\n/g, '</p><p>')}</p>`;
  } else if (summaryComponent?.content?.text) { // SingleLineContent
    description = summaryComponent.content.text;
    descriptionHtml = `<p>${description}</p>`;
  } else if (summaryComponent?.content?.plainText) { // PlainTextContent
    description = summaryComponent.content.plainText.join('\n');
    descriptionHtml = `<p>${description.replace(/\n/g, '</p><p>')}</p>`;
  } else if (bodyComponent?.content?.json) { // e.g. ParagraphCollection's body
     descriptionHtml = bodyComponent.content.json.map((block: any) => {
      if (block.type === 'paragraph') {
        return `<p>${block.children?.map((child: any) => child.text).join('') || ''}</p>`;
      }
      return '';
    }).join('');
    description = bodyComponent.content.plainText?.join('\n') || descriptionHtml.replace(/<[^>]*>?/gm, '');
  } else if (bodyComponent?.content?.plainText) {
    description = bodyComponent.content.plainText.join('\n');
    descriptionHtml = `<p>${description.replace(/\n/g, '</p><p>')}</p>`;
  }

  if (!description && productTitle) {
      description = `Details for ${productTitle}`; // Fallback description
  }
  if (!descriptionHtml && description) {
      descriptionHtml = `<p>${description.replace(/\n/g, '</p><p>')}</p>`; // Fallback HTML
  }


  // 7. Options
  const productOptions: ProductOption[] = [];
  if (node.variants && node.variants.length > 0) {
    const tempOptionsMap = new Map<string, Set<string>>();
    node.variants.forEach((variant: any) => {
      variant.attributes?.forEach((attr: any) => {
        if (attr.attribute && attr.value) {
          if (!tempOptionsMap.has(attr.attribute)) {
            tempOptionsMap.set(attr.attribute, new Set());
          }
          tempOptionsMap.get(attr.attribute)!.add(attr.value);
        }
      });
    });
    tempOptionsMap.forEach((values, name) => {
      productOptions.push({ id: name, name, values: Array.from(values) });
    });
  }

  // 8. SEO
  const seoTitle = productTitle; // Use product title for SEO title
  const seoDescription = description || `View details for ${productTitle}`; // Use derived description

  // 9. Tags
  const tags = node.topics?.map((topic: any) => topic.name).filter(Boolean) || [];

  return {
    id: node.id,
    handle: node.path,
    availableForSale: transformedVariants.some((v: ProductVariant) => v.availableForSale),
    title: productTitle,
    description,
    descriptionHtml,
    options: productOptions,
    priceRange: {
      minVariantPrice: { amount: minPrice === Infinity ? "0" : minPrice.toString(), currencyCode: rangeCurrencyCode },
      maxVariantPrice: { amount: maxPrice.toString(), currencyCode: rangeCurrencyCode }
    },
    variants: {
      edges: transformedVariants.map((v: ProductVariant) => ({ node: v }))
    },
    featuredImage,
    images: imagesForGallery,
    seo: { title: seoTitle, description: seoDescription },
    tags,
    updatedAt: node.updatedAt || new Date().toISOString(), // Use actual updatedAt if available
  };
};

// Helper function for transforming Crystallize Folder/Topic/Item to Collection
// TODO: This function needs review based on the actual data structure returned by the "starter-kit" tenant.
const transformCrystallizeCollection = (node: any): Collection | null => {
  if (!node || (node.__typename && !['Folder', 'Topic', 'Product'].includes(node.__typename) && node.type !== 'folder' && !node.name) ) {
      return null;
  }

  let description = '';
  // Attempt to get description from a 'summary' or 'description' component if Product is used as Collection
  // This part is highly speculative as 'components' field on Product was problematic
  const summaryComp = node.components?.find((c: any) => c.id === 'summary' || c.name === 'Summary');
  if (summaryComp?.content?.plainText) {
    description = Array.isArray(summaryComp.content.plainText) ? summaryComp.content.plainText.join('\\n') : String(summaryComp.content.plainText);
  } else {
    const descComp = node.components?.find((c: any) => c.id === 'description' || c.name === 'Description');
    if (descComp?.content?.plainText) {
      description = Array.isArray(descComp.content.plainText) ? descComp.content.plainText.join('\\n') : String(descComp.content.plainText);
    }
  }

  const firstProductVariantImage = node.variants?.[0]?.images?.[0]; // If product is used as collection
  const featuredImage: Image | undefined = firstProductVariantImage ? {
    url: firstProductVariantImage.url,
    altText: firstProductVariantImage.altText || node.name,
  } : undefined;

  const seoTitle = node.name || 'Collection';
  const seoDescription = description || node.name || 'Collection description';
  
  const handle = node.path?.split('/').pop() || node.path || '';

  return {
    handle,
    title: node.name,
    description,
    seo: { title: seoTitle, description: seoDescription },
    updatedAt: node.updatedAt || new Date().toISOString(), // Assuming 'updatedAt' might exist on Folder/Topic items
    path: node.path,
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
    
    const query = `
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
            images(first: 1) { url altText }
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
    `;
    const queryStr = query; // query is already a string here
    const variablesObj = { path: collectionPath, language: LANGUAGE };
    // Assuming client.catalogueApi can be called directly like in getCollections
    const response = await client.catalogueApi(queryStr, variablesObj);

    const collectionData = response?.data?.catalogue;
    if (!collectionData) {
      return undefined;
    }
    return transformCrystallizeCollection(collectionData) || undefined; // Ensure null becomes undefined
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
export type CollectionProductOptions = {
  collection: string;                               // f.eks. "jackets" eller "/jackets"
  sortKey?: 'CREATED_AT' | 'PRICE' | 'RELEVANCE' | 'BEST_SELLING';
  reverse?: boolean;
  first?: number;                                   // hvor mange produkter pr kall
};

export async function getCollectionProducts(
  language: string,
  {
    collection,
    sortKey = 'RELEVANCE',
    reverse = false,
    first = 24,
  }: CollectionProductOptions
) {
  // 1) Lag path som alltid starter med "/"
  const path = collection.startsWith('/') ? collection : `/${collection}`;

  // 2) Oversett sortKey → Crystallize OrderBy-felt
  let sortField: 'ITEM_PUBLISHED_AT' | 'PRICE' | 'ITEM_NAME' | 'BEST_SELLING' =
    'ITEM_NAME';

  if (sortKey === 'CREATED_AT') sortField = 'ITEM_PUBLISHED_AT';
  if (sortKey === 'PRICE') sortField = 'PRICE';
  if (sortKey === 'BEST_SELLING') sortField = 'BEST_SELLING';

  const sortDirection = reverse ? 'DESC' : 'ASC';

  // 3) Filter: alle produkter som ligger under collection-pathen
  const filter = {
    type: 'PRODUCT',
    path: { startsWith: path },
  };

  const query = /* GraphQL */ `
    query CollectionProductsSearch(
      $first: Int
      $orderBy: OrderBy # Changed from OrderByInput
      # $filter: SearchFilterInput # TODO: Determine correct filter type for "starter-kit" schema
      $language: String!
    ) {
      search(
        first: $first
        orderBy: $orderBy
        # filter: $filter # TODO: Enable once correct filter type and structure is known
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
  `;

  const variables = {
    first,
    orderBy: { field: sortField, direction: sortDirection },
    filter,
    language,
  };

  // Assuming client.searchApi can be called directly
  const { search } = await client.searchApi(query, variables);

  const edges = search?.edges ?? [];

  // gjenbruk helperen som allerede finnes lenger oppe i filen
  return edges
    .map((e: any) => transformCrystallizeProduct(e.node))
    .filter(Boolean);
}
/**
 * Retrieves all collections.
 * Simulates fetching a list of all product collections (categories) from a real backend.
 * @returns {Promise<Collection[]>} A promise that resolves to an array of collection objects.
 */
export async function getCollections(language: string) {
  const query = `
    query GetCollections($language: String!) {
      catalogue(language: $language, path: "/products") {
        ... on Folder {
          children {
            name
            path
            ... on Folder {
              children {
                name
                path
              }
            }
          }
        }
      }
    }
  `;

  try {
    const response = await client.catalogueApi(query, {
      language
    });

    return response?.catalogue?.children || [];
  } catch (error) {
    console.error('Error fetching collections from Crystallize:', error);
    throw new Error('Failed to fetch collections.');
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
    const query = `
      query GET_PRODUCT_BY_HANDLE ($path: String!, $language: String!) {
        catalogue(path: $path, language: $language) {
          ... on Product {
            ${PRODUCT_COMMON_QUERY_FIELDS}
          }
        }
      }
    `;
    const queryStr = query; 
    const variablesObj = { path: handle, language: LANGUAGE };
    // Assuming client.catalogueApi can be called directly
    const catalogueResponse = await client.catalogueApi(queryStr, variablesObj);

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
    const currentProductQuery = `
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
    `;
    const currentProductVariables = { itemId: productId, language: LANGUAGE };
    // Assuming client.catalogueApi can be called directly
    const currentProductResponse = await client.catalogueApi(currentProductQuery, currentProductVariables);
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
    const recommendationsQuery = `
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
    `;
    const recommendationsVariables = {
      first: recommendationLimit, // Fetch a bit more to allow filtering out the original product
      filter: recommendationFilter,
      language: LANGUAGE,
    };
    // Assuming client.searchApi can be called directly
    const recommendationsResponse = await client.searchApi(recommendationsQuery, recommendationsVariables);
    const recommendedNodes = recommendationsResponse?.data?.search?.edges || [];

    // Step 4: Transform and filter
    const transformedRecommendations = recommendedNodes
      .map((edge: any) => transformCrystallizeProduct(edge.node))
      .filter((p: Product | null) => p !== null && p.id !== productId) as Product[]; // Exclude nulls and the original product

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
  sortKey,
  language
}: {
  query?: string;
  reverse?: boolean;
  sortKey?: string;
  language?: string;
}): Promise<Product[]> {
  const itemsPerCall = 25;
  const resolvedLanguage = language || LANGUAGE; // Use provided language or fallback to module default

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
    // Note: Input types like OrderByInput and SearchFilterInput are assumed to be defined in Crystallize's schema.
    // If they are not, the $orderBy and $filter variable definitions might need to be 'JSON' or 'String' if they are passed as stringified JSON.
    // However, the `filter` object itself is passed, so the type for $filter should match its structure.
    const gqlQuery = `
      query GetProductsSearch(
        $first: Int, 
      $orderBy: OrderBy, # Changed from OrderByInput
      # $filter: SearchFilterInput, # TODO: Determine correct filter type for "starter-kit" schema
        $language: String
      ) {
        search(
          first: $first, 
          orderBy: $orderBy, 
        # filter: $filter, # TODO: Enable once correct filter type and structure is known
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
    `;
    const variables = {
      first: itemsPerCall,
      orderBy: { field: sortField, direction: sortDirection },
      filter: filter, // filter is already an object
      language: resolvedLanguage,
    };
    // Assuming client.searchApi can be called directly
    const searchResponse = await client.searchApi(gqlQuery, variables);

    const productsData = searchResponse?.data?.search?.edges || [];
    const transformedProducts = productsData.map((edge: any) => transformCrystallizeProduct(edge.node)).filter((p: Product | null) => p !== null) as Product[];
    
    return transformedProducts;

  } catch (error) {
    console.error("Error fetching products from Crystallize:", error);
    throw new Error("Failed to fetch products from Crystallize.");
  }
}

const DESCENDANT_PRODUCTS_QUERY = /* GraphQL */ `
  query DescendantProducts(
    $language: String!
    $path: String!
  ) {
    catalogue(language: $language, path: $path) { # depth removed here
      __typename
      path
      name
      ... on Product {
        ${PRODUCT_COMMON_QUERY_FIELDS}
        productNameFromComponent: component(id: "product-name") {
          content {
            ... on SingleLineContent { text }
          }
        }
        productImageFromComponent: component(id: "product-image") {
          content {
            ... on ImageContent { images { url altText } }
          }
        }
        components {
          id
          name
          type
          content {
            ... on ImageContent { images { url altText } }
            ... on NumericContent { number }
            ... on SingleLineContent { text }
          }
        }
      }
      children { # Level 1 children (items at Level 2)
        __typename
        path
        name
        ... on Product {
          ${PRODUCT_COMMON_QUERY_FIELDS}
          productNameFromComponent: component(id: "product-name") {
            content {
              ... on SingleLineContent { text }
            }
          }
          productImageFromComponent: component(id: "product-image") {
            content {
              ... on ImageContent { images { url altText } }
            }
          }
          components {
            id
            name
            type
            content {
              ... on ImageContent { images { url altText } }
              ... on NumericContent { number }
              ... on SingleLineContent { text }
            }
          }
        }
        children { # Level 2 children (items at Level 3)
          __typename
          path
          name
          ... on Product {
            ${PRODUCT_COMMON_QUERY_FIELDS}
            productNameFromComponent: component(id: "product-name") {
              content {
                ... on SingleLineContent { text }
              }
            }
            productImageFromComponent: component(id: "product-image") {
              content {
                ... on ImageContent { images { url altText } }
              }
            }
            components {
              id
              name
              type
              content {
                ... on ImageContent { images { url altText } }
                ... on NumericContent { number }
                ... on SingleLineContent { text }
              }
            }
          }
          children { # Level 3 children (items at Level 4)
            __typename
            path
            name
            ... on Product {
              ${PRODUCT_COMMON_QUERY_FIELDS}
              productNameFromComponent: component(id: "product-name") {
                content {
                  ... on SingleLineContent { text }
                }
              }
              productImageFromComponent: component(id: "product-image") {
                content {
                  ... on ImageContent { images { url altText } }
                }
              }
              components {
                id
                name
                type
                content {
                  ... on ImageContent { images { url altText } }
                  ... on NumericContent { number }
                  ... on SingleLineContent { text }
                }
              }
            }
            # No children here to limit depth to 4 actual item levels in this query structure
          }
        }
      }
    }
  }
`;

export async function getSubtreeProducts(
  rootPath: string,
  language: string = 'en',
  limit: number = 5,
  depth: number = 5 // depth parameter is no longer used in the API call
): Promise<Product[]> {
  const response = await client.catalogueApi(DESCENDANT_PRODUCTS_QUERY, {
    language,
    path: rootPath, // Maps rootPath argument to $path in GQL query
  });

  const collect = (node: any, bag: any[] = []): any[] => {
    if (!node) {
      return bag;
    }
    if (node.__typename === 'Product') {
      bag.push(node);
    }
    if (node.children && node.children.length > 0) {
      node.children.forEach((child: any) => collect(child, bag));
    }
    return bag;
  };

  const allProducts = collect(response?.data?.catalogue);
  const limitedProducts = allProducts.slice(0, limit);

  return limitedProducts.map(transformCrystallizeProduct).filter(p => p !== null) as Product[];
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
