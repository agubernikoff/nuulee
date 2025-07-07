// This file contains the loader code we just wrote
export async function loader({request, context}) {
  const url = new URL(request.url);
  const term = url.searchParams.get('q') || '';
  const filters = url.searchParams.getAll('filter').map((x) => JSON.parse(x));
  const sortKey = url.searchParams.get('sortKey') || 'RELEVANCE';
  const reverse = url.searchParams.get('reverse') === 'true';

  let totalColorVariants = 0;
  let hasNextPage = true;
  let endCursor = null;

  while (hasNextPage) {
    const variables = {
      term,
      filters,
      sortKey,
      reverse,
      first: 100,
      after: endCursor,
    };

    const response = await context.storefront.query(SEARCH_QUERY, {variables});
    const products = response?.products?.nodes || [];

    for (const product of products) {
      const colorOption = product.options.find(
        (opt) => opt.name.toLowerCase() === 'color',
      );

      if (colorOption) {
        totalColorVariants += colorOption.optionValues.length;
      }
    }

    hasNextPage = response?.products?.pageInfo?.hasNextPage;
    endCursor = response?.products?.pageInfo?.endCursor;
  }

  return new Response(JSON.stringify({totalColorVariants}), {
    headers: {'Content-Type': 'application/json'},
  });
}

/**
 * Regular search query and fragments
 * (adjust as needed)
 */
const SEARCH_PRODUCT_FRAGMENT = `#graphql
    fragment SearchProduct on Product {
    options(first:30){
        id
        name
        optionValues{
            id
            name
            swatch{
            color
            }
        }
    }
}
`;
const PAGE_INFO_FRAGMENT = `#graphql
    fragment PageInfoFragment on PageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
    }
`;

// NOTE: https://shopify.dev/docs/api/storefront/latest/queries/search
export const SEARCH_QUERY = `#graphql
   query RegularSearch(
     $country: CountryCode
     $endCursor: String
     $first: Int
     $language: LanguageCode
     $last: Int
     $term: String!
     $startCursor: String
     $filters: [ProductFilter!]
     $reverse: Boolean
     $sortKey: SearchSortKeys
   ) @inContext(country: $country, language: $language) {
     products: search(
       after: $endCursor,
       before: $startCursor,
       first: $first,
       last: $last,
       query: $term,
       reverse: $reverse,
       sortKey: $sortKey,
       types: [PRODUCT],
       unavailableProducts: HIDE,
       productFilters: $filters,
       ) {
       nodes {
         ...on Product {
           ...SearchProduct
         }
       }
       pageInfo {
         ...PageInfoFragment
       }
     }
   }
   ${SEARCH_PRODUCT_FRAGMENT}
   ${PAGE_INFO_FRAGMENT}
 `;
