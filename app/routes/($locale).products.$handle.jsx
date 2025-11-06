import {useLoaderData, Await, useRouteLoaderData} from '@remix-run/react';
import {useState, useEffect, useRef, forwardRef} from 'react';
import {
  getSelectedProductOptions,
  Analytics,
  useOptimisticVariant,
  getProductOptions,
  getAdjacentAndFirstAvailableVariants,
  useSelectedOptionInUrlParam,
} from '@shopify/hydrogen';
import {ProductPrice} from '~/components/ProductPrice';
import {ProductImage} from '~/components/ProductImage';
import {ProductForm} from '~/components/ProductForm';
import {motion, AnimatePresence} from 'motion/react';
import ProductGridItem from '~/components/ProductGridItem';

function useIsFirstRender() {
  const isFirst = useRef(true);
  useEffect(() => {
    isFirst.current = false;
  }, []);
  return isFirst.current;
}

/**
 * Hook to manage gender view context (URL param + sessionStorage)
 */
function useGenderView() {
  const [view, setView] = useState(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // 1. Check URL parameter first
    const urlParams = new URLSearchParams(window.location.search);
    const urlView = urlParams.get('view');

    if (urlView === 'womens' || urlView === 'mens') {
      // Store in sessionStorage for persistence
      sessionStorage.setItem('productView', urlView);
      setView(urlView);
    } else {
      // 2. Check sessionStorage if no URL param
      const storedView = sessionStorage.getItem('productView');
      if (storedView === 'womens' || storedView === 'mens') {
        setView(storedView);
      }
    }
  }, []);

  return view;
}

/**
 * @type {MetaFunction<typeof loader>}
 */
export const meta = ({data}) => {
  return [
    {title: `nüülee | ${data?.product.title ?? ''}`},
    {
      rel: 'canonical',
      href: `/products/${data?.product.handle}`,
    },
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
async function loadCriticalData({context, params, request}) {
  const {handle} = params;
  const {storefront} = context;

  if (!handle) {
    throw new Error('Expected product handle to be defined');
  }

  const [{product}] = await Promise.all([
    storefront.query(PRODUCT_QUERY, {
      variables: {handle, selectedOptions: getSelectedProductOptions(request)},
    }),
    // Add other queries here, so that they are loaded in parallel
  ]);

  if (!product?.id) {
    throw new Response(null, {status: 404});
  }

  return {
    product,
  };
}

/**
 * Load data for rendering content below the fold. This data is deferred and will be
 * fetched after the initial page load. If it's unavailable, the page should still 200.
 * Make sure to not throw any errors here, as it will cause the page to 500.
 * @param {LoaderFunctionArgs}
 */
function loadDeferredData({context, params}) {
  const {handle} = params;
  const {storefront} = context;

  // Put any API calls that is not critical to be available on first page render
  // For example: product reviews, product recommendations, social feeds.
  const recs = storefront.query(PRODUCT_RECOMENDATIONS_QUERY, {
    variables: {handle},
  });
  const compliments = storefront.query(COMPLEMENTARY_QUERY, {
    variables: {handle},
  });

  return {recs, compliments};
}

export default function Product() {
  /** @type {LoaderReturnData} */
  const [hoveredImg, setHoveredImg] = useState(null);
  const [cursorPos, setCursorPos] = useState({x: 0, y: 0});
  const [imgCursorPos, setImgCursorPos] = useState({x: 0, y: 0});
  const magnifierRef = useRef(null);
  const {product, recs, compliments} = useLoaderData();

  // Get the gender view context
  const genderView = useGenderView();

  const {isDev} = useRouteLoaderData('root');

  const selectedVariant = useOptimisticVariant(
    product.selectedOrFirstAvailableVariant,
    getAdjacentAndFirstAvailableVariants(product),
  );

  useSelectedOptionInUrlParam(selectedVariant.selectedOptions);

  const productOptions = getProductOptions({
    ...product,
    selectedOrFirstAvailableVariant: selectedVariant,
  });

  const {title, descriptionHtml} = product;

  // Parse gender-specific galleries from metafields
  const rawMetafields = Array.isArray(product.metafields)
    ? product.metafields
    : [];
  const metafields = rawMetafields.filter(Boolean);

  const mensGalleryMetafield = metafields.find(
    (m) => m.namespace === 'custom' && m.key === 'mens_gallery',
  );

  const womensGalleryMetafield = metafields.find(
    (m) => m.namespace === 'custom' && m.key === 'womens_gallery',
  );

  // Parse the gallery references (they should be file references)
  const mensGalleryRefs = mensGalleryMetafield?.references?.nodes || [];
  const womensGalleryRefs = womensGalleryMetafield?.references?.nodes || [];

  /**
   * Determine which images to show based on:
   * 1. Gender view context (from URL/sessionStorage)
   * 2. Available gender-specific galleries
   * 3. Fallback to default behavior
   */
  const getImagesToDisplay = () => {
    // If we have a gender view and corresponding gallery, use it
    if (genderView === 'mens' && mensGalleryRefs.length > 0) {
      // Convert metafield references to the same structure as product.images.edges
      return mensGalleryRefs.map((ref) => ({
        node: {
          id: ref.id,
          url: ref.image.url,
          altText: ref.image.altText,
          width: ref.image.width,
          height: ref.image.height,
        },
      }));
    }

    if (genderView === 'womens' && womensGalleryRefs.length > 0) {
      return womensGalleryRefs.map((ref) => ({
        node: {
          id: ref.id,
          url: ref.image.url,
          altText: ref.image.altText,
          width: ref.image.width,
          height: ref.image.height,
        },
      }));
    }

    // Fallback to default behavior (all images)
    return product.images.edges;
  };

  const imagesToDisplay = getImagesToDisplay();

  // Check if there's a matching image based on selected variant
  const isThereAMatchingImage = imagesToDisplay.find((img) =>
    selectedVariant.title
      .toLowerCase()
      .includes(img?.node?.altText?.toLowerCase()),
  );

  const filteredImages = imagesToDisplay.filter((i) => {
    if (!isThereAMatchingImage || !i?.node?.altText) return true;
    else
      return selectedVariant.title
        .toLowerCase()
        .includes(i?.node?.altText?.toLowerCase());
  });

  function handleHover(imgUrl, data) {
    if (isDev) {
      setHoveredImg(imgUrl);
      setImgCursorPos(data);
    }
  }

  function handleLeave() {
    if (isDev) {
      setHoveredImg(null);
      setImgCursorPos(null);
    }
  }

  const productImage = filteredImages.map((edge) => (
    <ProductImage
      key={edge.node.id}
      image={edge.node}
      onHover={handleHover}
      onLeave={handleLeave}
    />
  ));

  const hiddenImages = product.images.edges.map((edge) => (
    <ProductImage key={edge.node.id} image={edge.node} hidden={true} />
  ));

  const [openSection, setOpenSection] = useState(null);

  const toggleSection = (section) => {
    setOpenSection(openSection === section ? null : section);
  };

  const [imageIndex, setImageIndex] = useState(0);

  function handleScroll(scrollWidth, scrollLeft) {
    const widthOfAnImage = scrollWidth / filteredImages.length;
    const dividend = scrollLeft / widthOfAnImage;
    const rounded = parseFloat((scrollLeft / widthOfAnImage).toFixed(0));

    if (Math.abs(dividend - rounded) < 0.01) setImageIndex(rounded);
  }

  const mappedIndicators =
    filteredImages.length > 1
      ? filteredImages.map((e, i) => (
          <div
            key={e.node.id}
            className="circle"
            style={{
              background: 'var(--color-stroke-color)',
              opacity: i === imageIndex ? 1 : 0.33,
              height: '6px',
              width: '6px',
              borderRadius: '4px',
            }}
          ></div>
        ))
      : null;

  const storyMetafield = metafields.find(
    (m) => m.namespace === 'custom' && m.key === 'story',
  );

  const detailsMetafield = metafields.find(
    (m) => m.namespace === 'custom' && m.key === 'details',
  );

  const sustainabilityMetafield = metafields.find(
    (m) => m.namespace === 'custom' && m.key === 'sustainability',
  );

  const isFirstRender = useIsFirstRender();

  function resetScroll() {
    productImages.current.scrollTo({top: 0, left: 0, behavior: 'smooth'});
    window.scrollTo(0, 0);
  }

  const productImages = useRef(null);

  useEffect(() => {
    const container = productImages.current;
    if (!container || !isDev) return;

    function handleMouseMove(e) {
      const rect = container.getBoundingClientRect();
      setCursorPos({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    }

    container.addEventListener('mousemove', handleMouseMove);
    return () => container.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div>
      <div className="product">
        <div style={{position: 'relative'}}>
          {hiddenImages}
          {hoveredImg && isDev && (
            <Magnifier
              bg={hoveredImg}
              pos={cursorPos}
              imgPos={imgCursorPos}
              ref={magnifierRef}
            />
          )}
          <div
            className={`product-images ${isDev ? 'isDev' : ''}`}
            onScroll={(e) =>
              handleScroll(e.target.scrollWidth, e.target.scrollLeft)
            }
            ref={productImages}
          >
            {productImage}
          </div>
          <div className="mapped-indicators">{mappedIndicators}</div>
        </div>
        <div className="product-main">
          <p className={isDev ? 'product-title-pdp' : ''}>
            {title.toLowerCase()}
          </p>
          <ProductPrice
            price={selectedVariant?.price}
            compareAtPrice={selectedVariant?.compareAtPrice}
          />
          <div className="divider" />
          <ProductForm
            productOptions={productOptions}
            selectedVariant={selectedVariant}
            hideSizeGuide={
              product.tags?.includes('accessories') ||
              product.tags?.includes('living')
            }
            resetScroll={resetScroll}
          />
          <div className="divider" />
          <div dangerouslySetInnerHTML={{__html: descriptionHtml}} />
          <div className="divider" />

          <div className="dropdown-container">
            {[
              {
                title: 'story',
                details: storyMetafield?.value?.trim() || '',
              },

              {
                title: 'details',
                details:
                  detailsMetafield?.value?.trim() ||
                  'this product is made from high-quality materials and designed for durability.',
              },
              {
                title: 'sustainability',
                details:
                  sustainabilityMetafield?.value?.trim() ||
                  'we use eco-friendly materials and sustainable practices in our production.',
              },
            ].map((section) => {
              if (!section) return null;
              return (
                <Expandable
                  key={section.title}
                  openSection={openSection}
                  toggleSection={toggleSection}
                  title={section.title}
                  details={section.details}
                  isFirstRender={isFirstRender}
                />
              );
            })}
          </div>
          <motion.div className="divider" layout={!isFirstRender} />
        </div>
        <Analytics.ProductView
          data={{
            products: [
              {
                id: product.id,
                title: product.title,
                price: selectedVariant?.price.amount || '0',
                vendor: product.vendor,
                variantId: selectedVariant?.id || '',
                variantTitle: selectedVariant?.title || '',
                quantity: 1,
              },
            ],
          }}
        />
      </div>
      <YouMayAlsoLike recs={recs} compliments={compliments} />
    </div>
  );
}

const Magnifier = forwardRef(({bg, pos, imgPos}, ref) => {
  const zoom = 3; // how much to zoom

  const backgroundPosX = ((imgPos.x / imgPos.width) * 100).toFixed(2);
  const backgroundPosY = ((imgPos.y / imgPos.height) * 100).toFixed(2);
  return (
    <div
      ref={ref}
      className="magnify-glass"
      style={{
        backgroundImage: `url(${bg})`,
        backgroundRepeat: 'no-repeat',
        backgroundSize: `${imgPos.width * zoom}px ${imgPos.height * zoom}px`,
        backgroundPosition: `${backgroundPosX}% ${backgroundPosY}%`,
        left: `${pos.x}px`,
        top: `${pos.y}px`,
        transform: 'translate(-50%, -20%)',
      }}
    />
  );
});

function Expandable({
  openSection,
  toggleSection,
  title,
  details,
  isFirstRender,
}) {
  return (
    <motion.div
      key={title}
      className="dropdown"
      layout={!isFirstRender ? 'position' : false}
      initial={{height: '1rem'}}
      animate={{height: openSection === title ? 'auto' : '1rem'}}
      style={{overflow: 'hidden'}}
    >
      <motion.p
        layout={!isFirstRender ? 'position' : false}
        className={`dropdown-header ${openSection === title ? 'open' : ''}`}
        onClick={() => toggleSection(title)}
      >
        <span className="dropdown-title">{title}</span>
        <span className={`icon ${openSection === title ? 'open' : ''}`}>+</span>
      </motion.p>
      <div style={{overflow: 'hidden'}}>
        <motion.div
          className="dropdown-content"
          initial={{opacity: 0}}
          animate={{opacity: openSection === title ? 1 : 0}}
          key={title}
          transition={{ease: 'easeOut'}}
        >
          {details}
        </motion.div>
      </div>
    </motion.div>
  );
}

function YouMayAlsoLike({compliments, recs}) {
  const [resolvedCompliments, setResolvedCompliments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([compliments, recs])
      .then(([complimentsRes, recsRes]) => {
        const complimentsData = complimentsRes?.productRecommendations || [];
        const recsData = recsRes?.productRecommendations || [];

        const uniqueProducts = [
          ...new Map(
            [...complimentsData, ...recsData]
              .filter((p) => p?.id)
              .map((p) => [p.id, p]),
          ).values(),
        ].slice(0, 4);

        setResolvedCompliments(uniqueProducts);
      })
      .finally(() => setLoading(false));
  }, [compliments, recs]);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="you-may-also-like-container">
      <p className="recs-title">you may also like</p>
      <div className="recommended-products">
        <div className="products-grid">
          {resolvedCompliments.map((product, index) => (
            <ProductGridItem
              key={product.id}
              product={product}
              loading={index < 8 ? 'eager' : undefined}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

const PRODUCT_VARIANT_FRAGMENT = `#graphql
  fragment ProductVariant on ProductVariant {
    availableForSale
    compareAtPrice {
      amount
      currencyCode
    }
    id
    image {
      __typename
      id
      url
      altText
      width
      height
    }
    price {
      amount
      currencyCode
    }
    product {
      title
      handle
    }
    selectedOptions {
      name
      value
    }
    sku
    title
    unitPrice {
      amount
      currencyCode
    }
  }
`;

const PRODUCT_FRAGMENT = `#graphql
  fragment Product on Product {
    availableForSale
    id
    title
    vendor
    handle
    descriptionHtml
    description
    encodedVariantExistence
    encodedVariantAvailability
    options {
      name
      optionValues {
        name
        firstSelectableVariant {
          ...ProductVariant
        }
        swatch {
          color
          image {
            previewImage {
              url
            }
          }
        }
      }
    }
    tags
    images(first: 20) {
      edges {
        node {
          id
          url
          altText
          width
          height
        }
      }
    }
    metafields(identifiers: [
      {namespace: "custom", key: "story"},
      {namespace: "custom", key: "details"},
      {namespace: "custom", key: "sustainability"},
      {namespace: "custom", key: "mens_gallery"},
      {namespace: "custom", key: "womens_gallery"}
    ]) {
      key
      namespace
      value
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
    selectedOrFirstAvailableVariant(
      selectedOptions: $selectedOptions
      ignoreUnknownOptions: true
      caseInsensitiveMatch: true
    ) {
      ...ProductVariant
    }
    adjacentVariants(selectedOptions: $selectedOptions) {
      ...ProductVariant
    }
    seo {
      description
      title
    }
  }
  ${PRODUCT_VARIANT_FRAGMENT}
`;

const PRODUCT_QUERY = `#graphql
  query Product(
    $country: CountryCode
    $handle: String!
    $language: LanguageCode
    $selectedOptions: [SelectedOptionInput!]!
  ) @inContext(country: $country, language: $language) {
    product(handle: $handle) {
      ...Product
    }
  }
  ${PRODUCT_FRAGMENT}
`;

const PRODUCT_RECOMENDATIONS_QUERY = `#graphql
query MyQuery(
$country: CountryCode
$handle: String!
$language: LanguageCode
) @inContext(country: $country, language: $language) {
  productRecommendations(intent: RELATED, productHandle: $handle) {
    images(first: 2) {
      nodes {
        id
        url
        width
        height
        altText
      }
    }
    id
    handle
    title
    availableForSale
    priceRange {
      minVariantPrice {
        amount
        currencyCode
      }
    }
  }
}`;

const COMPLEMENTARY_QUERY = `#graphql
query MyQuery(
$country: CountryCode
$handle: String!
$language: LanguageCode
) @inContext(country: $country, language: $language) {
  productRecommendations(intent: COMPLEMENTARY, productHandle: $handle) {
    images(first: 2) {
      nodes {
        url
        width
        height
        altText
      }
    }
    id
    handle
    title
    availableForSale
    priceRange {
      minVariantPrice {
        amount
        currencyCode
      }
    }
  }
}`;
/** @typedef {import('@shopify/remix-oxygen').LoaderFunctionArgs} LoaderFunctionArgs */
/** @template T @typedef {import('@remix-run/react').MetaFunction<T>} MetaFunction */
/** @typedef {import('@shopify/remix-oxygen').SerializeFrom<typeof loader>} LoaderReturnData */
