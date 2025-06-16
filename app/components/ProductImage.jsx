import {Image} from '@shopify/hydrogen';

/**
 * @param {{
 *   image: ProductVariantFragment['image'];
 * }}
 */
export function ProductImage({image, hidden}) {
  if (!image) {
    return <div className="product-image" />;
  }
  return (
    <div
      className="product-image"
      style={{
        background: `center / cover no-repeat url("${image.url}&width=100")`,
        position: hidden ? 'absolute' : 'static',
        opacity: hidden ? 0 : 1,
        top: 0,
      }}
    >
      <Image
        alt={image.altText || 'Product Image'}
        // aspectRatio="1/1"
        data={image}
        key={image.id}
        sizes="(min-width: 45em) 50vw, 100vw"
        loading="eager"
      />
    </div>
  );
}

/** @typedef {import('storefrontapi.generated').ProductVariantFragment} ProductVariantFragment */
