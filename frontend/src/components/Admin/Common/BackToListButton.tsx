import React from 'react';
import { useRouter } from 'next/router';
import { Button } from 'react-bootstrap';
import { FaArrowLeft } from 'react-icons/fa';

interface BackToListButtonProps {
  listPath?: string;
  className?: string;
  variant?: string;
}

/**
 * A reusable button component that navigates back to a list page
 * 
 * @param listPath - The path to navigate to (defaults to the previous page)
 * @param className - Additional CSS classes to apply to the button
 * @param variant - Bootstrap button variant (default: 'secondary')
 */
const BackToListButton: React.FC<BackToListButtonProps> = ({ 
  listPath,
  className = '',
  variant = 'secondary'
}) => {
  const router = useRouter();
  
  const handleClick = () => {
    if (listPath) {
      router.push(listPath);
    } else {
      router.back();
    }
  };

  return (
    <Button
      variant={variant}
      className={`d-flex align-items-center ${className}`}
      onClick={handleClick}
    >
      <FaArrowLeft className="me-2" /> Quay lại danh sách
    </Button>
  );
};

export default BackToListButton;