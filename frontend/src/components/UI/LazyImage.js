// src/components/UI/LazyImage.js - Optimized Image Component
import { useState } from 'react';
import Image from 'next/image';
import useIntersectionObserver from '../../hooks/useIntersectionObserver';

const LazyImage = ({ 
  src, 
  alt, 
  width, 
  height, 
  className = '',
  priority = false,
  objectFit = 'cover',
  quality = 75,
  placeholder = 'blur',
  blurDataURL = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9IiMxYTFhMWEiLz48L3N2Zz4='
}) => {
  const { targetRef, hasIntersected } = useIntersectionObserver();
  const [hasError, setHasError] = useState(false);

  // Fallback image nếu load error
  const fallbackSrc = '/img/placeholder.png';

  if (priority) {
    return (
      <Image
        src={hasError ? fallbackSrc : src}
        alt={alt}
        width={width}
        height={height}
        className={className}
        priority={true}
        quality={quality}
        style={{ objectFit }}
        onError={() => setHasError(true)}
      />
    );
  }

  return (
    <div ref={targetRef} style={{ minHeight: height || '200px' }}>
      {hasIntersected && (
        <Image
          src={hasError ? fallbackSrc : src}
          alt={alt}
          width={width}
          height={height}
          className={className}
          quality={quality}
          loading="lazy"
          placeholder={placeholder}
          blurDataURL={blurDataURL}
          style={{ objectFit }}
          onError={() => setHasError(true)}
        />
      )}
    </div>
  );
};

export default LazyImage;
