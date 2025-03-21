import {redirect} from '@shopify/remix-oxygen';
import {useLoaderData, Link, useSearchParams} from '@remix-run/react';
import {
  getPaginationVariables,
  Image,
  Money,
  Analytics,
} from '@shopify/hydrogen';
import {useVariantUrl} from '~/lib/variants';
import {PaginatedResourceSection} from '~/components/PaginatedResourceSection';
import ProductGridItem from '~/components/ProductGridItem';
import {motion, AnimatePresence} from 'motion/react';
import {useState, useEffect, useRef} from 'react';

/**
 * @type {MetaFunction<typeof loader>}
 */
export const meta = ({data}) => {
  return [{title: `Hydrogen | ${data?.collection.title ?? ''} Collection`}];
};

/**
 * @param {LoaderFunctionArgs} args
 */
export async function loader(args) {
  // Start fetching non-critical data without blocking time to first byte
  const deferredData = loadDeferredData(args);

  // Await the critical data required to render initial state of the page
  const criticalData = await loadCriticalData(args);

  return {...deferredData, ...criticalData};
}

/**
 * Load data necessary for rendering content above the fold. This is the critical data
 * needed to render the page. If it's unavailable, the whole page should 400 or 500 error.
 * @param {LoaderFunctionArgs}
 */
async function loadCriticalData({context, params, request}) {
  const {handle, tag} = params;
  const {storefront} = context;
  const url = new URL(request.url);
  const searchParams = new URLSearchParams(url.search);
  const paginationVariables = getPaginationVariables(request, {
    pageBy: 8,
  });
  const filters = [];
  let reverse = false;
  let sortKey = null;

  if (!handle) {
    throw redirect('/collections');
  }

  if (tag) {
    filters.push({tag});
  }
  if (searchParams.has('filter')) {
    filters.push(...searchParams.getAll('filter').map((x) => JSON.parse(x)));
  }
  if (searchParams.has('sortKey')) sortKey = searchParams.get('sortKey');
  if (searchParams.has('reverse'))
    reverse = searchParams.get('reverse') === 'true';

  const [{collection}] = await Promise.all([
    storefront.query(COLLECTION_QUERY, {
      variables: {handle, filters, reverse, sortKey, ...paginationVariables},
      // Add other queries here, so that they are loaded in parallel
    }),
  ]);

  if (!collection) {
    throw new Response(`Collection ${handle} not found`, {
      status: 404,
    });
  }

  return {
    collection,
    tag,
    handle,
  };
}

/**
 * Load data for rendering content below the fold. This data is deferred and will be
 * fetched after the initial page load. If it's unavailable, the page should still 200.
 * Make sure to not throw any errors here, as it will cause the page to 500.
 * @param {LoaderFunctionArgs}
 */
function loadDeferredData({context}) {
  return {};
}

export default function Collection() {
  /** @type {LoaderReturnData} */
  const {collection, handle, tag} = useLoaderData();
  return (
    <div className="collection">
      {!tag ? (
        <Image
          alt={collection.image.altText}
          aspectRatio={`${collection?.image?.width} / ${collection?.image?.height}`}
          data={collection.image}
          sizes="100vw"
        />
      ) : null}
      <p className="collection-description">{collection.description}</p>
      <Filter
        tag={tag}
        handle={handle}
        filters={collection?.products?.filters}
      />
      <motion.div layout="position">
        <PaginatedResourceSection
          connection={collection.products}
          resourcesClassName="products-grid"
        >
          {({node: product, index}) => (
            <ProductGridItem
              key={product.id}
              product={product}
              loading={index < 8 ? 'eager' : undefined}
            />
          )}
        </PaginatedResourceSection>
      </motion.div>
      <Analytics.CollectionView
        data={{
          collection: {
            id: collection.id,
            handle: collection.handle,
          },
        }}
      />
    </div>
  );
}

function Filter({handle, tag, filters}) {
  const [open, setOpen] = useState(false);
  const [init, setInit] = useState(true);
  useEffect(() => {
    setInit(false);
  }, []);
  function toggleOpen() {
    setOpen(!open);
  }
  const [searchParams, setSearchParams] = useSearchParams();

  function addFilter(input) {
    setSearchParams(
      (prev) => {
        if (prev.has('filter')) {
          prev.append('filter', input);
        } else prev.set('filter', input);
        return prev;
      },
      {preventScrollReset: true},
    );
  }

  function removeFilter(input) {
    setSearchParams(
      (prev) => {
        const newParams = new URLSearchParams(prev); // Clone to avoid mutation
        const filters = newParams.getAll('filter'); // Get all filter values
        newParams.delete('filter'); // Remove all instances

        // Re-add only the filters that are NOT being removed
        filters
          .filter((f) => f !== input)
          .forEach((f) => newParams.append('filter', f));

        return newParams;
      },
      {preventScrollReset: true},
    );
  }

  function isChecked(input) {
    return searchParams.getAll('filter').includes(input);
  }

  function addSort(input) {
    const parsed = JSON.parse(input);
    setSearchParams(
      (prev) => {
        prev.set('reverse', Boolean(parsed.reverse));
        prev.set('sortKey', parsed.sortKey);
        return prev;
      },
      {preventScrollReset: true},
    );
  }

  function removeSort() {
    setSearchParams(
      (prev) => {
        prev.delete('reverse');
        prev.delete('sortKey');
        return prev;
      },
      {preventScrollReset: true},
    );
  }

  function isSortChecked(input) {
    const parsed = JSON.parse(input);
    return (
      searchParams.get('reverse') === parsed.reverse.toString() &&
      searchParams.get('sortKey') === parsed.sortKey
    );
  }

  return (
    <motion.div
      initial={{height: '17px'}}
      animate={{height: open ? 'auto' : '17px'}}
      className="filter-container"
    >
      <div className="filter-header">
        <motion.p className="collection-breadcrumb" layout={false}>
          shop <Polygon /> {handle}
          {tag ? (
            <>
              {' '}
              <Polygon /> {tag}
            </>
          ) : null}
        </motion.p>
        <p onClick={toggleOpen} className="filter-toggle">
          <AnimatePresence mode="popLayout">
            <motion.span
              key={`toggle-${open}`}
              initial={{opacity: init ? 1 : 0}}
              animate={{opacity: 1}}
              exit={{opacity: 0}}
              transition={{duration: 0.5}}
              style={{marginRight: '.25rem'}}
            >
              {!open ? 'filter/sort' : 'close'}
            </motion.span>
          </AnimatePresence>
          <span className={`icon ${open ? 'open' : ''}`}>+</span>
        </p>
      </div>
      <motion.div
        initial={{opacity: 0}}
        animate={{opacity: open ? 1 : 0}}
        className="filter-body"
      >
        <FilterColumns
          filters={filters}
          tag={tag}
          handle={handle}
          addFilter={addFilter}
          removeFilter={removeFilter}
          isChecked={isChecked}
        />
        <SortColumn
          addSort={addSort}
          removeSort={removeSort}
          isChecked={isSortChecked}
        />
      </motion.div>
    </motion.div>
  );
}

function FilterColumns({filters, addFilter, isChecked, removeFilter}) {
  return (
    <div className="filter-columns-container">
      <p className="bold-filter-header">filter</p>
      <div className="filter-columns">
        {filters.map((f) => (
          <FilterColumn
            key={f.id}
            filter={f}
            addFilter={addFilter}
            isChecked={isChecked}
            removeFilter={removeFilter}
          />
        ))}
      </div>
    </div>
  );
}

function SortColumn({addSort, removeSort, isChecked}) {
  return (
    <div>
      <p className="bold-filter-header">sort</p>
      <div className="filter-column">
        <FilterInput
          label={'alphabetically, a-z'}
          value={JSON.stringify({reverse: false, sortKey: 'TITLE'})}
          addFilter={addSort}
          isChecked={isChecked}
          removeFilter={removeSort}
        />
        <FilterInput
          label={'alphabetically, z-a'}
          value={JSON.stringify({reverse: true, sortKey: 'TITLE'})}
          addFilter={addSort}
          isChecked={isChecked}
          removeFilter={removeSort}
        />
        <FilterInput
          label={'date, new to old'}
          value={JSON.stringify({reverse: true, sortKey: 'CREATED'})}
          addFilter={addSort}
          isChecked={isChecked}
          removeFilter={removeSort}
        />
        <FilterInput
          label={'date, old to new'}
          value={JSON.stringify({reverse: false, sortKey: 'CREATED'})}
          addFilter={addSort}
          isChecked={isChecked}
          removeFilter={removeSort}
        />
        <FilterInput
          label={'price, low to high'}
          value={JSON.stringify({reverse: false, sortKey: 'PRICE'})}
          addFilter={addSort}
          isChecked={isChecked}
          removeFilter={removeSort}
        />
        <FilterInput
          label={'price, high to low'}
          value={JSON.stringify({reverse: true, sortKey: 'PRICE'})}
          addFilter={addSort}
          isChecked={isChecked}
          removeFilter={removeSort}
        />
      </div>
    </div>
  );
}

function FilterColumn({filter, addFilter, isChecked, removeFilter}) {
  const filterOrderRef = useRef(new Map()); // Persist across renders

  function storeInitialOrder(filters) {
    if (filterOrderRef.current.size === 0) {
      filters.forEach((filter, index) => {
        filterOrderRef.current.set(filter.label, index);
      });
    }
  }

  function sortByStoredOrder(filters) {
    return filters.slice().sort((a, b) => {
      return (
        (filterOrderRef.current.get(a.label) ?? Infinity) -
        (filterOrderRef.current.get(b.label) ?? Infinity)
      );
    });
  }

  useEffect(() => {
    storeInitialOrder(filter.values);
  }, []);

  return (
    <div className="filter-column-container">
      <p>{filter.label}:</p>
      <div className="filter-column">
        {sortByStoredOrder(
          filter.values.filter(
            (v) => !(filter.label === 'category' && v.label.includes('men')),
          ),
        ).map((v) => (
          <FilterInput
            key={v.id}
            label={v.label}
            value={v.input}
            count={v.count}
            addFilter={addFilter}
            isChecked={isChecked}
            removeFilter={removeFilter}
          />
        ))}
      </div>
    </div>
  );
}

function FilterInput({
  label,
  value,
  count,
  addFilter,
  isChecked,
  removeFilter,
}) {
  return (
    <div style={count === 0 ? {opacity: '33%'} : null}>
      <input
        type="checkbox"
        id={label}
        name="gender"
        value={value}
        checked={isChecked(value)}
        onChange={(e) => {
          if (e.target.checked) addFilter(e.target.value);
          else removeFilter(e.target.value);
        }}
        disabled={count === 0 ? true : null}
      />
      <label
        htmlFor={label}
        style={
          count === 0
            ? {
                textDecoration: 'underline',
                textUnderlineOffset: '-38%',
                textDecorationSkipInk: 'none',
              }
            : null
        }
      >
        {label.toLowerCase()}
      </label>
    </div>
  );
}

function Polygon() {
  return (
    <svg
      width="5"
      height="6"
      viewBox="0 0 5 6"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M5 3L0.5 5.59808L0.5 0.401924L5 3Z" fill="black" />
    </svg>
  );
}

const PRODUCT_ITEM_FRAGMENT = `#graphql
  fragment MoneyProductItem on MoneyV2 {
    amount
    currencyCode
  }
  fragment ProductItem on Product {
    id
    handle
    title
    images(first: 2) {
      nodes {
        id
        url
        altText
        width
        height
      }
    }
    featuredImage {
      id
      altText
      url
      width
      height
    }
    priceRange {
      minVariantPrice {
        ...MoneyProductItem
      }
      maxVariantPrice {
        ...MoneyProductItem
      }
    }
  }
`;

// NOTE: https://shopify.dev/docs/api/storefront/2022-04/objects/collection
const COLLECTION_QUERY = `#graphql
  ${PRODUCT_ITEM_FRAGMENT}
  query Collection(
    $handle: String!
    $country: CountryCode
    $language: LanguageCode
    $first: Int
    $last: Int
    $startCursor: String
    $endCursor: String
    $filters: [ProductFilter!]
    $reverse: Boolean
    $sortKey: ProductCollectionSortKeys
  ) @inContext(country: $country, language: $language) {
    collection(handle: $handle) {
      id
      handle
      title
      description
      image {
        id
        url
        altText
        width
        height
      }
      products(
        first: $first,
        last: $last,
        before: $startCursor,
        after: $endCursor,
        filters: $filters,
        reverse: $reverse,
        sortKey: $sortKey
      ) {
        filters{
          id
          label
          presentation
          type
          values{
            count
            id
            input
            label
            swatch{
              color
            }
          }
        }
        nodes {
          ...ProductItem
        }
        pageInfo {
          hasPreviousPage
          hasNextPage
          endCursor
          startCursor
        }
      }
    }
  }
`;

/** @typedef {import('@shopify/remix-oxygen').LoaderFunctionArgs} LoaderFunctionArgs */
/** @template T @typedef {import('@remix-run/react').MetaFunction<T>} MetaFunction */
/** @typedef {import('storefrontapi.generated').ProductItemFragment} ProductItemFragment */
/** @typedef {import('@shopify/remix-oxygen').SerializeFrom<typeof loader>} LoaderReturnData */
