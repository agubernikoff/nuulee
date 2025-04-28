import React from 'react';
import {Image} from '@shopify/hydrogen'; // Import the Shopify Image component

function ComingSoon({comingsoon}) {
  const imageUrl = comingsoon?.metaobject?.field?.reference?.image?.url;

  return (
    <div className="coming-soon-container">
      <div className="coming-soon-content">
        <span className="coming-text">coming</span>
        {imageUrl && (
          <Image
            src={imageUrl}
            alt="Coming Soon"
            width={450}
            className="coming-soon-image"
          />
        )}
        <span className="soon-text">soon</span>
      </div>
    </div>
  );
}

export default ComingSoon;
