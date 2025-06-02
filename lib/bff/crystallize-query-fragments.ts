export const DETAILED_PRODUCT_FIELDS = `
  id
  name
  path
  # Product-level components (examples, adjust IDs based on your shape)
  components {
    id
    name
    type
    content {
      ... on SingleLineContent { text }
      ... on RichTextContent { json html plainText }
      ... on ImageContent { images { url altText width height } }
      ... on FileContent { files { url title } }
      # Add other component content types as needed
    }
  }
  # SEO related fields (assuming they are top-level or within a 'seo' component)
  # This might be via metaConnection or specific components
  meta: metaConnection(first: 10) { # Or meta(keys: ["title", "description"]) if supported
    edges {
      node {
        key
        value
      }
    }
  }
  # Topics (Categories/Tags)
  topics {
    id
    name
    path
  }
  variants {
    sku
    name
    isDefault
    # Attributes for options (e.g., color, size)
    attributes {
      attribute
      value
    }
    priceVariants {
      identifier
      name
      price
      currency
    }
    images {
      url
      altText
      width # Assuming these might be available now or in future
      height
    }
    # Variant-level components (examples, adjust IDs)
    components {
      id
      name
      type
      content {
        ... on SingleLineContent { text }
        ... on NumericContent { number unit }
        ... on ImageContent { images { url altText width height } }
        # Add other component content types as needed
      }
    }
    stockLocations { # If using stock locations
      identifier
      name
      stock
    }
    # stock # If using simple stock number directly on variant
  }
  # Fallback top-level images if variants don't have them or for a general gallery
  images(first: 10) { # If images are directly on the product item
     url
     altText
     width
     height
  }
`;
