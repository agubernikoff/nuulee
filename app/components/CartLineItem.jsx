import {CartForm, Image} from '@shopify/hydrogen';
import {useVariantUrl} from '~/lib/variants';
import {Link} from '@remix-run/react';
import {ProductPrice} from './ProductPrice';
import {useAside} from './Aside';

/**
 * A single line item in the cart. It displays the product image, title, price.
 * It also provides controls to update the quantity or remove the line item.
 * @param {{
 *   layout: CartLayout;
 *   line: CartLine;
 * }}
 */
export function CartLineItem({layout, line}) {
  const {id, merchandise} = line;
  const {product, title, image, selectedOptions} = merchandise;
  const lineItemUrl = useVariantUrl(product.handle, selectedOptions);
  const {close} = useAside();

  if (!line || typeof line?.quantity === 'undefined') return null;
  const {id: lineId, quantity, isOptimistic} = line;
  const prevQuantity = Number(Math.max(0, quantity - 1).toFixed(0));
  const nextQuantity = Number((quantity + 1).toFixed(0));

  console.log(line);

  // Page layout (grid with image, item, and subtotal columns)
  if (layout === 'page') {
    return (
      <li key={id} className="cart-line">
        {/* Image column */}
        {image && (
          <Image
            alt={title}
            aspectRatio="1/1.5"
            data={image}
            height={300}
            loading="lazy"
            width={300}
          />
        )}

        {/* Item column (details only) */}
        <div className="cart-product-details">
          <div>
            <Link
              prefetch="intent"
              to={lineItemUrl}
              onClick={() => {
                if (layout === 'aside') {
                  close();
                }
              }}
            >
              <p style={{fontWeight: 'bold'}}>{product.title}</p>
            </Link>
            <div className="cart-middle-details">
              {selectedOptions.map((option) => (
                <p key={option.name}>
                  {option.name}: {option.value}
                </p>
              ))}
            </div>
            <CartLineQuantity line={line} />
          </div>
        </div>

        {/* Subtotal column (price + remove button) */}
        <div className="cart-line-subtotal-column">
          <ProductPrice price={line?.cost?.totalAmount} />
          <CartLineRemoveButton
            lineIds={[lineId]}
            disabled={!!isOptimistic}
            layout={layout}
          />
        </div>
      </li>
    );
  }

  // Aside layout (original vertical layout)
  return (
    <li key={id} className="cart-line">
      {image && (
        <Image
          alt={title}
          aspectRatio="1/1.5"
          data={image}
          height={300}
          loading="lazy"
          width={300}
        />
      )}

      <div className="cart-product-details">
        <div>
          <div style={{display: 'flex', justifyContent: 'space-between'}}>
            <Link
              prefetch="intent"
              to={lineItemUrl}
              onClick={() => {
                if (layout === 'aside') {
                  close();
                }
              }}
            >
              <p>{product.title}</p>
            </Link>
            <CartLineRemoveButton
              lineIds={[lineId]}
              disabled={!!isOptimistic}
              layout={layout}
            />
          </div>
          <ProductPrice price={line?.cost?.amountPerQuantity} />
          <div className="cart-middle-details">
            {selectedOptions.map((option) => (
              <p key={option.name}>
                <p>
                  {option.name}: {option.value}
                </p>
              </p>
            ))}
          </div>
          <CartLineQuantity line={line} />
        </div>

        {/* <CartLineRemoveButton lineIds={[lineId]} disabled={!!isOptimistic} /> */}
      </div>
    </li>
  );
}

/**
 * Provides the controls to update the quantity of a line item in the cart.
 * These controls are disabled when the line item is new, and the server
 * hasn't yet responded that it was successfully added to the cart.
 * @param {{line: CartLine}}
 */
function CartLineQuantity({line}) {
  if (!line || typeof line?.quantity === 'undefined') return null;
  const {id: lineId, quantity, isOptimistic} = line;
  const prevQuantity = Number(Math.max(0, quantity - 1).toFixed(0));
  const nextQuantity = Number((quantity + 1).toFixed(0));

  return (
    <div>
      <p style={{marginBottom: '5px'}}>qty:</p>
      <div className="cart-line-quantity">
        {/* <p>Quantity: {quantity} &nbsp;&nbsp;</p> */}
        <CartLineUpdateButton lines={[{id: lineId, quantity: nextQuantity}]}>
          <button
            aria-label="Increase quantity"
            name="increase-quantity"
            value={nextQuantity}
            disabled={!!isOptimistic}
          >
            <span>&#43;</span>
          </button>
        </CartLineUpdateButton>
        <p>{quantity}</p>
        <CartLineUpdateButton lines={[{id: lineId, quantity: prevQuantity}]}>
          <button
            aria-label="Decrease quantity"
            disabled={quantity <= 1 || !!isOptimistic}
            name="decrease-quantity"
            value={prevQuantity}
          >
            <span>&#8722; </span>
          </button>
        </CartLineUpdateButton>
      </div>
    </div>
  );
}

/**
 * A button that removes a line item from the cart. It is disabled
 * when the line item is new, and the server hasn't yet responded
 * that it was successfully added to the cart.
 * @param {{
 *   lineIds: string[];
 *   disabled: boolean;
 * }}
 */
function CartLineRemoveButton({lineIds, disabled, layout}) {
  return (
    <CartForm
      route="/cart"
      action={CartForm.ACTIONS.LinesRemove}
      inputs={{lineIds}}
    >
      <button
        disabled={disabled}
        type="submit"
        className="cart-line-remove-button"
      >
        remove{' '}
        {layout === 'aside' && (
          <svg
            width="10"
            height="8"
            viewBox="0 0 8.9 7.7"
            xmlns="http://www.w3.org/2000/svg"
          >
            <line
              x1="-3"
              y1="-4"
              x2="10"
              y2="10"
              stroke="black"
              strokeWidth="1"
            />
            <line
              x1="-3"
              y1="12"
              x2="10"
              y2="-2"
              stroke="black"
              strokeWidth="1"
            />
          </svg>
        )}
      </button>
    </CartForm>
  );
}

/**
 * @param {{
 *   children: React.ReactNode;
 *   lines: CartLineUpdateInput[];
 * }}
 */
function CartLineUpdateButton({children, lines}) {
  return (
    <CartForm
      route="/cart"
      action={CartForm.ACTIONS.LinesUpdate}
      inputs={{lines}}
    >
      {children}
    </CartForm>
  );
}

/** @typedef {OptimisticCartLine<CartApiQueryFragment>} CartLine */

/** @typedef {import('@shopify/hydrogen/storefront-api-types').CartLineUpdateInput} CartLineUpdateInput */
/** @typedef {import('~/components/CartMain').CartLayout} CartLayout */
/** @typedef {import('@shopify/hydrogen').OptimisticCartLine} OptimisticCartLine */
/** @typedef {import('storefrontapi.generated').CartApiQueryFragment} CartApiQueryFragment */
