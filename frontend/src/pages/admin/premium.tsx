'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import AdminRoute from '../../components/ProtectedRoute/AdminRoute';
import { FaCheck, FaTimes, FaEye, FaStar, FaUser, FaFilm, FaClock, FaSync, FaCrown, FaMoneyBillWave, FaCheckCircle, FaTimesCircle, FaHourglassHalf } from 'react-icons/fa';
import styles from '@/styles/AdminDashboard.module.css';
import { useTheme } from 'next-themes';
import axios from '@/API/config/axiosConfig';
import { useRouter } from 'next/router';
import { toast } from 'react-toastify';
import dayjs from 'dayjs';
import 'dayjs/locale/vi';
import AdminLayout from '@/components/Layout/AdminLayout';
import Head from 'next/head';

// Set Vietnamese locale for dayjs
dayjs.locale('vi');

// Interface for subscription data from API
interface SubscriptionUser {
  id: string;
  name: string;
  avatar: string;
  email: string;
}

interface SubscriptionPackage {
  id: string;
  name: string;
  price: number;
  durationDays: number;
  discount?: number;
}

interface Subscription {
  id: string;
  user: SubscriptionUser;
  packageId: SubscriptionPackage;
  startDate: string;
  endDate: string;
  paymentMethod: string;
  paymentStatus: 'pending' | 'approved' | 'rejected' | 'active' | 'cancelled';
  amount: number;
  createdAt: string;
}

// Component for displaying individual subscription requests
const SubscriptionItem: React.FC<{
  subscription: Subscription;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onViewUserDetails: (userId: string) => void;
  onCancel: (id: string) => void;
}> = ({ subscription, onApprove, onReject, onViewUserDetails, onCancel }) => {
  // Format the request date nicely
  const formattedDate = dayjs(subscription.createdAt).format('DD/MM/YYYY HH:mm');
  const formattedStartDate = dayjs(subscription.startDate).format('DD/MM/YYYY');
  const formattedEndDate = dayjs(subscription.endDate).format('DD/MM/YYYY');
  
  // Calculate discount price if applicable
  const finalPrice = subscription.packageId.discount 
    ? subscription.packageId.price * (1 - subscription.packageId.discount / 100) 
    : subscription.packageId.price;

  // Xác định trạng thái đăng ký
  const isPending = subscription.paymentStatus === 'pending';
  const isApproved = subscription.paymentStatus === 'approved' || subscription.paymentStatus === 'active';
  const isRejected = subscription.paymentStatus === 'rejected';
  const isCancelled = subscription.paymentStatus === 'cancelled';

  // Hiển thị trạng thái phù hợp
  const getStatusBadge = () => {
    if (isApproved) return <span className="badge bg-success">Đã duyệt</span>;
    if (isRejected) return <span className="badge bg-danger">Đã từ chối</span>;
    if (isCancelled) return <span className="badge bg-secondary">Đã hủy</span>;
    return <span className="badge bg-warning">Chờ duyệt</span>;
  };

  return (
    <div className="card mb-3">
      <div className="card-header">
        <div className="d-flex align-items-center">
          <img 
            src={subscription.user.avatar || 'http://localhost:3000/img/user-avatar.png'} 
            alt={subscription.user.name}
            className="rounded-circle mr-2"
            style={{ width: '40px', height: '40px', objectFit: 'cover' }}
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'http://localhost:3000/img/user-avatar.png';
            }}
          />
          <div>
            <h5 className="mb-0">
              <FaUser className="mr-1" />
              {subscription.user.name}
            </h5>
            {subscription.user.email && <small className="text-muted">{subscription.user.email}</small>}
          </div>
          <div className="ml-auto">
            <FaClock className="mr-1" />
            {formattedDate} {getStatusBadge()}
          </div>
        </div>
      </div>
      
      <div className="card-body">
        <div className="d-flex mb-3">
          <div className="package-icon mr-3">
            <FaCrown style={{ fontSize: '48px', color: '#ffc107' }} />
          </div>
          <div>
            <h5>
              <FaCrown className="mr-1" style={{ color: '#ffc107' }} />
              {subscription.packageId.name}
            </h5>
            <div className="subscription-details">
              <p className="mb-1">
                <strong>Thời hạn:</strong> {subscription.packageId.durationDays} ngày
                ({formattedStartDate} - {formattedEndDate})
              </p>
              <p className="mb-1">
                <strong>Phương thức thanh toán:</strong> {
                  subscription.paymentMethod === 'credit_card' ? 'Thẻ tín dụng' :
                  subscription.paymentMethod === 'bank_transfer' ? 'Chuyển khoản' :
                  subscription.paymentMethod === 'momo' ? 'Ví MoMo' :
                  subscription.paymentMethod === 'zalopay' ? 'ZaloPay' :
                  subscription.paymentMethod
                }
              </p>
              <p className="mb-0">
                <FaMoneyBillWave className="mr-1" style={{ color: '#28a745' }} />
                <strong>Số tiền:</strong> 
                <span className="amount-display ml-1">
                  {new Intl.NumberFormat('vi-VN', {
                    style: 'currency',
                    currency: 'VND'
                  }).format(subscription.amount || finalPrice)}
                </span>
                
                {subscription.packageId.discount && subscription.packageId.discount > 0 && (
                  <span className="original-price ml-2">
                    <del>
                      {new Intl.NumberFormat('vi-VN', {
                        style: 'currency',
                        currency: 'VND'
                      }).format(subscription.packageId.price)}
                    </del>
                    <span className="discount-badge ml-1">-{subscription.packageId.discount}%</span>
                  </span>
                )}
              </p>
            </div>
            <button 
              className="btn btn-sm btn-info mt-2"
              onClick={() => onViewUserDetails(subscription.user.id)}
            >
              <FaEye className="mr-1" /> Xem thông tin người dùng
            </button>
          </div>
        </div>
        
        <div className="d-flex justify-content-end">
          {/* Chỉ hiển thị các nút duyệt/từ chối khi đăng ký đang ở trạng thái chờ duyệt */}
          {isPending ? (
            <>
              <button 
                className="btn btn-success mr-2"
                onClick={() => onApprove(subscription.id)}
              >
                <FaCheck className="mr-1" /> Duyệt
              </button>
              <button 
                className="btn btn-danger"
                onClick={() => onReject(subscription.id)}
              >
                <FaTimes className="mr-1" /> Từ chối
              </button>
            </>
          ) : (
            // Hiển thị trạng thái đã duyệt/từ chối
            <div className="d-flex align-items-center">
              {isApproved && (
                <>
                  <span className="text-success mr-3"><FaCheckCircle /> Đã duyệt</span>
                  <button 
                    className="btn btn-warning btn-sm"
                    onClick={() => onCancel(subscription.id)}
                    title="Hủy gói Premium cho người dùng này"
                  >
                    <FaTimes className="mr-1" /> Hủy gói
                  </button>
                </>
              )}
              {isRejected && <span className="text-danger"><FaTimesCircle /> Đã từ chối</span>}
            </div>
          )}
        </div>
      </div>
      
      <style jsx>{`
        .package-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 80px;
          height: 80px;
          background: rgba(255, 193, 7, 0.1);
          border-radius: 8px;
        }
        
        .subscription-details {
          background: rgba(0, 0, 0, 0.05);
          padding: 10px;
          border-radius: 8px;
          margin-top: 5px;
        }
        
        .amount-display {
          color: #28a745;
          font-weight: bold;
        }
        
        .original-price {
          font-size: 90%;
          color: #6c757d;
        }
        
        .discount-badge {
          background: #dc3545;
          color: white;
          padding: 2px 5px;
          border-radius: 4px;
          font-size: 75%;
        }
        
        .badge {
          font-size: 80%;
          padding: 0.25em 0.6em;
          border-radius: 50rem;
          margin-left: 0.5rem;
        }
        
        .bg-success {
          background-color: #28a745;
          color: white;
        }
        
        .bg-danger {
          background-color: #dc3545;
          color: white;
        }
        
        .bg-warning {
          background-color: #ffc107;
          color: #212529;
        }
      `}</style>
    </div>
  );
};

interface AdminPremiumPageProps {}

// Add type for the component with getLayout property
type NextPageWithLayout<P = {}, IP = P> = React.FC<P> & {
  getLayout?: (page: React.ReactElement) => React.ReactNode
};

const AdminPremiumPage: NextPageWithLayout<AdminPremiumPageProps> = () => {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [tokenInfo, setTokenInfo] = useState<any>(null);
  const [actionInProgress, setActionInProgress] = useState(false);
  const [processingId, setProcessingId] = useState<string>('');
  const [userDetailModal, setUserDetailModal] = useState<{ show: boolean; user: any }>({ show: false, user: null });
  const router = useRouter();
  const { theme } = useTheme();
  
  // Function to handle relogin when token expires
  const handleReLogin = useCallback(() => {
    // Clear old tokens
    localStorage.removeItem('authToken');
    localStorage.removeItem('auth_token');
    localStorage.removeItem('token');
    
    // Redirect to login page
    router.push('/auth/login?redirect=/admin/premium');
  }, [router]);
  
  // Debug function to check token
  useEffect(() => {
    // Check for token in localStorage
    const authToken = localStorage.getItem('authToken');
    const token = localStorage.getItem('token');
    const auth_token = localStorage.getItem('auth_token');
    
    // Auto copy token from authToken to auth_token to ensure Axios can use it
    if (authToken && !auth_token) {
      localStorage.setItem('auth_token', authToken);
      console.log('Copied token from authToken to auth_token');
    }
    
    console.log('Debug Token Info:', {
      authToken: authToken ? 'Exists' : 'Not found',
      token: token ? 'Exists' : 'Not found',
      auth_token: auth_token ? 'Exists' : 'Not found'
    });
    
    // Create test request
    const testAPI = async () => {
      try {
        // Add token directly to header for testing
        const testToken = authToken || token || auth_token;
        if (testToken) {
          // Save token info for display
          setTokenInfo({
            token: testToken.substring(0, 20) + '...',
            exists: true,
          });
            // Try to send test request with token
          const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
          const testResponse = await fetch(`${baseUrl}/subscription/admin/pending-subscriptions`, {
            headers: {
              'Authorization': `Bearer ${testToken}`
            }
          });
          
          const data = await testResponse.text();
          console.log('Test API Response:', {
            status: testResponse.status,
            ok: testResponse.ok,
            data: data.substring(0, 100) + '...'
          });
          
          // Check if token is expired
          if (testResponse.status === 401) {
            setTokenInfo((prev: any) => prev ? {...prev, expired: true} : {expired: true});
          }
        } else {
          setTokenInfo({
            exists: false,
            message: 'No token found in localStorage'
          });
        }
      } catch (err) {
        console.error('Test API Error:', err);
      }
    };
    
    testAPI();
  }, []);
  
  // Function to fetch subscriptions based on the active tab
  const fetchSubscriptions = async (tab: string) => {
    setLoading(true);
    setError(null); // Clear any previous errors
    try {
      let endpoint = '';
      let statusFilter = '';
      
      // Map tab to the correct endpoint
      if (tab === 'pending') {
        endpoint = '/api/subscription/admin/pending-subscriptions';
      } else {
        // For approved and rejected, we'll use the main subscription endpoint with status filter
        endpoint = '/api/subscription/admin/subscriptions';
        
        // Add filter for the right status
        if (tab === 'approved') {
          statusFilter = '?status=active,approved'; // Bao gồm cả 'active' và 'approved'
        } else if (tab === 'rejected') {
          statusFilter = '?status=rejected';
        }
      }
      
      console.log(`Fetching subscriptions from endpoint: ${endpoint}${statusFilter}`);
      
      // Direct fetch for debugging
      const testToken = localStorage.getItem('authToken') || localStorage.getItem('auth_token');
      if (!testToken) {
        throw new Error('No authentication token found');
      }
      
      // Hiển thị thông báo đang tải
      const toastId = toast.loading('Đang tải dữ liệu...', {
        autoClose: false,
        closeOnClick: false,
        closeButton: false,
        draggable: false
      });
        // Use direct fetch for debugging purposes
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
      const response = await fetch(`${baseUrl.replace('/api', '')}${endpoint}${statusFilter}`, {
        headers: {
          'Authorization': `Bearer ${testToken}`
        }
      });
      
      // Ẩn toast loading
      toast.dismiss(toastId);
      
      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}: ${response.statusText}`);
      }
      
      // Convert response to JSON directly
      const responseData = await response.json();
      
      console.log('API Response:', responseData);
      
      // Hiển thị dữ liệu chi tiết để debug
      console.log('Cấu trúc dữ liệu:', JSON.stringify(responseData.data, null, 2));
      
      // Kiểm tra success hoặc statusCode thành công (200) 
      const isSuccess = responseData.success || responseData.statusCode === 200;
      
      if (isSuccess) {
        let subscriptionList = [];
        
        // Xử lý các cấu trúc response khác nhau
        if (responseData.data?.subscriptions) {
          subscriptionList = responseData.data.subscriptions;
          console.log('Found subscriptions in data.subscriptions:', subscriptionList.length);
        } else if (Array.isArray(responseData.data)) {
          subscriptionList = responseData.data;
          console.log('Found subscriptions in data array:', subscriptionList.length);
        } else if (responseData.data?.docs) {
          subscriptionList = responseData.data.docs;
          console.log('Found subscriptions in data.docs:', subscriptionList.length);
        } else {
          console.error('Cannot find subscriptions array in response:', responseData);
          subscriptionList = [];
        }
        
        console.log(`Found ${subscriptionList.length} subscriptions`);
        
        // Ánh xạ trạng thái backend sang trạng thái hiển thị cho frontend
        const mapStatus = (status: string): 'pending' | 'approved' | 'rejected' | 'active' | 'cancelled' => {
          // Chuẩn hóa status
          const normalizedStatus = status?.toLowerCase();
          
          if (normalizedStatus === 'pending') return 'pending';
          if (normalizedStatus === 'active' || normalizedStatus === 'approved') return 'approved';
          if (normalizedStatus === 'rejected') return 'rejected';
          if (normalizedStatus === 'cancelled') return 'cancelled';
          
          // Mặc định trả về pending nếu không khớp
          console.warn(`Unknown status: ${status}, defaulting to 'pending'`);
          return 'pending';
        };
        
        // Lọc gói theo trạng thái đúng với tab hiện tại
        const filteredSubscriptions = subscriptionList.filter((sub: any) => {
          const status = sub.status || sub.paymentStatus || 'pending';
          
          if (tab === 'pending') {
            return status === 'pending';
          } else if (tab === 'approved') {
            return ['active', 'approved'].includes(status);
          } else if (tab === 'rejected') {
            return status === 'rejected';
          }
          
          return true; // Hiển thị tất cả nếu không thuộc tab nào ở trên
        });
        
        console.log(`After filtering: ${filteredSubscriptions.length} subscriptions match the tab criteria`);
        
        if (filteredSubscriptions.length > 0) {
          console.log('First subscription data:', filteredSubscriptions[0]._id);
        }
        
        // Map subscriptions to the expected format - using the exact structure from the API response
        const mappedSubscriptions = filteredSubscriptions.map((sub: any) => {
          console.log(`Processing subscription ID: ${sub._id}, Status: ${sub.status}`);
          
          // Lấy dữ liệu user
          const userId = sub.userId || {};
          const user = typeof userId === 'object' ? userId : { _id: userId };
          
          // Lấy dữ liệu package
          const packageId = sub.packageId || {};
          const packageData = typeof packageId === 'object' ? packageId : { _id: packageId };
          
          return {
            id: sub._id || '',
            user: {
              id: user._id || '',
              name: user.fullname || user.fullName || user.username || 'Unknown User',
              email: user.email || 'No email',
              avatar: user.avatar || '/img/avatar.png'
            },
            packageId: {
              id: packageData._id || '',
              name: packageData.name || 'Unknown Package',
              price: packageData.price || 0,
              durationDays: packageData.durationDays || 30,
              discount: packageData.discount || 0
            },
            startDate: sub.startDate || new Date().toISOString(),
            endDate: sub.endDate || new Date().toISOString(),
            paymentMethod: (sub.paymentId?.method || 'bank_transfer'),
            paymentStatus: mapStatus(sub.status || 'pending'),
            amount: (sub.paymentId?.amount || sub.amount || 0),
            createdAt: sub.createdAt || new Date().toISOString()
          };
        });
        
        console.log('Final mapped subscriptions:', mappedSubscriptions);
        setSubscriptions(mappedSubscriptions);
        
        // Hiển thị toast thông báo thành công nếu có dữ liệu
        if (mappedSubscriptions.length > 0) {
          toast.success(`Đã tải ${mappedSubscriptions.length} đăng ký ${
            tab === 'pending' ? 'đang chờ duyệt' : 
            tab === 'approved' ? 'đã được duyệt' : 'đã bị từ chối'
          }`, {
            autoClose: 2000,
            hideProgressBar: true
          });
        } else {
          toast.info(`Không có đăng ký nào ${
            tab === 'pending' ? 'đang chờ duyệt' : 
            tab === 'approved' ? 'đã được duyệt' : 'đã bị từ chối'
          }`, {
            autoClose: 2000,
            hideProgressBar: true
          });
        }
      } else {
        const errorMessage = responseData.message || 'Failed to fetch subscriptions';
        setError(errorMessage);
        toast.error(errorMessage);
        setSubscriptions([]);
      }
    } catch (err: unknown) {
      console.error('Error fetching subscriptions:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError('Failed to fetch subscriptions: ' + errorMessage);
      toast.error('Lỗi khi tải dữ liệu: ' + errorMessage);
      setSubscriptions([]);
    } finally {
      setLoading(false);
    }
  };

  // Load subscriptions on initial render and when tab changes
  useEffect(() => {
    fetchSubscriptions(activeTab);
  }, [activeTab]);

  // Thêm hàm để tự động làm mới dữ liệu theo chu kỳ
  useEffect(() => {
    let refreshInterval: NodeJS.Timeout;
    
    // Chỉ thiết lập interval khi trang đã tải xong
    if (!loading) {
      console.log('Setting up auto-refresh interval');
      // Tự động làm mới dữ liệu mỗi 30 giây
      refreshInterval = setInterval(() => {
        console.log('Auto-refreshing data...');
        fetchSubscriptions(activeTab);
      }, 10000); // 30 giây
    }
    
    // Cleanup interval khi component unmount
    return () => {
      if (refreshInterval) {
        console.log('Clearing auto-refresh interval');
        clearInterval(refreshInterval);
      }
    };
  }, [activeTab, loading, fetchSubscriptions]);
  
  
  // Handle approving a subscription
  const handleApproveSubscription = async (subscriptionId: string) => {
    try {
      // Hiển thị dialog xác nhận trước khi duyệt
      if (!window.confirm('Bạn có chắc chắn muốn duyệt đăng ký này không?')) {
        return;
      }

      setActionInProgress(true);
      setProcessingId(subscriptionId);
      
      // Hiển thị thông báo đang xử lý
      const toastId = toast.loading('Đang xử lý...', { 
        closeButton: false,
        closeOnClick: false,
        draggable: false,
        autoClose: false
      });
      
      // Direct fetch for debugging
      const testToken = localStorage.getItem('authToken') || localStorage.getItem('auth_token');
      if (!testToken) {
        toast.dismiss(toastId);
        toast.error('Không tìm thấy token xác thực. Vui lòng đăng nhập lại.');
        throw new Error('No authentication token found');
      }
        console.log(`Attempting to approve subscription: ${subscriptionId}`);
      
      // Sửa đường dẫn API endpoint để phù hợp với backend
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
      const response = await fetch(`${baseUrl}/subscription/admin/approve/${subscriptionId}`, {
        method: 'POST', // Đảm bảo phương thức là POST
        headers: {
          'Authorization': `Bearer ${testToken}`,
          'Content-Type': 'application/json'
        },
        // Thêm body trống để đảm bảo request hợp lệ
        body: JSON.stringify({
          notes: "Phê duyệt bởi Admin từ trang quản trị"
        })
      });
      
      // Kiểm tra chi tiết về response để debug
      console.log('Approval response status:', response.status);
      
      if (!response.ok) {
        // Xử lý khi response không thành công
        const errorText = await response.text();
        console.error(`Error response (${response.status}):`, errorText);
        toast.dismiss(toastId);
        toast.error(`Lỗi khi duyệt đăng ký: ${response.status} - ${errorText || 'Không có thông tin lỗi'}`);
        throw new Error(`API request failed with status ${response.status}: ${errorText}`);
      }
      
      const responseData = await response.json();
      console.log('Approval response data:', responseData);
      
      toast.dismiss(toastId);
      
      if (responseData.success) {
        toast.success('Đã duyệt đăng ký thành công!', {
          icon: "🎉" as any,
          autoClose: 3000,
          hideProgressBar: false
        });
        
        // Chuyển tab sang "Đã duyệt" để người dùng có thể thấy kết quả
        setActiveTab('approved');
        
        // Tải lại danh sách đăng ký đã duyệt
        await fetchSubscriptions('approved');
      } else {
        toast.error('Không thể duyệt đăng ký: ' + (responseData.message || 'Lỗi không xác định'));
      }
    } catch (err: any) {
      console.error('Error approving subscription:', err);
      toast.error('Lỗi khi duyệt đăng ký: ' + (err.message || 'Lỗi không xác định'));
    } finally {
      setActionInProgress(false);
      setProcessingId('');
    }
  };

  // Handle rejecting a subscription
  const handleRejectSubscription = async (subscriptionId: string) => {
    try {
      setActionInProgress(true);
      setProcessingId(subscriptionId);
      
      // Hiển thị hộp thoại nhập lý do từ chối
      const rejectReason = window.prompt('Nhập lý do từ chối đăng ký:');
      
      // Nếu người dùng hủy hoặc không nhập gì, không thực hiện
      if (rejectReason === null) {
        toast.info('Đã hủy thao tác từ chối');
        setActionInProgress(false);
        setProcessingId('');
        return;
      }
      
      // Kiểm tra xem người dùng có nhập lý do không
      if (rejectReason.trim() === '') {
        toast.warning('Vui lòng nhập lý do từ chối để người dùng hiểu rõ lý do.');
        setActionInProgress(false);
        setProcessingId('');
        return;
      }
      
      // Hiển thị thông báo đang xử lý
      const toastId = toast.loading('Đang xử lý từ chối đăng ký...', { 
        closeButton: false,
        closeOnClick: false,
        draggable: false,
        autoClose: false
      });
      
      // Direct fetch for debugging
      const testToken = localStorage.getItem('authToken') || localStorage.getItem('auth_token');
      if (!testToken) {
        toast.dismiss(toastId);
        toast.error('Không tìm thấy token xác thực. Vui lòng đăng nhập lại.');
        throw new Error('No authentication token found');      }
      
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
      const response = await fetch(`${baseUrl}/subscription/admin/reject/${subscriptionId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${testToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason: rejectReason })
      });
      
      toast.dismiss(toastId);
      
      if (!response.ok) {
        const errorData = await response.text();
        console.error('Error rejection response:', errorData);
        toast.error(`Lỗi khi từ chối: ${response.status} - ${errorData || 'Không có thông tin lỗi'}`);
        throw new Error(`API request failed with status ${response.status}`);
      }
      
      const responseData = await response.json();
      
      if (responseData.success) {
        toast.success('Đã từ chối đăng ký thành công', {
          autoClose: 3000,
          hideProgressBar: false
        });
        
        // Chuyển tab sang "Đã từ chối" để người dùng có thể thấy kết quả
        setActiveTab('rejected');
        
        // Tải lại danh sách đăng ký đã từ chối
        await fetchSubscriptions('rejected');
      } else {
        toast.error('Không thể từ chối đăng ký: ' + (responseData.message || 'Lỗi không xác định'));
      }
    } catch (err: any) {
      console.error('Error rejecting subscription:', err);
      toast.error('Lỗi khi từ chối đăng ký: ' + (err.message || 'Lỗi không xác định'));
    } finally {
      setActionInProgress(false);
      setProcessingId('');
    }
  };

  // Handle canceling a subscription
  const handleCancelSubscription = async (subscriptionId: string) => {
    try {
      setActionInProgress(true);
      setProcessingId(subscriptionId);

      // Hiển thị hộp thoại xác nhận hủy gói
      const confirmCancel = window.confirm('Bạn có chắc chắn muốn hủy gói Premium này? Thao tác này sẽ hạ cấp quyền của người dùng xuống tài khoản tiêu chuẩn.');

      if (!confirmCancel) {
        toast.info('Đã hủy thao tác hủy gói');
        setActionInProgress(false);
        setProcessingId('');
        return;
      }
      
      // Hỏi lý do hủy gói
      const cancelReason = window.prompt('Vui lòng nhập lý do hủy gói Premium:');
      
      if (cancelReason === null) {
        toast.info('Đã hủy thao tác hủy gói');
        setActionInProgress(false);
        setProcessingId('');
        return;
      }
      
      // Hiển thị thông báo đang xử lý
      const toastId = toast.loading('Đang xử lý hủy gói Premium...', { 
        closeButton: false,
        closeOnClick: false,
        draggable: false,
        autoClose: false
      });

      // Direct fetch for debugging
      const testToken = localStorage.getItem('authToken') || localStorage.getItem('auth_token');
      if (!testToken) {
        toast.dismiss(toastId);
        toast.error('Không tìm thấy token xác thực. Vui lòng đăng nhập lại.');
        throw new Error('No authentication token found');
      }
      
      console.log(`Attempting to cancel subscription with ID: ${subscriptionId}`);
        // Đường dẫn API cần có dấu slash ở đầu để đảm bảo đường dẫn hoàn chỉnh
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
      const response = await fetch(`${baseUrl}/subscription/admin/cancel/${subscriptionId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${testToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          reason: cancelReason || "Cancelled by admin from admin panel"
        })
      });
      
      toast.dismiss(toastId);
      
      // Log chi tiết response để debug
      console.log('Cancel response status:', response.status);
      
      if (!response.ok) {
        // Đọc và hiển thị chi tiết lỗi từ response
        let errorMessage = '';
        try {
          const errorData = await response.text();
          errorMessage = errorData;
          console.error('Error response body:', errorData);
        } catch (err) {
          console.error('Error parsing error response:', err);
        }
        
        toast.error(`Lỗi khi hủy gói: ${response.status} - ${errorMessage || 'Không có thông tin lỗi'}`);
        throw new Error(`API request failed with status ${response.status}: ${errorMessage}`);
      }
      
      const responseData = await response.json();
      console.log('Cancel response data:', responseData);

      if (responseData.success) {
        toast.success('Đã hủy gói Premium thành công', {
          autoClose: 3000,
          hideProgressBar: false
        });
        
        // Làm mới dữ liệu trong tab hiện tại
        fetchSubscriptions(activeTab);
      } else {
        toast.error('Không thể hủy gói Premium: ' + (responseData.message || 'Lỗi không xác định'));
      }
    } catch (err: any) {
      console.error('Error canceling subscription:', err);
      toast.error('Lỗi khi hủy gói Premium: ' + (err.message || 'Lỗi không xác định'));
    } finally {
      setActionInProgress(false);
      setProcessingId('');
    }
  };

  // Handle viewing user details
  const handleViewUserDetails = async (userId: string) => {
    try {
      // Lấy token xác thực
      const token = localStorage.getItem('authToken') || localStorage.getItem('auth_token');
      if (!token) {
        toast.error('Không tìm thấy token xác thực!');
        return;
      }
        // Hiển thị thông báo đang tải
      const toastId = toast.loading('Đang tải thông tin người dùng...');
      
      // Gọi API để lấy thông tin chi tiết của người dùng
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
      const response = await fetch(`${baseUrl}/admin/users/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      toast.dismiss(toastId);
      
      if (!response.ok) {
        throw new Error(`Không thể lấy thông tin người dùng (${response.status})`);
      }
      
      const data = await response.json();
      
      if (data.success || data.statusCode === 200) {
        // Tạo một modal hiển thị thông tin người dùng thay vì alert
        const userData = data.data;
        const userDetailHTML = `
          <div style="padding: 10px;">
            <h5><strong>Thông tin người dùng</strong></h5>
            <hr/>
            <p><strong>ID:</strong> ${userId}</p>
            <p><strong>Họ tên:</strong> ${userData?.fullName || userData?.fullname || 'N/A'}</p>
            <p><strong>Email:</strong> ${userData?.email || 'N/A'}</p>
            <p><strong>Trạng thái:</strong> ${userData?.isActive ? '<span style="color: green;">Hoạt động</span>' : '<span style="color: red;">Bị khóa</span>'}</p>
            <p><strong>Loại tài khoản:</strong> ${userData?.accountType || userData?.accountTypeId?.name || 'Standard'}</p>
            <p><strong>Vai trò:</strong> ${userData?.role || userData?.role_id?.name || 'User'}</p>
            ${userData?.isPremium ? '<p><strong>Trạng thái Premium:</strong> <span style="color: gold; font-weight: bold;">Premium</span></p>' : ''}
          </div>
        `;
        
        // Sử dụng thư viện sweetalert2 hoặc modal của bootstrap thay vì alert native
        // Ở đây vẫn sử dụng alert tạm thời, nhưng đã format nội dung tốt hơn
        alert(userData?.fullName || userData?.fullname || 'Thông tin người dùng');
        const modalDiv = document.createElement('div');
        modalDiv.innerHTML = userDetailHTML;
        document.body.appendChild(modalDiv);
        setTimeout(() => { document.body.removeChild(modalDiv); }, 100);
      } else {
        toast.error('Không thể lấy thông tin người dùng: ' + (data.message || 'Lỗi không xác định'));
      }
    } catch (error: unknown) {
      console.error('Error fetching user details:', error);
      const errorMessage = error instanceof Error ? error.message : 'Lỗi không xác định';
      toast.error('Lỗi khi lấy thông tin người dùng: ' + errorMessage);
    }
  };

  // Handle tab change
  const handleTabChange = (tab: 'pending' | 'approved' | 'rejected') => {
    setActiveTab(tab);
    fetchSubscriptions(tab);
  };
  
  return (
    <>
      <Head>
        <title>Quản lý Premium - Admin Panel</title>
      </Head>

      <div className={styles.container}>
        <section className={styles.header}>
          <div className="container-fluid">
            <div className="row mb-2">
              <div className="col-sm-6">
                <h1 className={styles.headerTitle}>Quản lý Đăng ký Premium</h1>
              </div>
              <div className="col-sm-6">                <ol className={`breadcrumb float-sm-right ${styles.breadcrumb}`}>
                  <li className="breadcrumb-item"><Link href="/admin">Dashboard</Link></li>
                  <li className="breadcrumb-item active">Premium</li>
                </ol>
              </div>
            </div>
          </div>
        </section>
      
        {/* Token debug info */}
        {tokenInfo && (
          <div className="container-fluid mb-3">
            <div className={`card ${tokenInfo.expired ? 'border-danger' : (tokenInfo.exists ? 'border-info' : 'border-danger')}`}>
              <div className="card-header">
                <h5 className="mb-0">Authentication Info</h5>
              </div>
              <div className="card-body">
                {tokenInfo.expired ? (
                  <div>
                    <p className="text-danger">Token has expired!</p>
                    <button 
                      className="btn btn-danger"
                      onClick={handleReLogin}
                    >
                      Re-login
                    </button>
                  </div>
                ) : tokenInfo.exists ? (
                  <p>Token exists: {tokenInfo.token}</p>
                ) : (
                  <p className="text-danger">{tokenInfo.message}</p>
                )}
                <button 
                  className="btn btn-sm btn-primary ml-2" 
                  onClick={() => {
                    // Copy token between authToken and auth_token
                    const authToken = localStorage.getItem('authToken');
                    const auth_token = localStorage.getItem('auth_token');
                    
                    if (authToken) localStorage.setItem('auth_token', authToken);
                    if (auth_token) localStorage.setItem('authToken', auth_token);
                    
                    window.location.reload();
                  }}
                >
                  Sync token and retry
                </button>
              </div>
            </div>
          </div>
        )}
      
        <section className="content">
          <div className="container-fluid">
            <div className="card">
              <div className="card-header p-0 d-flex justify-content-between align-items-center">
                <ul className="nav nav-tabs">
                  <li className="nav-item">
                    <button 
                      className={`nav-link ${activeTab === 'pending' ? 'active' : ''}`} 
                      onClick={() => handleTabChange('pending')}
                    >
                      Chờ duyệt
                      {/* Hiển thị badge số lượng nếu có đăng ký chờ duyệt */}
                      {activeTab !== 'pending' && subscriptions.some(sub => sub.paymentStatus === 'pending') && (
                        <span className="badge badge-pill badge-danger ml-1">
                          {subscriptions.filter(sub => sub.paymentStatus === 'pending').length}
                        </span>
                      )}
                    </button>
                  </li>
                  <li className="nav-item">
                    <button 
                      className={`nav-link ${activeTab === 'approved' ? 'active' : ''}`} 
                      onClick={() => handleTabChange('approved')}
                    >
                      Đã duyệt
                    </button>
                  </li>
                  <li className="nav-item">
                    <button 
                      className={`nav-link ${activeTab === 'rejected' ? 'active' : ''}`}
                      onClick={() => handleTabChange('rejected')}
                    >
                      Đã từ chối
                    </button>
                  </li>
                </ul>
                <div className="d-flex align-items-center">
                  {/* Nếu đang có thao tác xử lý, hiển thị loading spinner nhỏ */}
                  {actionInProgress && (
                    <div className="spinner-border spinner-border-sm text-primary mr-2" role="status">
                      <span className="sr-only">Loading...</span>
                    </div>
                  )}
                  <button 
                    className="btn btn-outline-primary mr-2"
                    onClick={() => fetchSubscriptions(activeTab)}
                    disabled={loading || actionInProgress}
                  >
                    <FaSync className={loading ? "fa-spin" : ""} /> Làm mới
                  </button>
                </div>
              </div>
            
              <div className="card-body">
                {loading ? (
                  <div className="d-flex flex-column align-items-center justify-content-center py-5">
                    <div className="spinner-border text-primary mb-3" role="status">
                      <span className="sr-only">Loading...</span>
                    </div>
                    <p>Đang tải dữ liệu đăng ký Premium...</p>
                  </div>
                ) : error ? (
                  <div className="alert alert-warning">
                    <div className="d-flex align-items-center">
                      <svg className="bi bi-exclamation-triangle-fill mr-2" width="24" height="24" viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                        <path fillRule="evenodd" d="M8 1.5a6.5 6.5 0 100 13 6.5 6.5 0 000-13zM0 8a8 8 0 1116 0A8 8 0 010 8z"/>
                        <path d="M8 3.5a.5.5 0 01.5.5v4a.5.5 0 01-1 0V4a.5.5 0 01.5-.5z"/>
                        <path d="M7.5 11a.5.5 0 11.5.5.5.5 0 01-.5-.5z"/>
                      </svg>
                      <p className="mb-0">{error}</p>
                    </div>
                    <button 
                      className="btn btn-outline-primary mt-2"
                      onClick={() => fetchSubscriptions(activeTab)}
                    >
                      <FaSync className="mr-1" /> Thử lại
                    </button>
                  </div>
                ) : subscriptions.length === 0 ? (
                  <div className="text-center py-5">
                    <div className="empty-state mb-3">
                      {activeTab === 'pending' && <FaHourglassHalf size={48} color="#ffc107" />}
                      {activeTab === 'approved' && <FaCheckCircle size={48} color="#28a745" />}
                      {activeTab === 'rejected' && <FaTimesCircle size={48} color="#dc3545" />}
                    </div>
                    <p className="text-muted">
                      {activeTab === 'pending' && 'Không có đăng ký Premium nào đang chờ duyệt'}
                      {activeTab === 'approved' && 'Không có đăng ký Premium nào đã được duyệt'}
                      {activeTab === 'rejected' && 'Không có đăng ký Premium nào đã bị từ chối'}
                    </p>
                    <button 
                      className="btn btn-outline-primary mt-2"
                      onClick={() => fetchSubscriptions(activeTab)}
                      disabled={loading}
                    >
                      <FaSync className={loading ? "fa-spin" : ""} /> Tải lại
                    </button>
                  </div>
                ) : (
                  <div>
                    <div className="alert alert-info mb-3">
                      <div className="d-flex align-items-center">
                        {activeTab === 'pending' && <FaHourglassHalf className="mr-2" color="#17a2b8" />}
                        {activeTab === 'approved' && <FaCheckCircle className="mr-2" color="#28a745" />}
                        {activeTab === 'rejected' && <FaTimesCircle className="mr-2" color="#dc3545" />}
                        Đang hiển thị {subscriptions.length} đăng ký {
                          activeTab === 'pending' ? 'đang chờ duyệt' : 
                          activeTab === 'approved' ? 'đã được duyệt' : 'đã bị từ chối'
                        }
                      </div>
                    </div>
                    {subscriptions.map(subscription => (
                      <SubscriptionItem 
                        key={subscription.id}
                        subscription={subscription}
                        onApprove={handleApproveSubscription}
                        onReject={handleRejectSubscription}
                        onViewUserDetails={handleViewUserDetails}
                        onCancel={handleCancelSubscription}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
};

// Add getLayout to use AdminLayout with admin protection
AdminPremiumPage.getLayout = function getLayout(page: React.ReactElement) {
  return (
    <AdminRoute>
      <AdminLayout>{page}</AdminLayout>
    </AdminRoute>
  );
};

export default AdminPremiumPage;