export const GET_SINGLE_PRODUCT_QUERY_STRING = `
      query GetSingleProduct(\$language: String!, \$path: String!) {
        catalogue(language: \$language, path: \$path) {
          ... on Product {
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
          }
        }
      }
    `;
