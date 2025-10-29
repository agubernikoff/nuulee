import React from 'react';
import {Link} from '@remix-run/react';

function CollectionGridItem({collection}) {
  return (
    <Link
      className="product-item"
      key={collection._key}
      prefetch="intent"
      to={`/collections/${collection.handle}`}
    >
      <div className="product-item-img-container">
        <img
          src={collection.image.asset.url}
          alt={collection.title}
          style={{aspectRatio: '361/482'}}
        />
      </div>
      <div>
        <p>{collection.title.toLowerCase()}</p>
      </div>
    </Link>
  );
}

export default CollectionGridItem;
