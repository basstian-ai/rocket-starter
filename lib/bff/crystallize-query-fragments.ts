export const SIMPLE_PRODUCT_FIELDS = `
  id
  name
  path
  variants {
    sku
    name
    isDefault
    priceVariants {
      identifier
      price
      # currency // Assuming currency might not be consistently available directly here
    }
    images { // Images for the variant
      url
      altText
      # width and height removed due to past validation errors
    }
    attributes { // For product options like color, size
      attribute
      value
    }
    stockLocations { // As per user's data example
       identifier
       stock
    }
    # stock // If you have a simple 'stock' field directly on variants
  }
  # Product-level components, images, metaConnection, and topics have been removed
  # to ensure the GraphQL query passes validation during build.
`;
