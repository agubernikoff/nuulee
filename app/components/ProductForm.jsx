import {useState} from 'react';
import {Link, useNavigate, useLocation} from '@remix-run/react';
import {AddToCartButton} from './AddToCartButton';
import {useAside} from './Aside';
import {AnimatePresence, motion} from 'motion/react';

/**
 * @param {{
 *   productOptions: MappedProductOptions[];
 *   selectedVariant: ProductFragment['selectedOrFirstAvailableVariant'];
 * }}
 */
export function ProductForm({productOptions, selectedVariant}) {
  const navigate = useNavigate();
  const {open} = useAside();
  const location = useLocation();

  const getQueryParams = () => {
    const params = new URLSearchParams(location.search);
    const selectedOptions = {};
    productOptions.forEach((option) => {
      const selectedValue = params.get(option.name);
      if (selectedValue) {
        selectedOptions[option.name] = selectedValue;
      } else if (option.optionValues.length > 0) {
        selectedOptions[option.name] = option.optionValues[0].name;
      }
    });
    return selectedOptions;
  };
  const [selectedOptions, setSelectedOptions] = useState(() =>
    getQueryParams(),
  );

  const handleOptionChange = (optionName, value) => {
    setSelectedOptions((prev) => ({
      ...prev,
      [optionName]: value,
    }));
    const newParams = new URLSearchParams(location.search);
    newParams.set(optionName.toLowerCase(), value);
    navigate(`?${newParams.toString()}`, {replace: true});
  };

  function formatSize(abbr, optionName) {
    if (optionName !== 'Size') return abbr;
    switch (abbr) {
      case 'os':
        return 'one size fits all';
      case 'xs':
        return 'extra small';
      case 's':
        return 'small';
      case 'm':
        return 'medium';
      case 'l':
        return 'large';
      case 'xl':
        return 'extra large';
      case 'xxl':
        return 'extra extra large';
    }
  }

  return (
    <div className="product-form">
      {productOptions.map((option) => {
        return (
          <div className="product-options" key={option.name}>
            <div className="product-options-title-container">
              <p className="product-options-title">
                {option.name.toLowerCase()}:{' '}
                <AnimatePresence mode="popLayout">
                  <motion.span
                    key={`${selectedOptions[option.name]}`}
                    initial={false}
                    animate={{opacity: 1}}
                    exit={{opacity: 0}}
                    style={{display: 'inline-block', width: '10rem'}}
                  >
                    {formatSize(
                      selectedOptions[option.name]?.toLowerCase(),
                      option.name,
                    )}
                  </motion.span>
                </AnimatePresence>
              </p>
              {option.name === 'Size' ? (
                <button onClick={() => open('size-guide')}>size guide</button>
              ) : null}
            </div>

            <div className="product-options-grid">
              {option.optionValues.map((value) => {
                const {
                  name,
                  handle,
                  variantUriQuery,
                  selected,
                  available,
                  exists,
                  isDifferentProduct,
                  swatch,
                } = value;

                const onClickHandler = () => {
                  handleOptionChange(option.name, value.name);
                  if (!selected) {
                    navigate(`?${variantUriQuery}`, {
                      replace: true,
                      preventScrollReset: true,
                    });
                  }
                };

                if (isDifferentProduct) {
                  return (
                    <Link
                      className="product-options-item"
                      key={option.name + name}
                      prefetch="intent"
                      preventScrollReset
                      replace
                      to={`/products/${handle}?${variantUriQuery}`}
                      style={{
                        border: selected
                          ? '1px solid black'
                          : '1px solid transparent',
                        opacity: available ? 1 : 0.3,
                      }}
                    >
                      <ProductOptionSwatch swatch={swatch} name={name} />
                    </Link>
                  );
                } else {
                  return (
                    <button
                      type="button"
                      className={`product-options-item${
                        exists && !selected ? ' link' : ''
                      }`}
                      key={option.name + name}
                      style={{
                        border: selected
                          ? '1px solid black'
                          : '1px solid transparent',
                        opacity: available ? 1 : 0.3,
                        textDecoration: selected ? 'underline' : 'none',
                      }}
                      disabled={!exists}
                      onClick={onClickHandler}
                    >
                      <ProductOptionSwatch swatch={swatch} name={name} />
                    </button>
                  );
                }
              })}
            </div>
            <div className="divider" />
          </div>
        );
      })}
      <AddToCartButton
        disabled={!selectedVariant || !selectedVariant.availableForSale}
        onClick={() => {
          open('cart');
        }}
        lines={
          selectedVariant
            ? [
                {
                  merchandiseId: selectedVariant.id,
                  quantity: 1,
                  selectedVariant,
                },
              ]
            : []
        }
      >
        {selectedVariant?.availableForSale ? 'add to bag' : 'sold out'}
      </AddToCartButton>
    </div>
  );
}

function ProductOptionSwatch({swatch, name}) {
  const image = swatch?.image?.previewImage?.url;
  const color = swatch?.color;

  if (!image && !color) return name.toLowerCase();

  return (
    <div
      aria-label={name}
      className="product-option-label-swatch"
      style={{
        backgroundColor: color || 'transparent',
      }}
    >
      {!!image && <img src={image} alt={name} />}
    </div>
  );
}
