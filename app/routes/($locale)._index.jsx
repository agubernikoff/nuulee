import {Await, useLoaderData, Link} from '@remix-run/react';
import {Suspense} from 'react';
import {Image, Money} from '@shopify/hydrogen';
import ProductGridItem from '~/components/ProductGridItem';

/**
 * @type {MetaFunction}
 */
export const meta = () => {
  return [{title: 'Hydrogen | Home'}];
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
async function loadCriticalData({context}) {
  const [{collections}, men, women] = await Promise.all([
    context.storefront.query(FEATURED_COLLECTION_QUERY),
    // Add other queries here, so that they are loaded in parallel
    context.storefront.query(MENS_COLLECTION_QUERY),
    context.storefront.query(WOMENS_COLLECTION_QUERY),
  ]);

  return {
    featuredCollection: collections.nodes[0],
    menCollection: men.collection,
    womenCollection: women.collection,
  };
}

/**
 * Load data for rendering content below the fold. This data is deferred and will be
 * fetched after the initial page load. If it's unavailable, the page should still 200.
 * Make sure to not throw any errors here, as it will cause the page to 500.
 * @param {LoaderFunctionArgs}
 */
function loadDeferredData({context}) {
  const recommendedProducts = context.storefront
    .query(RECOMMENDED_PRODUCTS_QUERY)
    .catch((error) => {
      // Log query errors, but don't throw them so the page can still render
      console.error(error);
      return null;
    });

  return {
    recommendedProducts,
  };
}

export default function Homepage() {
  /** @type {LoaderReturnData} */
  const data = useLoaderData();
  return (
    <div className="home">
      <Hero />
      <RecommendedProducts products={data.recommendedProducts} />
      <CollectionLinks
        collections={[data.menCollection, data.womenCollection]}
      />
    </div>
  );
}

function Hero() {
  //import video files from sanity
  return (
    <div className="hero-container">
      <p>
        shop our latest signature styles—permanent fixtures of the nüülee
        cashmere wardrobe.
      </p>
    </div>
  );
}

/**
 * @param {{
 *   products: Promise<RecommendedProductsQuery | null>;
 * }}
 */
function RecommendedProducts({products}) {
  return (
    <div className="recommended-products">
      <h2>Recommended Products</h2>
      <Suspense fallback={<div>Loading...</div>}>
        <Await resolve={products}>
          {(response) => (
            <div className="products-grid">
              {response
                ? response.products.nodes.map((product, index) => (
                    <ProductGridItem
                      key={product.id}
                      product={product}
                      loading={index < 8 ? 'eager' : undefined}
                    />
                  ))
                : null}
            </div>
          )}
        </Await>
      </Suspense>
      <br />
    </div>
  );
}

function CollectionLinks({collections}) {
  return (
    <div className="collection-links-container">
      {collections.map((col) => (
        <Link prefetch="intent" to={`/collections/${col.handle}`}>
          <Image
            alt={col.image.altText || `shop ${col.handle}`}
            aspectRatio="361/482"
            data={col.image}
            // sizes="(min-width: 45em) 400px, 100vw"
          />
          <p>{`shop ${col.handle}`}</p>
        </Link>
      ))}
    </div>
  );
}

const FEATURED_COLLECTION_QUERY = `#graphql
  fragment FeaturedCollection on Collection {
    id
    title
    image {
      id
      url
      altText
      width
      height
    }
    handle
  }
  query FeaturedCollection($country: CountryCode, $language: LanguageCode)
    @inContext(country: $country, language: $language) {
    collections(first: 1, sortKey: UPDATED_AT, reverse: true) {
      nodes {
        ...FeaturedCollection
      }
    }
  }
`;

const MENS_COLLECTION_QUERY = `#graphql
  query Collection($country: CountryCode, $language: LanguageCode)
    @inContext(country: $country, language: $language) {
      collection(handle: "men") {
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
      }
    }
`;

const WOMENS_COLLECTION_QUERY = `#graphql
  query Collection($country: CountryCode, $language: LanguageCode)
    @inContext(country: $country, language: $language) {
      collection(handle: "women") {
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
      }
    }
`;

const RECOMMENDED_PRODUCTS_QUERY = `#graphql
  fragment RecommendedProduct on Product {
    id
    title
    handle
    priceRange {
      minVariantPrice {
        amount
        currencyCode
      }
    }
    featuredImage {
      id
      altText
      url
      width
      height
    }
    images(first: 2) {
      nodes {
        id
        url
        altText
        width
        height
      }
    }
  }
  query RecommendedProducts ($country: CountryCode, $language: LanguageCode)
    @inContext(country: $country, language: $language) {
    products(first: 4, sortKey: UPDATED_AT, reverse: true) {
      nodes {
        ...RecommendedProduct
      }
    }
  }
`;

/** @typedef {import('@shopify/remix-oxygen').LoaderFunctionArgs} LoaderFunctionArgs */
/** @template T @typedef {import('@remix-run/react').MetaFunction<T>} MetaFunction */
/** @typedef {import('storefrontapi.generated').FeaturedCollectionFragment} FeaturedCollectionFragment */
/** @typedef {import('storefrontapi.generated').RecommendedProductsQuery} RecommendedProductsQuery */
/** @typedef {import('@shopify/remix-oxygen').SerializeFrom<typeof loader>} LoaderReturnData */
