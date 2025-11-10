import {Await, useLoaderData, useRouteLoaderData} from '@remix-run/react';
import {Suspense} from 'react';
import {Image, Money} from '@shopify/hydrogen';
import ProductGridItem from '~/components/ProductGridItem';
import {sanityClient} from '~/sanity/SanityClient';
import NavLink from '~/components/NavLink';
import mobileIcon from '~/assets/NL_Social-Sharing.jpg';
import CollectionGridItem from '~/components/CollectionGridItem';
import {optimizeImageUrl, imagePresets} from '~/sanity/imageUrlBuilder';

/**
 * @type {MetaFunction}
 */
export const meta = () => {
  return [
    {title: 'nüülee'},
    {name: 'og:title', property: 'nüülee'},
    {property: 'og:image', content: mobileIcon},
  ];
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
      "*[_type == 'home'][0]{...,hero{...,mediaItems[]{...,video{...,asset->{url}},image{...,asset->{url},'dimensions': asset->metadata.dimensions}}},shopMensImage{...,image{...,asset->{url},'dimensions': asset->metadata.dimensions}},shopWomensImage{...,image{...,asset->{url},'dimensions': asset->metadata.dimensions}},collectionsGrid[]{...,image{...,asset->{url}}},sections[]{...,images[]{...,image{...,asset->{url},'dimensions': asset->metadata.dimensions}}}}",
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
  const {isDev} = useRouteLoaderData('root');
  return (
    <div className="home">
      <Hero data={data.sanityData.hero} />
      {/* {!isDev && <RecommendedProducts products={data.featuredCollection} />} */}
      <CollectionLinks
        collections={[data.womenCollection, data.menCollection]}
        shopMenImage={data.sanityData.shopMensImage}
        shopWomenImage={data.sanityData.shopWomensImage}
      />
      <CollectionsGrid collections={data.sanityData.collectionsGrid} />
      {data.sanityData.sections.map((section) => (
        <Section2 section={section} key={section._key} />
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
            src={optimizeImageUrl(mi.image.asset.url, imagePresets.hero)}
            alt={mi.image.altText}
            loading="eager"
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
      <div style={{position: 'absolute', height: '100%', width: '350px'}}>
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

function CollectionsGrid({collections}) {
  return (
    <div className="recommended-products">
      <div className="products-grid">
        {collections.map((c, index) => (
          <CollectionGridItem key={c._key} collection={c} />
        ))}
      </div>
    </div>
  );
}

function CollectionLinks({collections, shopMenImage, shopWomenImage}) {
  // Optimize shop images
  const optimizedMenImage = optimizeImageUrl(shopMenImage.image.asset.url, {
    width: 600,
    quality: 85,
    format: 'webp',
  });

  const optimizedWomenImage = optimizeImageUrl(shopWomenImage.image.asset.url, {
    width: 600,
    quality: 85,
    format: 'webp',
  });

  return (
    <div className="collection-links-container">
      {collections.map((col) => (
        <NavLink
          key={col.handle}
          prefetch="intent"
          to={`/collections/${col.handle}`}
        >
          <div style={{aspectRatio: '361/482'}}>
            <img
              alt={
                col.handle === 'men'
                  ? shopMenImage.alt
                  : col.handle === 'women'
                  ? shopWomenImage.alt
                  : `shop ${col.handle}`
              }
              src={
                col.handle === 'men'
                  ? optimizedMenImage
                  : col.handle === 'women'
                  ? optimizedWomenImage
                  : null
              }
              loading="lazy"
              style={{width: '100%', height: '100%', objectFit: 'cover'}}
              sizes="(min-width: 45em) 400px, 100vw"
            />
          </div>
          <p>{`shop ${col.handle}`}</p>
        </NavLink>
      ))}
    </div>
  );
}

function Section({section}) {
  // Find primary and secondary images
  const primaryImage = section.images.find((s) => s.isPrimary);
  const secondaryImage =
    section.images.length > 1 ? section.images[1] : section.images[0];

  // Optimize URLs
  const primaryImageUrl = primaryImage
    ? optimizeImageUrl(primaryImage.image.asset.url, {
        width: 600,
        quality: 85,
        format: 'webp',
      })
    : null;

  const secondaryImageUrl = optimizeImageUrl(secondaryImage.image.asset.url, {
    width: 600,
    quality: 85,
    format: 'webp',
  });

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
        <NavLink to={`/pages/${section.handle}`}>learn more</NavLink>
        {section.images.length > 1 && primaryImage ? (
          <div>
            <img
              src={primaryImageUrl}
              alt={primaryImage.alt}
              loading="lazy"
              style={{
                aspectRatio: primaryImage.image.dimensions.aspectRatio,
              }}
            />
          </div>
        ) : null}
      </div>
      <div className="section-img-container">
        <img
          src={secondaryImageUrl}
          alt={secondaryImage.alt}
          loading="lazy"
          style={{
            aspectRatio: secondaryImage.image.dimensions.aspectRatio,
          }}
        />
      </div>
    </div>
  );
}

function Section2({section}) {
  // Optimize all section images
  const optimizedImages = section.images.map((img) => ({
    ...img,
    optimizedUrl: optimizeImageUrl(img.image.asset.url, {
      width: 600,
      quality: 85,
      format: 'webp',
    }),
  }));

  return (
    <div
      className="section-container"
      style={{
        justifyContent:
          section.images.length === 1 ? 'center' : 'space-between',
        flexWrap: section.images.length > 1 ? 'wrap' : 'nowrap',
      }}
    >
      <div
        className="section-text-container"
        style={
          section.images.length > 1
            ? {
                width: '100%',
                marginBottom: '56px',
              }
            : {width: '20%'}
        }
      >
        <p>{section.title}</p>
        <p>{section.description}</p>
        <NavLink to={`/discover#${section.handle}`}>learn more</NavLink>
      </div>
      <div
        className="section-img-container"
        style={
          section.images.length > 1
            ? {
                width: '100%',
                display: 'flex',
                justifyContent: 'space-between',
              }
            : {flexShrink: 0}
        }
      >
        {optimizedImages
          .sort((a, b) => a.isPrimary - b.isPrimary)
          .map((img) => (
            <img
              src={img.optimizedUrl}
              alt={img.alt}
              key={img._key}
              loading="lazy"
            />
          ))}
      </div>
      {section.title2 && section.description2 && section.handle2 && (
        <div
          className="section-text-container hasTwo"
          style={{
            width: section.images.length > 1 ? '100%' : '20%',
          }}
        >
          <p>{section.title2}</p>
          <p>{section.description2}</p>
          <NavLink to={`/pages/${section.handle2}`}>care guide</NavLink>
        </div>
      )}
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
    availableForSale
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
    availableForSale
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
