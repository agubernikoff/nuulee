import React, {useState} from 'react';
import {useVariantUrl} from '~/lib/variants';
import {Link} from '@remix-run/react';
import {Image, Money} from '@shopify/hydrogen';
import {motion, AnimatePresence} from 'motion/react';

function ProductGridItem({product, loading}) {
  const [image, setImage] = useState(product?.images?.nodes[0]);
  const [hovered, setHovered] = useState(false);
  const variantUrl = useVariantUrl(product.handle);

  return (
    <Link
      className="product-item"
      key={product.id}
      prefetch="intent"
      to={variantUrl}
      onMouseEnter={() => {
        setHovered(true);
        if (product.images.nodes.length > 1) setImage(product.images.nodes[1]);
      }}
      onMouseLeave={() => {
        setHovered(false);
        setImage(product.images.nodes[0]);
      }}
    >
      <AnimatePresence mode="popLayout">
        <motion.div
          key={image.id}
          initial={{opacity: 1}}
          animate={{opacity: 1}}
          exit={{opacity: 0}}
          transition={{duration: 1}}
        >
          <Image
            alt={image.altText || product.title}
            aspectRatio="361/482"
            data={image}
            loading={'eager'}
            sizes="(min-width: 45em) 400px, 100vw"
          />
        </motion.div>
        <div style={{display: 'none'}}>
          <Image
            alt={product.images.nodes[1]?.altText || product.title}
            aspectRatio="361/482"
            data={product.images.nodes[1]}
            loading={'eager'}
            sizes="(min-width: 45em) 400px, 100vw"
          />
        </div>
        <motion.div
          initial={{opacity: 0}}
          animate={{
            opacity: hovered ? 1 : 0,
          }}
          exit={{opacity: 0}}
          transition={{ease: 'linear'}}
        >
          <p>{product.title.toLowerCase()}</p>
          <Money
            data={product.priceRange.minVariantPrice}
            withoutCurrency
            withoutTrailingZeros
          />
        </motion.div>
      </AnimatePresence>
    </Link>
  );
}

export default ProductGridItem;
