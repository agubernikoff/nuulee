import React, {useState} from 'react';
import {useVariantUrl} from '~/lib/variants';
import {Link} from '@remix-run/react';
import {Image, Money} from '@shopify/hydrogen';
import {motion, AnimatePresence} from 'motion/react';

function ProductGridItem({product, productUrl, loading}) {
  const [image, setImage] = useState(product?.images?.nodes[0]);
  const [hovered, setHovered] = useState(false);
  const variantUrl = useVariantUrl(product.handle);
  console.log(product.availableForSale);

  return (
    <Link
      className="product-item"
      key={product.id}
      prefetch="intent"
      to={productUrl || variantUrl}
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
