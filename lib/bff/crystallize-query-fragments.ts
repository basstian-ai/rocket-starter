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
    }
    images {
      url
      altText
    }
    attributes {
      attribute
      value
    }
    stockLocations {
       identifier
       stock
    }
  }
`;
