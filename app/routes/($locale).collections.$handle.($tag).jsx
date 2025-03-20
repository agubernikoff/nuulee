import {redirect} from '@shopify/remix-oxygen';
import {useLoaderData, Link} from '@remix-run/react';
import {
  getPaginationVariables,
  Image,
  Money,
  Analytics,
} from '@shopify/hydrogen';
import {useVariantUrl} from '~/lib/variants';
import {PaginatedResourceSection} from '~/components/PaginatedResourceSection';
import ProductGridItem from '~/components/ProductGridItem';
import {useState} from 'react';
import {motion, AnimatePresence} from 'motion/react';
import {useEffect} from 'react';

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
  const paginationVariables = getPaginationVariables(request, {
    pageBy: 8,
  });
  const filters = [];

  if (!handle) {
    throw redirect('/collections');
  }

  if (tag) {
    filters.push({tag});
  }
  console.log(filters[0]);

  const [{collection}] = await Promise.all([
    storefront.query(COLLECTION_QUERY, {
      variables: {handle, filters, ...paginationVariables},
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
      <Filter tag={tag} handle={handle} />
      <motion.div layout>x</motion.div>
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

function Filter({handle, tag}) {
  const [open, setOpen] = useState(false);
  const [init, setInit] = useState(true);
  useEffect(() => {
    setInit(false);
  }, []);
  function toggleOpen() {
    setOpen(!open);
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
        <p>x</p>
        <p>x</p>
        <p>x</p>
      </motion.div>
    </motion.div>
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
        filters: $filters
      ) {
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
