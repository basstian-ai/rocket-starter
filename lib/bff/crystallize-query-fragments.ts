export const BASIC_PRODUCT_FIELDS = `
  id
  name              # plain item name
  path
  variants {
    sku
    isDefault
    priceVariants {
      identifier
      price
    }
    images {         # <-- 'images' is available inside Variant
      url            # (no width/height in this tenant)
    }
  }
  shape { identifier }   # lets us confirm it's "tools-products"
`;
