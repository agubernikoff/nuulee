import {Await, useLoaderData} from '@remix-run/react';
import {Suspense} from 'react';
import {Image, Money} from '@shopify/hydrogen';
import ProductGridItem from '~/components/ProductGridItem';
import {sanityClient} from '~/sanity/SanityClient';
import NavLink from '~/components/NavLink';

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
  const [newArrivals, men, women] = await Promise.all([
    context.storefront.query(NEW_ARRIVALS_QUERY),
    // Add other queries here, so that they are loaded in parallel
    context.storefront.query(MENS_COLLECTION_QUERY),
    context.storefront.query(WOMENS_COLLECTION_QUERY),
  ]);

  const homePage = await sanityClient
    .fetch(
      "*[_type == 'home'][0]{...,hero{...,mediaItems[]{...,video{...,asset->{url}},image{...,asset->{url},'dimensions': asset->metadata.dimensions}}},sections[]{...,images[]{...,image{...,asset->{url},'dimensions': asset->metadata.dimensions}}}}",
    )
    .then((response) => response);

  return {
    featuredCollection: newArrivals.collection,
    menCollection: men.collection,
    womenCollection: women.collection,
    sanityData: homePage,
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
      <Hero data={data.sanityData.hero} />
      <RecommendedProducts products={data.featuredCollection} />
      <CollectionLinks
        collections={[data.womenCollection, data.menCollection]}
      />
      {data.sanityData.sections.map((section) => (
        <Section section={section} key={section._key} />
      ))}
    </div>
  );
}

function Hero({data}) {
  const media = data.mediaItems
    .sort((a, b) => (b.isPrimary ? 1 : -1))
    .map((mi) => {
      if (mi.mediaType === 'video')
        return (
          <video
            height={1150}
            width={1100}
            autoPlay
            key={mi._key}
            muted
            loop
            playsInline
            style={{
              width: data.mediaItems.length > 1 ? '50%' : '100%',
              height: '110vh',
              objectFit: 'cover',
            }}
            className="hero-media"
          >
            <source src={mi.video.asset.url} type="video/mp4" />
          </video>
        );
      if (mi.mediaType === 'image')
        return (
          <img
            key={mi._key}
            src={mi.image.asset.url}
            alt={mi.image.altText}
            style={{
              width: data.mediaItems.length > 1 ? '50%' : '100%',
              height: '110vh',
              objectFit: 'cover',
            }}
            className="hero-media"
          />
        );
    });
  return (
    <div className="hero-container">
      {media}
      <div style={{position: 'absolute', height: '100%', width: '300px'}}>
        <p className="sticky-p">{data.headline}</p>
      </div>
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
        <NavLink
          key={col.handle}
          prefetch="intent"
          to={`/collections/${col.handle}`}
        >
          <Image
            alt={col.image.altText || `shop ${col.handle}`}
            aspectRatio="361/482"
            data={col.image}
            sizes="(min-width: 45em) 400px, 100vw"
          />
          <p>{`shop ${col.handle}`}</p>
        </NavLink>
      ))}
    </div>
  );
}

function Section({section}) {
  return (
    <div
      className="section-container"
      style={{
        justifyContent:
          section.images.length === 1 ? 'normal' : 'space-between',
      }}
    >
      <div className="section-text-container">
        <p>{section.title}</p>
        <p>{section.description}</p>
        <NavLink to={`/pages/${section.title.split(' ').join('-')}`}>
          learn more
        </NavLink>
        {section.images.length > 1 ? (
          <div>
            <img
              src={section.images.find((s) => s.isPrimary).image.asset.url}
              alt={section.images.find((s) => s.isPrimary).alt}
              style={{
                aspectRatio: section.images.find((s) => s.isPrimary).image
                  .dimensions.aspectRatio,
              }}
            />
          </div>
        ) : null}
      </div>
      <div className="section-img-container">
        <img
          src={
            section.images.length > 1
              ? section.images[1].image.asset.url
              : section.images[0].image.asset.url
          }
          alt={
            section.images.length > 1
              ? section.images[1].alt
              : section.images[0].alt
          }
          style={{
            aspectRatio:
              section.images.length > 1
                ? section.images[1].image.dimensions.aspectRatio
                : section.images[0].image.dimensions.aspectRatio,
          }}
        />
      </div>
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
    products(first: 6, sortKey: UPDATED_AT, reverse: true) {
      nodes {
        ...RecommendedProduct
      }
    }
  }
`;

const PRODUCT_ITEM_FRAGMENT = `#graphql
  fragment ProductItem on Product {
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
`;

// NOTE: https://shopify.dev/docs/api/storefront/2022-04/objects/collection
const NEW_ARRIVALS_QUERY = `#graphql
  ${PRODUCT_ITEM_FRAGMENT}
  query Collection(
    $country: CountryCode
    $language: LanguageCode
  ) @inContext(country: $country, language: $language) {
    collection(handle: "new-arrivals") {
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
        first: 6
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
/** @typedef {import('storefrontapi.generated').FeaturedCollectionFragment} FeaturedCollectionFragment */
/** @typedef {import('storefrontapi.generated').RecommendedProductsQuery} RecommendedProductsQuery */
/** @typedef {import('@shopify/remix-oxygen').SerializeFrom<typeof loader>} LoaderReturnData */
