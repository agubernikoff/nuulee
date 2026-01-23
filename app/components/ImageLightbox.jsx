import {Image} from '@shopify/hydrogen';
import {useEffect, useRef, useState} from 'react';
import {createPortal} from 'react-dom';

/**
 * Full-screen image lightbox modal
 * - Desktop: Vertical scroll gallery, scrolls to selected image
 * - Mobile: Only shows the selected image
 */
export function ImageLightbox({images, selectedIndex, isOpen, onClose}) {
  const galleryRef = useRef(null);
  const [isMobile, setIsMobile] = useState(false);
  const [activeIndex, setActiveIndex] = useState(selectedIndex);

  // Detect mobile
  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 500px)');
    const handleChange = (e) => setIsMobile(e.matches);
    handleChange(mediaQuery);
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Reset active index when opening
  useEffect(() => {
    if (isOpen) {
      setActiveIndex(selectedIndex);
    }
  }, [isOpen, selectedIndex]);

  // Scroll to selected image on open (desktop only)
  useEffect(() => {
    if (isOpen && galleryRef.current && !isMobile && selectedIndex > 0) {
      const imageElements = galleryRef.current.querySelectorAll('.lightbox-image');
      if (imageElements[selectedIndex]) {
        imageElements[selectedIndex].scrollIntoView({behavior: 'instant'});
      }
    }
  }, [isOpen, selectedIndex, isMobile]);

  // Track which image is in view using IntersectionObserver
  useEffect(() => {
    if (!isOpen || isMobile || !galleryRef.current) return;

    const imageElements = galleryRef.current.querySelectorAll('.lightbox-image');

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
            const index = Array.from(imageElements).indexOf(entry.target);
            if (index !== -1) {
              setActiveIndex(index);
            }
          }
        });
      },
      {
        root: galleryRef.current,
        threshold: 0.5,
      }
    );

    imageElements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, [isOpen, isMobile, images]);

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        onClose();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // On mobile, only show the selected image
  const imagesToRender = isMobile ? [images[selectedIndex]] : images;

  function scrollToImage(index) {
    if (galleryRef.current) {
      const imageElements = galleryRef.current.querySelectorAll('.lightbox-image');
      if (imageElements[index]) {
        imageElements[index].scrollIntoView({behavior: 'smooth'});
      }
    }
  }

  const content = (
    <div className="lightbox-overlay" onClick={onClose}>
      {!isMobile && images.length > 1 && (
        <div className="lightbox-indicators">
          {images.map((_, index) => (
            <button
              key={index}
              className={`lightbox-pill ${index === activeIndex ? 'active' : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                scrollToImage(index);
              }}
              aria-label={`Go to image ${index + 1}`}
            />
          ))}
        </div>
      )}
      <button className="lightbox-close" onClick={onClose} aria-label="Close">
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          xmlns="http://www.w3.org/2000/svg"
        >
          <line x1="2" y1="2" x2="18" y2="18" stroke="white" strokeWidth="2" />
          <line x1="18" y1="2" x2="2" y2="18" stroke="white" strokeWidth="2" />
        </svg>
      </button>
      <div
        className="lightbox-gallery"
        ref={galleryRef}
        onClick={(e) => e.stopPropagation()}
      >
        {imagesToRender.map((image, index) => (
          <div key={image.node?.id || index} className="lightbox-image">
            <Image
              alt={image.node?.altText || 'Product Image'}
              data={image.node}
              sizes="100vw"
              loading="eager"
            />
          </div>
        ))}
      </div>
    </div>
  );

  // Use portal to render at document root
  if (typeof document !== 'undefined') {
    return createPortal(content, document.body);
  }

  return content;
}
