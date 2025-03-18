import {Money} from '@shopify/hydrogen';

/**
 * @param {{
 *   price?: MoneyV2;
 *   compareAtPrice?: MoneyV2 | null;
 * }}
 */
export function ProductPrice({price, compareAtPrice}) {
  const formatPrice = (money) => {
    if (!money || !money.amount) return null;

    const amount = parseFloat(money.amount);

    return amount % 1 === 0 ? `$${amount.toFixed(0)}` : `$${amount.toFixed(2)}`;
  };

  return (
    <div className="product-price">
      {compareAtPrice ? (
        <div className="product-price-on-sale">
          {price ? <span>{formatPrice(price)}</span> : null}
          <s>{formatPrice(compareAtPrice)}</s>
        </div>
      ) : price ? (
        <span>{formatPrice(price)}</span>
      ) : (
        <span>&nbsp;</span>
      )}
    </div>
  );
}

/** @typedef {import('@shopify/hydrogen/storefront-api-types').MoneyV2} MoneyV2 */
