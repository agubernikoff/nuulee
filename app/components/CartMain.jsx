import {useOptimisticCart} from '@shopify/hydrogen';
import {Link} from '@remix-run/react';
import {useAside} from '~/components/Aside';
import {CartLineItem} from '~/components/CartLineItem';
import {CartSummary} from './CartSummary';

/**
 * The main cart component that displays the cart items and summary.
 * It is used by both the /cart route and the cart aside dialog.
 * @param {CartMainProps}
 */
export function CartMain({layout, cart: originalCart, isDev}) {
  const cart = useOptimisticCart(originalCart);

  const linesExist = cart?.lines?.nodes?.length > 0;
  const withDiscount = cart?.discountCodes?.some((code) => code.applicable);
  const className = `cart-main ${withDiscount ? 'with-discount' : ''}`;

  return (
    <div className={className}>
      {!linesExist && <CartEmpty layout={layout} />}

      {linesExist && layout === 'page' && (
        <div className="cart-details">
          {/* Left side: Items list with headers */}
          <div>
            {/* Column headers - Image + Item + Subtotal */}
            <div className="cart-dedicated-columns">
              <div>image</div>
              <div>item</div>
              <div style={{textAlign: 'right'}}>subtotal</div>
            </div>

            {/* Cart items */}
            <div aria-labelledby="cart-lines">
              <ul>
                {cart?.lines?.nodes.map((line) => (
                  <CartLineItem key={line.id} line={line} layout={layout} />
                ))}
              </ul>
            </div>
          </div>

          {/* Right side: Checkout section */}
          <div className="cart-dedicated-checkout-section">
            <div className="cart-dedicated-checkout-header">checkout</div>
            <CartSummary cart={cart} layout={layout} />
          </div>
        </div>
      )}

      {linesExist && layout === 'aside' && (
        <div className="cart-details">
          <div aria-labelledby="cart-lines">
            <ul>
              {cart?.lines?.nodes.map((line) => (
                <CartLineItem key={line.id} line={line} layout={layout} />
              ))}
            </ul>
          </div>
          <CartSummary cart={cart} layout={layout} />
        </div>
      )}
    </div>
  );
}

/**
 * @param {{
 *   hidden: boolean;
 *   layout?: CartMainProps['layout'];
 * }}
 */
function CartEmpty({hidden = false}) {
  const {close} = useAside();
  return (
    <div className="empty-cart-div" hidden={hidden}>
      <p className="empty-cart-message">your cart is empty.</p>
      {/* <Link to="/collections" onClick={close} prefetch="viewport">
        Continue shopping →
      </Link> */}
    </div>
  );
}

/** @typedef {'page' | 'aside'} CartLayout */
/**
 * @typedef {{
 *   cart: CartApiQueryFragment | null;
 *   layout: CartLayout;
 * }} CartMainProps
 */

/** @typedef {import('storefrontapi.generated').CartApiQueryFragment} CartApiQueryFragment */
