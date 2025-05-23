import React, { useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import AdminLayout from '@/components/Layout/AdminLayout';
import { sendMaintenanceNotification, sendCustomNotification } from '@/API/services/admin/notificationService';
import { toast } from 'react-hot-toast';

// CSS Module
import styles from '@/styles/AdminDashboard.module.css';

const NotificationsPage = () => {
  const router = useRouter();

  // State cho thông báo bảo trì
  const [maintenanceForm, setMaintenanceForm] = useState({
    subject: 'Thông báo bảo trì hệ thống Movie Streaming',
    message: '',
    maintenanceTime: '',
    expectedDuration: '',
    userGroup: 'all' // all, premium, free
  });

  // State cho thông báo tùy chỉnh
  const [customForm, setCustomForm] = useState({
    subject: '',
    message: '',
    htmlContent: '',
    userGroup: 'all' // all, premium, free
  });

  // State cho trạng thái loading
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('maintenance');

  // Xử lý thay đổi giá trị form bảo trì
  const handleMaintenanceChange = (e) => {
    const { name, value } = e.target;
    setMaintenanceForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Xử lý thay đổi giá trị form tùy chỉnh
  const handleCustomChange = (e) => {
    const { name, value } = e.target;
    setCustomForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Gửi thông báo bảo trì
  const handleMaintenanceSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!maintenanceForm.message || !maintenanceForm.maintenanceTime || !maintenanceForm.expectedDuration) {
      toast.error('Vui lòng điền đầy đủ thông tin');
      return;
    }

    try {
      setIsLoading(true);
      const response = await sendMaintenanceNotification(maintenanceForm);
      
      if (response.success) {
        toast.success(`Đã gửi thông báo bảo trì thành công đến ${response.count || 0} người dùng`);
        
        // Reset form sau khi gửi thành công
        setMaintenanceForm({
          subject: 'Thông báo bảo trì hệ thống Movie Streaming',
          message: '',
          maintenanceTime: '',
          expectedDuration: '',
          userGroup: 'all'
        });
      } else {
        toast.error(response.message || 'Có lỗi xảy ra khi gửi thông báo');
      }
    } catch (error) {
      console.error('Error sending maintenance notification:', error);
      toast.error('Có lỗi xảy ra: ' + (error.message || 'Không thể gửi thông báo'));
    } finally {
      setIsLoading(false);
    }
  };

  // Gửi thông báo tùy chỉnh
  const handleCustomSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!customForm.subject || !customForm.message) {
      toast.error('Vui lòng điền đầy đủ tiêu đề và nội dung thông báo');
      return;
    }

    try {
      setIsLoading(true);
      const response = await sendCustomNotification(customForm);
      
      if (response.success) {
        toast.success(`Đã gửi thông báo tùy chỉnh thành công đến ${response.count || 0} người dùng`);
        
        // Reset form sau khi gửi thành công
        setCustomForm({
          subject: '',
          message: '',
          htmlContent: '',
          userGroup: 'all'
        });
      } else {
        toast.error(response.message || 'Có lỗi xảy ra khi gửi thông báo');
      }
    } catch (error) {
      console.error('Error sending custom notification:', error);
      toast.error('Có lỗi xảy ra: ' + (error.message || 'Không thể gửi thông báo'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AdminLayout>
      <Head>
        <title>Quản lý thông báo | Movie Streaming Admin</title>
      </Head>

      <div className={styles.content}>
        <div className={styles.pageHeader}>
          <h1 className={styles.pageTitle}>Quản lý thông báo qua Email</h1>
        </div>

        <div className={styles.container}>
          <div className={styles.tabHeader}>
            <button 
              className={`${styles.tabButton} ${activeTab === 'maintenance' ? styles.activeTab : ''}`}
              onClick={() => setActiveTab('maintenance')}
            >
              Thông báo bảo trì
            </button>
            <button 
              className={`${styles.tabButton} ${activeTab === 'custom' ? styles.activeTab : ''}`}
              onClick={() => setActiveTab('custom')}
            >
              Thông báo tùy chỉnh
            </button>
          </div>

          <div className={styles.tabContent}>
            {activeTab === 'maintenance' && (
              <div className={styles.formContainer}>
                <h2 className={styles.formTitle}>Gửi thông báo bảo trì hệ thống</h2>
                <p className={styles.formDescription}>
                  Thông báo sẽ được gửi tới tất cả người dùng đang hoạt động trên hệ thống.
                </p>

                <form onSubmit={handleMaintenanceSubmit}>
                  <div className={styles.formGroup}>
                    <label htmlFor="subject" className={styles.formLabel}>
                      Tiêu đề email
                    </label>
                    <input
                      type="text"
                      id="subject"
                      name="subject"
                      className={styles.formInput}
                      value={maintenanceForm.subject}
                      onChange={handleMaintenanceChange}
                      required
                    />
                  </div>                  <div className={styles.formGroup}>
                    <label htmlFor="message" className={styles.formLabel}>
                      Nội dung thông báo
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      className={styles.formTextarea}
                      value={maintenanceForm.message}
                      onChange={handleMaintenanceChange}
                      rows={5}
                      placeholder="Nhập nội dung thông báo bảo trì..."
                      required
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="userGroup" className={styles.formLabel}>
                      Gửi đến nhóm người dùng
                    </label>
                    <select
                      id="userGroup"
                      name="userGroup"
                      className={styles.formInput}
                      value={maintenanceForm.userGroup}
                      onChange={handleMaintenanceChange}
                    >
                      <option value="all">Tất cả người dùng</option>
                      <option value="premium">Chỉ người dùng Premium</option>
                      <option value="free">Chỉ người dùng miễn phí</option>
                    </select>
                  </div>

                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label htmlFor="maintenanceTime" className={styles.formLabel}>
                        Thời gian bắt đầu bảo trì
                      </label>
                      <input
                        type="datetime-local"
                        id="maintenanceTime"
                        name="maintenanceTime"
                        className={styles.formInput}
                        value={maintenanceForm.maintenanceTime}
                        onChange={handleMaintenanceChange}
                        required
                      />
                    </div>

                    <div className={styles.formGroup}>
                      <label htmlFor="expectedDuration" className={styles.formLabel}>
                        Thời gian dự kiến hoàn thành
                      </label>
                      <input
                        type="datetime-local"
                        id="expectedDuration"
                        name="expectedDuration"
                        className={styles.formInput}
                        value={maintenanceForm.expectedDuration}
                        onChange={handleMaintenanceChange}
                        required
                      />
                    </div>
                  </div>

                  <div className={styles.formActions}>
                    <button
                      type="submit"
                      className={styles.submitButton}
                      disabled={isLoading}
                    >
                      {isLoading ? 'Đang gửi...' : 'Gửi thông báo bảo trì'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {activeTab === 'custom' && (
              <div className={styles.formContainer}>
                <h2 className={styles.formTitle}>Gửi thông báo tùy chỉnh</h2>
                <p className={styles.formDescription}>
                  Thông báo sẽ được gửi tới tất cả người dùng đang hoạt động trên hệ thống.
                </p>

                <form onSubmit={handleCustomSubmit}>
                  <div className={styles.formGroup}>
                    <label htmlFor="custom-subject" className={styles.formLabel}>
                      Tiêu đề email
                    </label>
                    <input
                      type="text"
                      id="custom-subject"
                      name="subject"
                      className={styles.formInput}
                      value={customForm.subject}
                      onChange={handleCustomChange}
                      placeholder="Nhập tiêu đề email..."
                      required
                    />
                  </div>                  <div className={styles.formGroup}>
                    <label htmlFor="custom-message" className={styles.formLabel}>
                      Nội dung thông báo
                    </label>
                    <textarea
                      id="custom-message"
                      name="message"
                      className={styles.formTextarea}
                      value={customForm.message}
                      onChange={handleCustomChange}
                      rows={5}
                      placeholder="Nhập nội dung thông báo..."
                      required
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="custom-userGroup" className={styles.formLabel}>
                      Gửi đến nhóm người dùng
                    </label>
                    <select
                      id="custom-userGroup"
                      name="userGroup"
                      className={styles.formInput}
                      value={customForm.userGroup}
                      onChange={handleCustomChange}
                    >
                      <option value="all">Tất cả người dùng</option>
                      <option value="premium">Chỉ người dùng Premium</option>
                      <option value="free">Chỉ người dùng miễn phí</option>
                    </select>
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="htmlContent" className={styles.formLabel}>
                      Nội dung HTML (tùy chọn)
                    </label>
                    <textarea
                      id="htmlContent"
                      name="htmlContent"
                      className={styles.formTextarea}
                      value={customForm.htmlContent}
                      onChange={handleCustomChange}
                      rows={8}
                      placeholder="Nhập mã HTML cho email (nếu cần)..."
                    />
                  </div>

                  <div className={styles.formActions}>
                    <button
                      type="submit"
                      className={styles.submitButton}
                      disabled={isLoading}
                    >
                      {isLoading ? 'Đang gửi...' : 'Gửi thông báo'}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default NotificationsPage;
