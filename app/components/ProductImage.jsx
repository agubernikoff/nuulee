import {Image} from '@shopify/hydrogen';
import {useRef} from 'react';

/**
 * @param {{
 *   image: ProductVariantFragment['image'];
 * }}
 */
export function ProductImage({image, hidden, onHover, onLeave, onClick}) {
  if (!image) {
    return <div className="product-image" />;
  }
  const ref = useRef(null);

  function handleMouseMove(e) {
    const rect = ref.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // send image, cursor position, and rect size up to parent
    onHover(image.url, {x, y, width: rect.width, height: rect.height});
  }

  return (
    <div
      className="product-image"
      style={{
        background: `center / cover no-repeat url("${image.url}&width=100")`,
        position: hidden ? 'absolute' : 'static',
        opacity: hidden ? 0 : 1,
        top: 0,
        zIndex: hidden ? '-1' : 0,
        cursor: onClick ? 'zoom-in' : 'default',
      }}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseMove}
      onMouseLeave={onLeave}
      onClick={onClick}
      ref={ref}
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
