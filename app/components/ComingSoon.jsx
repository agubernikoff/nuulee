import React, {useState, useEffect} from 'react';
import {Image} from '@shopify/hydrogen';

function ComingSoon({comingsoon}) {
  const imageUrl = comingsoon?.metaobject?.field?.reference?.image?.url;
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 499);
    };

    checkMobile(); // Initial check
    window.addEventListener('resize', checkMobile); // Recheck on resize

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <div className="coming-soon-container">
      <div className="coming-soon-content">
        {isMobile ? (
          <>
            <div className="coming-soon-mobile-text">coming soon</div>
            {imageUrl && (
              <Image
                src={imageUrl}
                alt="Coming Soon"
                className="coming-soon-image-mobile"
              />
            )}
          </>
        ) : (
          <>
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
          </>
        )}
      </div>
    </div>
  );
}

export default ComingSoon;
