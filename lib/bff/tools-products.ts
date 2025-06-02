import { createClient, ClientInterface } from '@crystallize/js-api-client'; // Ensure this matches project's import style

// User-provided GraphQL Query for catalogueSearchApi
const TOOLS_PRODUCTS_QUERY = /* GraphQL */ `
query ToolsProducts(
  $language: String!          # "en", "nb", …
  $limit: Int   = 24          # page size
  $offset: Int  = 0           # 0 = first page, 24 = second page …
) {
  search(
    language:  $language
    limit:     $limit
    offset:    $offset
    orderBy: { field: ITEM_NAME, direction: ASC }

    filter: {
      type: PRODUCT
      cataloguePath:  { startsWith: "/products" }    # ← folder filter
      shapeIdentifiers: ["tools-products"]           # ← shape filter
    }
  ) {
    total                                     # total matching items
    items {                                   # array, not edges
      ... on Product {
        id
        name
        path

        # ---------- Product-story components ----------
        component(id: "product-name") {
          content { ... on SingleLineContent { text } }
        }

        component(id: "product-description") {
          content { ... on RichTextContent { plainText } }
        }

        component(id: "manufacturer") {
          content { ... on SingleLineContent { text } }
        }

        component(id: "product-image") {
          content { ... on ImageContent { images { url altText } } }
        }

        component(id: "instruction-manuals") {
          content { ... on FileContent { files { url title } } }
        }

        component(id: "accessories") {
          content { ... on ItemRelationsContent { items { id name path } } }
        }

        # ---------- Variant-story ----------
        variants {
          isDefault
          name

          component(id: "sku")         { content { ... on SingleLineContent { text } } }
          component(id: "list-price")  { content { ... on NumericContent   { number } } }
          component(id: "stock")       { content { ... on NumericContent   { number } } }
          component(id: "ean-barcode") { content { ... on SingleLineContent { text } } }
          component(id: "variant-image") {
            content { ... on ImageContent { images { url altText } } }
          }
          component(id: "dimensions-specs") {
            content { ... on PropertiesTableContent { sections { key value } } }
          }
        }
      }
    }
  }
}
`;

// Define a more specific options type if needed, or use a generic one
// For now, let's stick to what the user's getToolsProducts expects
export type ToolsProductsOptions = {
  language?: string;
  limit?: number;
  offset?: number;
};

// User-provided Helper Function (adapted for client instantiation and env vars)
export async function getToolsProducts({
  language = 'en',
  limit = 24,
  offset = 0,
}: ToolsProductsOptions = {}) { // Added default for options object
  // Ensure environment variables are checked
  if (!process.env.CRYSTALLIZE_TENANT_IDENTIFIER) {
    throw new Error('CRYSTALLIZE_TENANT_IDENTIFIER environment variable is not set.');
  }
  if (!process.env.CRYSTALLIZE_ACCESS_TOKEN_ID) {
    throw new Error('CRYSTALLIZE_ACCESS_TOKEN_ID environment variable is not set.');
  }
  if (!process.env.CRYSTALLIZE_ACCESS_TOKEN_SECRET) {
    throw new Error('CRYSTALLIZE_ACCESS_TOKEN_SECRET environment variable is not set.');
  }

  const client: ClientInterface = createClient({
    tenantIdentifier: process.env.CRYSTALLIZE_TENANT_IDENTIFIER!,
    accessTokenId: process.env.CRYSTALLIZE_ACCESS_TOKEN_ID,
    accessTokenSecret: process.env.CRYSTALLIZE_ACCESS_TOKEN_SECRET,
  });

  const variables = { language, limit, offset };

  // Using client.catalogueSearchApi as per user's latest example
  // The user noted: "catalogueSearchApi is available in @crystallize/js-api-client@4.x.
  // If you’re on an older SDK that only exposes searchApi, just keep using that."
  // Assuming v4.x for now. If this method doesn't exist, it will fail at runtime/build.
  // Corrected to searchApi based on type error TS2551
  const { search } = await client.searchApi(
    TOOLS_PRODUCTS_QUERY,
    variables,
  );

  return {
    total:  search.total,
    items:  search.items,   // User can map/transform here if they wish
    offset: offset + limit, // For next offset calculation by the caller
  };
}
