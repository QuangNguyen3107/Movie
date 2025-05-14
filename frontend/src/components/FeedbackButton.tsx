import React, { useState } from 'react';
import { FaCommentAlt } from 'react-icons/fa';
import FeedbackForm from './FeedbackForm';

interface FeedbackButtonProps {
  user?: any; // Thay bằng kiểu User thực tế của bạn nếu có
  buttonClassName?: string;
  placement?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
}

/**
 * Component nút góp ý có thể được thêm vào bất kỳ trang nào
 */
const FeedbackButton: React.FC<FeedbackButtonProps> = ({ 
  user, 
  buttonClassName = '',
  placement = 'bottom-right'
}) => {
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Xác định vị trí nút dựa trên prop placement
  const getButtonPosition = () => {
    switch(placement) {
      case 'bottom-left':
        return 'left-4 bottom-4';
      case 'top-right':
        return 'right-4 top-4';
      case 'top-left':
        return 'left-4 top-4';
      case 'bottom-right':
      default:
        return 'right-4 bottom-4';
    }
  };

  return (
    <>
      

      {/* Form góp ý */}
      <FeedbackForm 
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        user={user}
      />
    </>
  );
};

export default FeedbackButton;