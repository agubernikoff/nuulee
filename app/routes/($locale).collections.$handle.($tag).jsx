import {redirect} from '@shopify/remix-oxygen';
import {
  useLoaderData,
  Link,
  useSearchParams,
  useLocation,
  useRouteLoaderData,
} from '@remix-run/react';
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
  return [{title: `nüülee | ${data?.collection.title ?? ''} Collection`}];
};

/**
 * @param {LoaderFunctionArgs} args
 */
export async function loader(args) {
  const url = new URL(args.request.url);
  const isHardRefresh =
    args.request.method === 'GET' &&
    args.request.headers.get('sec-fetch-dest') === 'document';

  if (isHardRefresh) {
    const paginationKeys = ['cursor', 'direction'];
    let shouldRedirect = false;

    for (const key of paginationKeys) {
      if (url.searchParams.has(key)) {
        url.searchParams.delete(key);
        shouldRedirect = true;
      }
    }

    if (shouldRedirect) {
      return redirect(`${url.pathname}?${url.searchParams.toString()}`);
    }
  }
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
  let sortKey = 'MANUAL';

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

  const [{collection}, {metaobjects}] = await Promise.all([
    storefront.query(COLLECTION_QUERY, {
      variables: {handle, filters, reverse, sortKey, ...paginationVariables},
      // Add other queries here, so that they are loaded in parallel
    }),
    storefront.query(COLOR_PATTERNS_QUERY),
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
    colorPatterns: metaobjects.edges,
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
  const {collection, handle, tag, colorPatterns} = useLoaderData();

  const {isDev} = useRouteLoaderData('root');
  console.log(collection);
  return (
    <div className="collection">
      {!tag && collection.image ? (
        <>
          <Image
            alt={collection.image?.altText}
            aspectRatio={`${collection?.image?.width} / ${collection?.image?.height}`}
            data={collection.image}
            sizes="100vw"
          />
          <p className="collection-description">{collection.description}</p>
        </>
      ) : null}
      <Filter
        tag={tag}
        handle={collection.title.toLowerCase()}
        filters={collection?.products?.filters}
      />
      <motion.div layout="position">
        <PaginatedResourceSection
          connection={collection.products}
          resourcesClassName="products-grid"
        >
          {({node: product, index}) => (
            <ProductColorVariants
              product={product}
              index={index}
              colorPatterns={colorPatterns}
              collectionHandle={handle}
              key={product.id}
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

export function ProductColorVariants({
  product,
  index,
  colorPatterns,
  collectionHandle,
}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const colorFilter = searchParams
    .getAll('filter')
    .map((filter) => JSON.parse(filter))
    .filter((filter) => filter.taxonomyMetafield?.key === 'color-pattern');

  // Determine if this is a gendered collection
  const isWomensCollection = collectionHandle?.toLowerCase().includes('women');
  const isMensCollection =
    collectionHandle?.toLowerCase().includes('men') &&
    !collectionHandle?.toLowerCase().includes('women');

  // Get gender-specific galleries from metafields
  const mensGalleryRefs = product.mensGallery?.references?.nodes || [];
  const womensGalleryRefs = product.womensGallery?.references?.nodes || [];

  // Determine which images to use
  let imagesToUse = product.images.nodes;

  if (isWomensCollection && womensGalleryRefs.length > 0) {
    // Use women's gallery images
    imagesToUse = womensGalleryRefs.map((ref) => ({
      id: ref.id,
      url: ref.image.url,
      altText: ref.image.altText,
      width: ref.image.width,
      height: ref.image.height,
    }));
  } else if (isMensCollection && mensGalleryRefs.length > 0) {
    // Use men's gallery images
    imagesToUse = mensGalleryRefs.map((ref) => ({
      id: ref.id,
      url: ref.image.url,
      altText: ref.image.altText,
      width: ref.image.width,
      height: ref.image.height,
    }));
  }

  const colors = product.options
    .find((o) => o.name === 'Color')
    ?.optionValues?.map((v) => {
      return {
        hex: v.swatch?.color,
        name: v.name,
        colorPattern: colorPatterns.find(
          (pat) =>
            pat.node.handle.toLowerCase() ===
            v.name.replace(/[ /]/g, '-').toLowerCase(),
        ),
      };
    });

  if (!colors)
    return (
      <div key={product.id}>
        <ProductGridItem
          product={product}
          loading={index < 8 ? 'eager' : undefined}
          collectionHandle={collectionHandle}
        />
      </div>
    );

  return colors?.map((color) => {
    const colorTaxonomyReferences = JSON.parse(
      color?.colorPattern?.node?.fields?.find(
        (field) => field.key === 'color_taxonomy_reference',
      )?.value || '[]',
    );

    const shouldDisplay =
      colorFilter.length === 0 ||
      colorTaxonomyReferences?.find((ref) =>
        colorFilter
          ?.map((filter) => filter?.taxonomyMetafield?.value)
          .includes(ref),
      );

    const newHandle = `${product.handle}?${product.options
      .filter((o) => o.name !== 'Color')
      .map((o) => `${o.name}=${o.optionValues[0].name}`)
      .join('&')}&Color=${color.name}`;

    // Filter images for this color from the gender-appropriate gallery
    const colorImages = imagesToUse.filter(
      (n) => n?.altText?.toLowerCase() === color.name.toLowerCase(),
    );

    return (
      <div
        key={`${product.id}-${color.name.replace(' ', '-').replace('/', '-')}`}
        style={{display: shouldDisplay ? 'block' : 'none'}}
      >
        <ProductGridItem
          product={
            colorImages.length > 0
              ? {
                  ...product,
                  images: {
                    nodes: colorImages,
                  },
                  handle: newHandle,
                }
              : {...product, handle: newHandle}
          }
          loading={index < 8 ? 'eager' : undefined}
          collectionHandle={collectionHandle}
        />
      </div>
    );
  });
}

export function Filter({handle, tag, filters, term}) {
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
        prev.delete('direction');
        prev.delete('cursor');
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
        newParams.delete('direction');
        newParams.delete('cursor');

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
        prev.delete('direction');
        prev.delete('cursor');
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
        prev.delete('direction');
        prev.delete('cursor');
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
          {term ? (
            term
          ) : (
            <>
              shop <Polygon /> {handle}
              {tag ? (
                <>
                  {' '}
                  <Polygon /> {tag}
                </>
              ) : null}
            </>
          )}
        </motion.p>
        <p onClick={toggleOpen} className="filter-toggle">
          <span
            style={{
              marginRight: '.25rem',
              opacity: !open ? 1 : 0,
              transition: 'opacity 500ms ease-in-out',
            }}
          >
            filter/sort
          </span>
          <span
            style={{
              opacity: open ? 1 : 0,
              transition: 'opacity 500ms ease-in-out',
              position: 'absolute',
              top: 0,
              right: '.75rem',
            }}
          >
            close
          </span>

          <span className={`icon ${open ? 'open' : ''}`}>+</span>
        </p>
      </div>
      <motion.div
        initial={{opacity: 0}}
        animate={{opacity: open ? 1 : 0}}
        style={{zIndex: open ? 0 : -1}}
        className="filter-body"
      >
        <div className="divider" />
        <FilterColumns
          filters={filters}
          tag={tag}
          handle={handle}
          addFilter={addFilter}
          removeFilter={removeFilter}
          isChecked={isChecked}
        />
        <div className="divider" />
        <SortColumn
          addSort={addSort}
          removeSort={removeSort}
          isChecked={isSortChecked}
          term={term}
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

function SortColumn({addSort, removeSort, isChecked, term}) {
  return (
    <div className="sort-column-container">
      <p className="bold-filter-header">sort</p>
      <div className="filter-column">
        <FilterInput
          label={'alphabetically, a-z'}
          value={JSON.stringify({reverse: false, sortKey: 'TITLE'})}
          addFilter={addSort}
          isChecked={isChecked}
          removeFilter={removeSort}
          count={term ? 0 : null}
        />
        <FilterInput
          label={'alphabetically, z-a'}
          value={JSON.stringify({reverse: true, sortKey: 'TITLE'})}
          addFilter={addSort}
          isChecked={isChecked}
          removeFilter={removeSort}
          count={term ? 0 : null}
        />
        <FilterInput
          label={'date, new to old'}
          value={JSON.stringify({reverse: true, sortKey: 'CREATED'})}
          addFilter={addSort}
          isChecked={isChecked}
          removeFilter={removeSort}
          count={term ? 0 : null}
        />
        <FilterInput
          label={'date, old to new'}
          value={JSON.stringify({reverse: false, sortKey: 'CREATED'})}
          addFilter={addSort}
          isChecked={isChecked}
          removeFilter={removeSort}
          count={term ? 0 : null}
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
  const [hide, setHide] = useState(false);
  const {pathname} = useLocation();
  useEffect(() => {
    setHide(count === 0);
  }, [pathname]);
  return (
    <div
      style={
        count === 0
          ? {
              opacity: '33%',
              display: hide ? 'none' : 'block',
            }
          : null
      }
    >
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
    availableForSale
    images(first: 20) {
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
    mensGallery: metafield(namespace: "custom", key: "mens_gallery") {
      references(first: 20) {
        nodes {
          ... on MediaImage {
            id
            image {
              id
              url
              altText
              width
              height
            }
          }
        }
      }
    }
    womensGallery: metafield(namespace: "custom", key: "womens_gallery") {
      references(first: 20) {
        nodes {
          ... on MediaImage {
            id
            image {
              id
              url
              altText
              width
              height
            }
          }
        }
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

const COLOR_PATTERNS_QUERY = `#graphql
query GetColorPatternMetaobjects {
  metaobjects(first: 100, type: "shopify--color-pattern") {
    edges {
      node {
        id
        handle
        type
        fields {
          key
          value
        }
      }
    }
  }
}
`;

/** @typedef {import('@shopify/remix-oxygen').LoaderFunctionArgs} LoaderFunctionArgs */
/** @template T @typedef {import('@remix-run/react').MetaFunction<T>} MetaFunction */
/** @typedef {import('storefrontapi.generated').ProductItemFragment} ProductItemFragment */
/** @typedef {import('@shopify/remix-oxygen').SerializeFrom<typeof loader>} LoaderReturnData */
