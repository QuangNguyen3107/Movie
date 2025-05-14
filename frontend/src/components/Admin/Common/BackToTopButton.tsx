import React from 'react';
import { Button } from 'react-bootstrap';
import { FaArrowUp } from 'react-icons/fa';

interface BackToTopButtonProps {
  className?: string;
  variant?: string;
  onClick?: () => void;
}

/**
 * A button that scrolls back to the top of the page
 */
const BackToTopButton: React.FC<BackToTopButtonProps> = ({
  className = '',
  variant = 'primary',
  onClick
}) => {
  const handleClick = () => {
    // Scroll to top of page
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
    
    // Call additional onClick handler if provided
    if (onClick) {
      onClick();
    }
  };

  return (
    <Button
      variant={variant}
      className={`d-flex align-items-center ${className}`}
      onClick={handleClick}
    >
      <FaArrowUp className="me-2" /> Về đầu trang
    </Button>
  );
};

export default BackToTopButton;