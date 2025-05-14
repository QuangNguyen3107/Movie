// src/pages/admin/users.tsx
'use client'; // Cần cho hooks

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Head from 'next/head';
import UserTable from '@/components/Admin/Users/UserTable';
import UserForm from '@/components/Admin/Users/UserForm';
import PaginationComponent from '@/components/Admin/Common/Pagination';
import { getUsersForAdmin, deleteUserByAdmin, toggleUserActiveStatus, getRolesForAdmin, getAccountTypesForAdmin } from '@/API/services/admin/userAdminService';
import { FaUserPlus, FaUsers, FaUserShield, FaUserAlt, FaUserCog } from 'react-icons/fa';
import AdminLayout from '@/components/Layout/AdminLayout';

const AdminUsersPage = () => {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [accountTypes, setAccountTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showUserForm, setShowUserForm] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [formMode, setFormMode] = useState('create');
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalUsers: 0,
    limit: 10,
  });

  // WebSocket connection for real-time updates
  const wsRef = useRef(null);

  // Fetch users with pagination
  const fetchUsers = useCallback(async (page = 1, limit = 10) => {
    setLoading(true);
    setError(null);
    try {
      console.log("Đang tải lại danh sách người dùng...");
      
      // Thêm timestamp để tránh cache
      const params = { 
        page, 
        limit, 
        _t: Date.now() 
      };
      
      // Gọi API để lấy danh sách người dùng mới nhất
      const responseData = await getUsersForAdmin(params);
      
      console.log("Nhận được dữ liệu người dùng mới:", responseData);
      
      if (responseData && Array.isArray(responseData.users)) {
        // Cập nhật state với dữ liệu mới
        setUsers(responseData.users);
        setPagination({
          currentPage: responseData.page || page,
          totalPages: responseData.totalPages || 1,
          totalUsers: responseData.total || 0,
          limit: responseData.limit || limit,
        });
      } else {
        // Fallback nếu API không trả về dữ liệu đúng định dạng
        setUsers([]);
        console.error('Invalid data format from API:', responseData);
      }
    } catch (err) {
      let errorMessage = 'Failed to fetch users';
      if (err instanceof Error) {
        errorMessage = err.message;
      }
      setError(errorMessage);
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch roles and account types
  const fetchRolesAndAccountTypes = useCallback(async () => {
    try {
      const [rolesData, accountTypesData] = await Promise.all([
        getRolesForAdmin(),
        getAccountTypesForAdmin()
      ]);
      
      if (Array.isArray(rolesData)) {
        setRoles(rolesData);
      } else {
        setRoles([]);
        console.error('Invalid roles data format:', rolesData);
      }
      
      if (Array.isArray(accountTypesData)) {
        setAccountTypes(accountTypesData);
      } else {
        setAccountTypes([]);
        console.error('Invalid account types data format:', accountTypesData);
      }
    } catch (err) {
      console.error('Failed to fetch roles or account types:', err);
    }
  }, []);

  // Setup WebSocket connection
  useEffect(() => {
    // Initialize WebSocket connection
    const setupWebSocket = () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      
      const ws = new WebSocket('ws://localhost:5000');
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('WebSocket connected');
        // Authenticate WebSocket connection
        const token = localStorage.getItem('authToken') || localStorage.getItem('auth_token');
        if (token) {
          ws.send(JSON.stringify({
            type: 'authenticate',
            token
          }));
        }
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('WebSocket message received:', data);
          
          // Handle user_updated notifications - for Premium subscription approvals
          if (data.type === 'user_updated' && data.userId && data.changes) {
            console.log('Cập nhật thông tin người dùng:', data.userId, data.changes);
            
            // Update the specific user in the local state
            setUsers(prevUsers => {
              return prevUsers.map(user => {
                if (user._id === data.userId) {
                  return {
                    ...user,
                    ...data.changes,
                    // If we're changing accountType to VIP, also update role name in UI
                    ...(data.changes.accountType === 'VIP' && { 
                      role: {
                        ...user.role,
                        name: data.changes.role || user.role?.name || 'VIP'
                      }
                    })
                  };
                }
                return user;
              });
            });
          }
        } catch (err) {
          console.error('Error parsing WebSocket message:', err);
        }
      };

      ws.onclose = () => {
        console.log('WebSocket disconnected');
        // Try to reconnect after a delay
        setTimeout(() => {
          if (document.visibilityState !== 'hidden') {
            setupWebSocket();
          }
        }, 5000);
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
    };

    setupWebSocket();

    // Cleanup function
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []); // Empty dependency array means this runs once on mount

  useEffect(() => {
    fetchUsers(pagination.currentPage, pagination.limit);
    fetchRolesAndAccountTypes();
  }, [pagination.currentPage, pagination.limit, fetchUsers, fetchRolesAndAccountTypes]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPagination(prev => ({ ...prev, currentPage: newPage }));
    }
  };

  const handleEditUser = (user) => {
    setSelectedUser(user);
    setFormMode('edit');
    setShowUserForm(true);
  };

  const handleDeleteUser = async (userId) => {
    if (!userId) {
      setError('Invalid user ID');
      return;
    }

    try {
      await deleteUserByAdmin(userId);
      // Refresh user list after successful deletion
      fetchUsers(pagination.currentPage, pagination.limit);
    } catch (err) {
      let errorMessage = 'Failed to delete user';
      if (err instanceof Error) {
        errorMessage = err.message;
      }
      setError(errorMessage);
    }
  };

  const handleBanUser = async (userId, isActive) => {
    if (!userId) {
      setError('Invalid user ID');
      return;
    }

    try {
      console.log(`Đang ${isActive ? 'mở khóa' : 'khóa'} tài khoản người dùng ${userId}`);
      
      // Gọi API để thay đổi trạng thái người dùng
      const result = await toggleUserActiveStatus(userId, isActive);
      console.log('Kết quả cập nhật:', result);
      
      // Force update UI bất kể kết quả từ API như thế nào
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user._id === userId ? { ...user, isActive: isActive } : user
        )
      );
      
      // Hiển thị thông báo thành công
      alert(`Đã ${isActive ? 'mở khóa' : 'khóa'} tài khoản người dùng thành công!`);
      
      // Để đồng bộ hóa dữ liệu, tải lại danh sách người dùng
      setTimeout(() => {
        fetchUsers(pagination.currentPage, pagination.limit);
      }, 500);
    } catch (err) {
      let errorMessage = `Không thể ${isActive ? 'mở khóa' : 'khóa'} tài khoản người dùng`;
      if (err instanceof Error) {
        errorMessage = err.message;
      }
      setError(errorMessage);
      alert(errorMessage);
      console.error('Error toggling user status:', err);
    }
  };

  const handleAddNewUser = () => {
    setSelectedUser(null);
    setFormMode('create');
    setShowUserForm(true);
  };

  const handleUserFormClose = () => {
    setShowUserForm(false);
    setSelectedUser(null);
  };

  const handleUserFormSave = () => {
    // Refresh user list after form save
    fetchUsers(pagination.currentPage, pagination.limit);
    handleUserFormClose();
  };

  // Count users by role
  const getUserCountByRole = (roleName) => {
    if (!Array.isArray(users)) return 0;
    return users.filter(user => {
      if (!user || !user.role) return false;
      const userRoleName = typeof user.role === 'string' ? user.role : (user.role.name || '');
      return userRoleName.toLowerCase() === roleName.toLowerCase();
    }).length;
  };

  // Count banned users
  const getBannedUserCount = () => {
    if (!Array.isArray(users)) return 0;
    return users.filter(user => user && user.isActive === false).length;
  };

  return (
    <>
      <Head>
        <title>Quản lý người dùng - Admin Dashboard</title>
      </Head>

      <div className="user-admin-dashboard">
        <section className="content-header">
          <div className="container-fluid">
            <div className="row mb-3">
              <div className="col-sm-6">
                <h1 className="page-title">Quản lý Người dùng</h1>
                <p className="text-muted">Quản lý tài khoản người dùng, phân quyền và trạng thái</p>
              </div>
              <div className="col-sm-6 d-flex justify-content-end align-items-center">
                <button 
                  type="button" 
                  className="btn btn-primary"
                  onClick={handleAddNewUser}
                >
                  <FaUserPlus className="mr-2" /> Thêm người dùng
                </button>
              </div>
            </div>
          </div>
        </section>

        <section className="content">
          <div className="container-fluid">
            {/* User Statistics Cards */}
            <div className="row mb-4">
              <div className="col-lg-3 col-md-6 col-sm-6 col-12">
                <div className="info-box bg-white shadow-sm">
                  <span className="info-box-icon bg-info">
                    <FaUsers />
                  </span>
                  <div className="info-box-content">
                    <span className="info-box-text">Tổng người dùng</span>
                    <span className="info-box-number">{pagination.totalUsers || 0}</span>
                  </div>
                </div>
              </div>
              <div className="col-lg-3 col-md-6 col-sm-6 col-12">
                <div className="info-box bg-white shadow-sm">
                  <span className="info-box-icon bg-danger">
                    <FaUserShield />
                  </span>
                  <div className="info-box-content">
                    <span className="info-box-text">Admin</span>
                    <span className="info-box-number">{getUserCountByRole('admin')}</span>
                  </div>
                </div>
              </div>
              <div className="col-lg-3 col-md-6 col-sm-6 col-12">
                <div className="info-box bg-white shadow-sm">
                  <span className="info-box-icon bg-warning">
                    <FaUserCog />
                  </span>
                  <div className="info-box-content">
                    <span className="info-box-text">Moderator</span>
                    <span className="info-box-number">{getUserCountByRole('moderator')}</span>
                  </div>
                </div>
              </div>
              <div className="col-lg-3 col-md-6 col-sm-6 col-12">
                <div className="info-box bg-white shadow-sm">
                  <span className="info-box-icon bg-secondary">
                    <FaUserAlt />
                  </span>
                  <div className="info-box-content">
                    <span className="info-box-text">Bị cấm</span>
                    <span className="info-box-number">{getBannedUserCount()}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* User Table Card */}
            <div className="card shadow-sm">
              <div className="card-body p-0">
                {loading && (
                  <div className="text-center p-5">
                    <div className="spinner-border text-primary" role="status">
                      <span className="sr-only">Đang tải...</span>
                    </div>
                    <p className="mt-2 text-muted">Đang tải danh sách người dùng...</p>
                  </div>
                )}
                
                {error && (
                  <div className="alert alert-danger m-3" role="alert">
                    <strong>Lỗi!</strong> {error}
                  </div>
                )}
                
                {!loading && !error && (
                  <>
                    {Array.isArray(users) && users.length > 0 ? (
                      <UserTable 
                        users={users} 
                        onEdit={handleEditUser} 
                        onDelete={handleDeleteUser}
                        onBanUser={handleBanUser}
                      />
                    ) : (
                      <div className="text-center p-5">
                        <p>Không có người dùng nào.</p>
                      </div>
                    )}
                  </>
                )}
              </div>
              <div className="card-footer bg-light d-flex justify-content-between align-items-center">
                <small className="text-muted">
                  Hiển thị {Array.isArray(users) ? users.length : 0} trên tổng số {pagination.totalUsers} người dùng
                </small>
                <PaginationComponent
                  currentPage={pagination.currentPage}
                  totalPages={pagination.totalPages}
                  onPageChange={handlePageChange}
                />
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* User Form Modal */}
      {showUserForm && (
        <UserForm 
          show={showUserForm}
          user={selectedUser}
          mode={formMode}
          roles={roles}
          accountTypes={accountTypes}
          onClose={handleUserFormClose}
          onSave={handleUserFormSave}
        />
      )}

      <style jsx>{`
        .user-admin-dashboard {
          animation: fadeIn 0.3s ease-in-out;
        }
        
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        .page-title {
          font-size: 1.75rem;
          font-weight: 600;
          margin-bottom: 0.5rem;
          color: #212529;
        }
        
        .info-box {
          border-radius: 0.5rem;
          min-height: 90px;
          transition: transform 0.2s, box-shadow 0.2s;
        }
        
        .info-box:hover {
          transform: translateY(-3px);
          box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.08) !important;
        }
        
        .info-box-icon {
          height: 70px;
          width: 70px;
          font-size: 1.5rem;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 0.5rem;
          color: white;
        }
        
        .info-box-content {
          padding: 10px 10px 10px 0;
        }
        
        .info-box-text {
          display: block;
          font-size: 0.9rem;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          color: #666;
          font-weight: 500;
        }
        
        .info-box-number {
          display: block;
          font-weight: 700;
          font-size: 1.5rem;
          color: #333;
        }
        
        .card {
          margin-bottom: 1.5rem;
          border: none;
          border-radius: 0.5rem;
          overflow: hidden;
        }
        
        .card-footer {
          padding: 0.75rem 1.25rem;
          border-top: 1px solid rgba(0, 0, 0, 0.06);
        }
        
        .spinner-border {
          width: 3rem;
          height: 3rem;
        }
      `}</style>
    </>
  );
};

// Thêm getLayout để sử dụng AdminLayout
AdminUsersPage.getLayout = (page) => {
  return <AdminLayout>{page}</AdminLayout>;
};

export default AdminUsersPage;