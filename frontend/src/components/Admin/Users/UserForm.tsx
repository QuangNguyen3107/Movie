import React, { useState, useEffect } from 'react';
import { UserForAdmin, RoleForAdmin, AccountTypeForAdmin, createUserByAdmin, updateUserByAdmin } from '@/API/services/admin/userAdminService';
import { FaSave, FaTimes, FaUser, FaEnvelope, FaLock, FaIdCard, FaUserTag, FaUserCog, FaEye, FaEyeSlash, FaBan, FaCheckCircle } from 'react-icons/fa';

interface UserFormProps {
  show: boolean;
  user: UserForAdmin | null;
  mode: 'create' | 'edit';
  roles: RoleForAdmin[];
  accountTypes: AccountTypeForAdmin[];
  onClose: () => void;
  onSave: () => void;
}

interface FormData {
  fullname: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: string;
  accountType: string;
  isActive: boolean;
}

const UserForm: React.FC<UserFormProps> = ({ 
  show, 
  user, 
  mode, 
  roles, 
  accountTypes,
  onClose, 
  onSave 
}) => {
  const initialFormData: FormData = {
    fullname: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: '',
    accountType: '',
    isActive: true
  };

  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState<{[key: string]: boolean}>({
    password: false,
    confirmPassword: false
  });

  useEffect(() => {
    if (user && mode === 'edit') {
      // When editing an existing user, prefill the form
      const roleId = typeof user.role === 'string' ? user.role : user.role?._id || '';
      const accountTypeId = typeof user.accountType === 'string' ? user.accountType : user.accountType?._id || '';
      
      setFormData({
        fullname: user.fullname || '',
        email: user.email || '',
        password: '',
        confirmPassword: '',
        role: roleId,
        accountType: accountTypeId,
        isActive: user.isActive !== undefined ? user.isActive : true
      });
    } else {
      // Reset form for new user
      setFormData(initialFormData);
    }
  }, [user, mode]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when field is changed
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: checked }));
  };

  const togglePasswordVisibility = (field: string) => {
    setPasswordVisible(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    // Validate required fields
    if (!formData.fullname.trim()) {
      newErrors.fullname = 'Họ tên là bắt buộc';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email là bắt buộc';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email không hợp lệ';
    }
    
    // Password only required for new users
    if (mode === 'create') {
      if (!formData.password) {
        newErrors.password = 'Mật khẩu là bắt buộc';
      } else if (formData.password.length < 6) {
        newErrors.password = 'Mật khẩu phải có ít nhất 6 ký tự';
      }
      
      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Mật khẩu xác nhận không khớp';
      }
    } else if (formData.password && formData.password.length < 6) {
      newErrors.password = 'Mật khẩu phải có ít nhất 6 ký tự';
    } else if (formData.password && formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Mật khẩu xác nhận không khớp';
    }
    
    if (!formData.role) {
      newErrors.role = 'Vai trò là bắt buộc';
    }
    
    if (!formData.accountType) {
      newErrors.accountType = 'Loại tài khoản là bắt buộc';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    try {
      if (mode === 'create') {
        await createUserByAdmin({
          fullname: formData.fullname,
          email: formData.email,
          password: formData.password,
          role_id: formData.role,         // Sửa từ role thành role_id
          accountTypeId: formData.accountType,  // Sửa từ accountType thành accountTypeId
          isActive: formData.isActive
        });
      } else if (mode === 'edit' && user) {
        const updateData: Partial<UserForAdmin> = {
          fullname: formData.fullname,
          email: formData.email,
          role_id: formData.role,          // Sửa từ role thành role_id
          accountTypeId: formData.accountType,   // Sửa từ accountType thành accountTypeId
          isActive: formData.isActive
        };
        
        // Only include password if provided
        if (formData.password) {
          updateData.password = formData.password;
        }
        
        await updateUserByAdmin(user._id, updateData);
      }
      
      onSave();
    } catch (err: any) {
      setErrors({ submit: err.message || 'Có lỗi xảy ra khi lưu người dùng' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!show) return null;

  return (
    <div className="modal-backdrop">
      <div className="modal-dialog">
        <div className="modal-content">
          <div className={`modal-header ${mode === 'create' ? 'bg-primary' : 'bg-info'}`}>
            <h5 className="modal-title">
              {mode === 'create' ? (
                <><FaUser className="me-2" /> Thêm người dùng mới</>
              ) : (
                <><FaUserCog className="me-2" /> Chỉnh sửa người dùng</>
              )}
            </h5>
            <button 
              type="button" 
              className="btn-close btn-close-white" 
              onClick={onClose} 
              disabled={isSubmitting}
              aria-label="Close"
            ></button>
          </div>
          
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              {errors.submit && (
                <div className="alert alert-danger" role="alert">
                  {errors.submit}
                </div>
              )}
              
              <div className="row mb-3">
                <div className="col-md-6 mb-3 mb-md-0">
                  <div className="form-group">
                    <label htmlFor="fullname" className="form-label">
                      <FaUser className="icon-form me-2" /> Họ tên <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className={`form-control ${errors.fullname ? 'is-invalid' : ''}`}
                      id="fullname"
                      name="fullname"
                      placeholder="Nhập họ tên đầy đủ"
                      value={formData.fullname}
                      onChange={handleInputChange}
                      disabled={isSubmitting}
                    />
                    {errors.fullname && (
                      <div className="invalid-feedback">{errors.fullname}</div>
                    )}
                  </div>
                </div>
                
                <div className="col-md-6">
                  <div className="form-group">
                    <label htmlFor="email" className="form-label">
                      <FaEnvelope className="icon-form me-2" /> Email <span className="text-danger">*</span>
                    </label>
                    <input
                      type="email"
                      className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                      id="email"
                      name="email"
                      placeholder="Nhập địa chỉ email"
                      value={formData.email}
                      onChange={handleInputChange}
                      disabled={isSubmitting}
                    />
                    {errors.email && (
                      <div className="invalid-feedback">{errors.email}</div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="row mb-3">
                <div className="col-md-6 mb-3 mb-md-0">
                  <div className="form-group">
                    <label htmlFor="password" className="form-label">
                      <FaLock className="icon-form me-2" />
                      {mode === 'create' ? 'Mật khẩu' : 'Mật khẩu (để trống nếu không đổi)'} 
                      {mode === 'create' && <span className="text-danger">*</span>}
                    </label>
                    <div className="input-group">
                      <input
                        type={passwordVisible.password ? "text" : "password"}
                        className={`form-control ${errors.password ? 'is-invalid' : ''}`}
                        id="password"
                        name="password"
                        placeholder={mode === 'create' ? "Nhập mật khẩu (ít nhất 6 ký tự)" : "Để trống nếu không thay đổi"}
                        value={formData.password}
                        onChange={handleInputChange}
                        disabled={isSubmitting}
                      />
                      <button 
                        className="btn btn-outline-secondary" 
                        type="button"
                        onClick={() => togglePasswordVisibility('password')}
                      >
                        {passwordVisible.password ? <FaEyeSlash /> : <FaEye />}
                      </button>
                      {errors.password && (
                        <div className="invalid-feedback">{errors.password}</div>
                      )}
                    </div>
                    {mode === 'create' && (
                      <small className="form-text text-muted">Mật khẩu phải có ít nhất 6 ký tự</small>
                    )}
                  </div>
                </div>
                
                <div className="col-md-6">
                  <div className="form-group">
                    <label htmlFor="confirmPassword" className="form-label">
                      <FaLock className="icon-form me-2" /> Xác nhận mật khẩu
                      {mode === 'create' && <span className="text-danger">*</span>}
                    </label>
                    <div className="input-group">
                      <input
                        type={passwordVisible.confirmPassword ? "text" : "password"}
                        className={`form-control ${errors.confirmPassword ? 'is-invalid' : ''}`}
                        id="confirmPassword"
                        name="confirmPassword"
                        placeholder="Nhập lại mật khẩu"
                        value={formData.confirmPassword}
                        onChange={handleInputChange}
                        disabled={isSubmitting}
                      />
                      <button 
                        className="btn btn-outline-secondary" 
                        type="button"
                        onClick={() => togglePasswordVisibility('confirmPassword')}
                      >
                        {passwordVisible.confirmPassword ? <FaEyeSlash /> : <FaEye />}
                      </button>
                      {errors.confirmPassword && (
                        <div className="invalid-feedback">{errors.confirmPassword}</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="row mb-3">
                <div className="col-12">
                  <div className={`account-status-card ${formData.isActive ? 'active' : 'inactive'}`}>
                    <div className="status-icon">
                      {formData.isActive ? <FaCheckCircle size={24} /> : <FaBan size={24} />}
                    </div>
                    <div className="status-content">
                      <div className="form-check">
                        <input
                          type="checkbox"
                          className="form-check-input"
                          id="isActive"
                          name="isActive"
                          checked={formData.isActive}
                          onChange={handleCheckboxChange}
                          disabled={isSubmitting}
                        />
                        <label className="form-check-label fw-bold" htmlFor="isActive">
                          {formData.isActive ? "Tài khoản hoạt động" : "Tài khoản bị khóa"}
                        </label>
                      </div>
                      <small className="status-description">
                        {formData.isActive 
                          ? "Người dùng có thể đăng nhập và sử dụng tất cả các tính năng bình thường." 
                          : "Người dùng không thể đăng nhập hoặc truy cập vào bất kỳ tính năng nào của hệ thống."}
                      </small>
                    </div>
                  </div>
                </div>
              </div>

              <div className="row">
                <div className="col-md-6 mb-3 mb-md-0">
                  <div className="form-group">
                    <label htmlFor="role" className="form-label">
                      <FaUserTag className="icon-form me-2" /> Vai trò <span className="text-danger">*</span>
                    </label>
                    <select
                      className={`form-select ${errors.role ? 'is-invalid' : ''}`}
                      id="role"
                      name="role"
                      value={formData.role}
                      onChange={handleInputChange}
                      disabled={isSubmitting}
                    >
                      <option value="">-- Chọn vai trò --</option>
                      {roles.map(role => (
                        <option key={role._id} value={role._id}>{role.name}</option>
                      ))}
                    </select>
                    {errors.role && (
                      <div className="invalid-feedback">{errors.role}</div>
                    )}
                  </div>
                </div>
                
                <div className="col-md-6">
                  <div className="form-group">
                    <label htmlFor="accountType" className="form-label">
                      <FaIdCard className="icon-form me-2" /> Loại tài khoản <span className="text-danger">*</span>
                    </label>
                    <select
                      className={`form-select ${errors.accountType ? 'is-invalid' : ''}`}
                      id="accountType"
                      name="accountType"
                      value={formData.accountType}
                      onChange={handleInputChange}
                      disabled={isSubmitting}
                    >
                      <option value="">-- Chọn loại tài khoản --</option>
                      {accountTypes.map(type => (
                        <option key={type._id} value={type._id}>{type.name}</option>
                      ))}
                    </select>
                    {errors.accountType && (
                      <div className="invalid-feedback">{errors.accountType}</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="modal-footer">
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={onClose}
                disabled={isSubmitting}
              >
                <FaTimes className="me-1" /> Hủy
              </button>
              <button 
                type="submit" 
                className={`btn ${mode === 'create' ? 'btn-primary' : 'btn-info'}`}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Đang lưu...
                  </>
                ) : (
                  <>
                    <FaSave className="me-2" /> {mode === 'create' ? 'Tạo người dùng' : 'Cập nhật'}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      <style jsx>{`
        .modal-backdrop {
          background-color: rgba(0, 0, 0, 0.8); /* Tăng độ đậm của backdrop */
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 1050;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow-x: hidden;
          overflow-y: auto;
          animation: fadeIn 0.3s ease;
        }
        
        .modal-dialog {
          margin: 1rem;
          max-width: 550px;
          width: 100%;
          animation: slideDown 0.3s ease;
          pointer-events: none;
        }
        
        .modal-content {
          border: none;
          border-radius: 8px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3); /* Tăng độ đậm của shadow */
          pointer-events: auto;
          background-color: #fff; /* Đảm bảo nội dung modal có nền trắng đục */
        }
        
        .modal-header {
          border-top-left-radius: 8px;
          border-top-right-radius: 8px;
          padding: 1rem 1.5rem;
        }
        
        .modal-header .modal-title {
          color: white;
          font-weight: 600;
          display: flex;
          align-items: center;
          font-size: 1.25rem;
          margin: 0;
        }
        
        .modal-header .btn-close-white {
          color: white;
          opacity: 0.8;
        }
        
        .modal-header .btn-close-white:hover {
          opacity: 1;
        }
        
        .modal-body {
          padding: 1.5rem;
        }
        
        .modal-footer {
          padding: 1rem 1.5rem;
          background-color: #f8f9fa;
          border-bottom-left-radius: 8px;
          border-bottom-right-radius: 8px;
        }
        
        .form-group {
          margin-bottom: 1rem;
        }
        
        .form-label {
          font-weight: 500;
          display: flex;
          align-items: center;
          margin-bottom: 0.5rem;
          color: #495057;
        }
        
        .icon-form {
          color: #007bff;
        }
        
        .form-control, .form-select {
          padding: 0.5rem 0.75rem;
          border: 1px solid #ced4da;
          transition: all 0.2s ease;
        }
        
        .form-control:focus, .form-select:focus {
          box-shadow: 0 0 0 0.25rem rgba(13, 110, 253, 0.15);
        }
        
        .input-group .btn {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0.375rem 0.75rem;
        }
        
        .btn {
          display: inline-flex;
          align-items: center;
          font-weight: 500;
          padding: 0.5rem 1.25rem;
          transition: all 0.2s ease;
        }
        
        .btn:hover {
          transform: translateY(-1px);
        }
        
        .btn:active {
          transform: translateY(0);
        }
        
        .me-1 {
          margin-right: 0.25rem;
        }
        
        .me-2 {
          margin-right: 0.5rem;
        }
        
        .mb-3 {
          margin-bottom: 1rem;
        }

        .account-status-card {
          display: flex;
          align-items: center;
          padding: 1rem;
          border-radius: 0.5rem;
          margin-bottom: 1rem;
          transition: background-color 0.3s;
        }
        
        .account-status-card.active {
          background-color: #d4edda;
          border: 1px solid #c3e6cb;
        }
        
        .account-status-card.inactive {
          background-color: #f8d7da;
          border: 1px solid #f5c6cb;
        }
        
        .status-icon {
          margin-right: 1rem;
        }
        
        .status-content {
          flex-grow: 1;
        }
        
        .status-description {
          margin-top: 0.5rem;
          color: #6c757d;
        }
        
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slideDown {
          from { transform: translateY(-30px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default UserForm;