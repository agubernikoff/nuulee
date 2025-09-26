import {Link, useSearchParams} from '@remix-run/react';
import {Image, Money, Pagination} from '@shopify/hydrogen';
import {urlWithTrackingParams} from '~/lib/search';
import {PaginatedResourceSection} from './PaginatedResourceSection';
import ProductGridItem from './ProductGridItem';
import {motion} from 'motion/react';
import {Filter} from '~/routes/($locale).collections.$handle.($tag)';
import {useRef, useEffect} from 'react';
import {ProductColorVariants} from '~/routes/($locale).collections.$handle.($tag)';

/**
 * @param {Omit<SearchResultsProps, 'error' | 'type'>}
 */
export function SearchResults({term, result, children}) {
  if (!result?.total) {
    return null;
  }

  return children({...result.items, term});
}

SearchResults.Products = SearchResultsProducts;
SearchResults.Empty = SearchResultsEmpty;

/**
 * @param {PartialSearchResult<'products'>}
 */
function SearchResultsProducts({term, products, colorPatterns, total}) {
  if (!products?.nodes.length) {
    return null;
  }
  return (
    <div className="search-result">
      <Filter
        tag={''}
        handle={''}
        filters={products?.productFilters}
        term={`"${term}" (${total})`}
      />
      <motion.div layout="position">
        <PaginatedResourceSection
          connection={products}
          resourcesClassName="products-grid"
        >
          {({node: product, index}) => (
            <ProductColorVariants
              product={product}
              index={index}
              colorPatterns={colorPatterns}
              key={product.id}
            />
          )}
        </PaginatedResourceSection>
      </motion.div>
    </div>
  );
}

function SearchResultsEmpty() {
  return <p className="no-results">No results, try a different search.</p>;
}

/** @typedef {RegularSearchReturn['result']['items']} SearchItems */
/**
 * @typedef {Pick<
 *   SearchItems,
 *   ItemType
 * > &
 *   Pick<RegularSearchReturn, 'term'>} PartialSearchResult
 * @template {keyof SearchItems} ItemType
 */
/**
 * @typedef {RegularSearchReturn & {
 *   children: (args: SearchItems & {term: string}) => React.ReactNode;
 * }} SearchResultsProps
 */

/** @typedef {import('~/lib/search').RegularSearchReturn} RegularSearchReturn */
