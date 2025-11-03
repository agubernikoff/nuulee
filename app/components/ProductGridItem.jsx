import React, {useState} from 'react';
import {useVariantUrl} from '~/lib/variants';
import {Link, useLocation} from '@remix-run/react';
import {Image, Money} from '@shopify/hydrogen';
import {motion, AnimatePresence} from 'motion/react';

function ProductGridItem({product, productUrl, loading, collectionHandle}) {
  const [image, setImage] = useState(product?.images?.nodes[0]);
  const [hovered, setHovered] = useState(false);
  const variantUrl = useVariantUrl(product.handle);
  const location = useLocation();

  // Determine view parameter based on collection
  const getViewParam = () => {
    // If we have an explicit collectionHandle prop, use that
    if (collectionHandle) {
      const handle = collectionHandle.toLowerCase();
      if (handle.includes('women')) return 'womens';
      if (handle.includes('men') && !handle.includes('women')) return 'mens';
    }

    // Otherwise try to detect from current pathname
    const pathname = location.pathname.toLowerCase();
    if (pathname.includes('/collections/')) {
      if (pathname.includes('women')) return 'womens';
      if (pathname.includes('men') && !pathname.includes('women'))
        return 'mens';
    }

    return null;
  };

  // Build the product URL with view parameter
  const buildProductUrl = () => {
    const baseUrl = productUrl || variantUrl;
    const viewParam = getViewParam();

    if (!viewParam) return baseUrl;

    // Check if URL already has parameters
    const separator = baseUrl.includes('?') ? '&' : '?';
    return `${baseUrl}${separator}view=${viewParam}`;
  };

  const finalUrl = buildProductUrl();

  return (
    <Link
      className="product-item"
      key={product.id}
      prefetch="intent"
      to={finalUrl}
    >
      {product?.images?.nodes.slice(0, 2).map((n) => (
        <div className="product-item-img-container" key={n.id}>
          <Image
            alt={n.altText || product.title}
            aspectRatio="361/482"
            data={n}
            loading={'eager'}
            sizes="(min-width: 45em) 400px, 100vw"
          />
        </div>
      ))}
      <AnimatePresence mode="popLayout">
        <div className="product-item-title-price">
          <p>{product.title.toLowerCase()}</p>
          {product.availableForSale ? (
            <Money
              data={product.priceRange.minVariantPrice}
              withoutTrailingZeros
            />
          ) : (
            <div style={{color: 'rgb(177, 177, 177)'}}>sold out</div>
          )}
        </div>
      </AnimatePresence>
    </Link>
  );
}

export default ProductGridItem;
