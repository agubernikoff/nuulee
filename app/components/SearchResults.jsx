import {Link, useSearchParams} from '@remix-run/react';
import {Image, Money, Pagination} from '@shopify/hydrogen';
import {urlWithTrackingParams} from '~/lib/search';
import {PaginatedResourceSection} from './PaginatedResourceSection';
import ProductGridItem from './ProductGridItem';
import {motion} from 'motion/react';
import {Filter} from '~/routes/($locale).collections.$handle.($tag)';
import {useRef, useEffect} from 'react';

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

function ProductColorVariants({product, index, colorPatterns}) {
  const [searchParams, setSearchParams] = useSearchParams();

  const colorFilter = searchParams
    .getAll('filter')
    ?.map((filter) => JSON.parse(filter))
    .filter((filter) => filter.taxonomyMetafield?.key === 'color-pattern');

  const colors = product.options
    .find((o) => o.name === 'Color')
    ?.optionValues?.map((v) => {
      return {
        hex: v.swatch.color,
        name: v.name,
        colorPattern: colorPatterns.find(
          (pat) =>
            pat.node.handle === v.name.replace(' ', '-').replace('/', '-'),
        ),
      };
    });

  return colors?.map((color) => {
    const colorTaxonomyReferences = JSON.parse(
      color.colorPattern.node.fields.find(
        (field) => field.key === 'color_taxonomy_reference',
      ).value,
    );

    const shouldDisplay =
      colorFilter.length === 0 ||
      colorTaxonomyReferences.find((ref) =>
        colorFilter
          .map((filter) => filter.taxonomyMetafield?.value)
          .includes(ref),
      );

    const newHandle = `${product.handle}?${product.options
      .filter((o) => o.name !== 'Color')
      .map((o) => `${o.name}=${o.optionValues[0].name}`)
      .join('&')}&Color=${color.name}`;

    return (
      <div
        key={`${product.id}-${color.name.replace(' ', '-').replace('/', '-')}`}
        style={{display: shouldDisplay ? 'block' : 'none'}}
      >
        <ProductGridItem
          product={
            product.images.nodes.find(
              (n) => n?.altText?.toLowerCase() === color.name.toLowerCase(),
            )
              ? {
                  ...product,
                  images: {
                    nodes: product.images.nodes.filter(
                      (n) =>
                        n?.altText?.toLowerCase() === color.name.toLowerCase(),
                    ),
                  },
                  handle: newHandle,
                }
              : product
          }
          loading={index < 8 ? 'eager' : undefined}
        />
      </div>
    );
  });
}
