'use client';

import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { 
  FaChartLine, FaChartBar, FaChartPie, FaUsers, FaFilm, 
  FaComment, FaEye, FaCalendarAlt, FaPercentage, FaExclamationTriangle,
  FaSyncAlt, FaRegClock
} from 'react-icons/fa';
import { getDashboardStats, getAnalyticsData } from '@/API/services/admin/dashboardService';
import { Line, Bar, Pie, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  BarElement,
  ArcElement,
} from 'chart.js';
import AdminLayout from '@/components/Layout/AdminLayout';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

// Interfaces
interface DashboardStats {
  totalMovies: number;
  engagementRate: string;
  newUsers: number;
  reports: number;
  counts: {
    users: number;
    movies: number;
    comments: number;
    views: number;
  };
}

interface AnalyticsData {
  stats: DashboardStats;
  viewsByDay: {
    labels: string[];
    data: number[];
  };
  genreDistribution: {
    labels: string[];
    data: number[];
  };
  recentMovies: any[];
  topMovies: any[];
}

// Helper function to generate gradient for charts
const createGradient = (ctx: any, colorStart: string, colorEnd: string) => {
  const gradient = ctx.createLinearGradient(0, 0, 0, 400);
  gradient.addColorStop(0, colorStart);
  gradient.addColorStop(1, colorEnd);
  return gradient;
};

// Bọc component trong AdminLayout
const AdminAnalyticsPage: React.FC = () => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Fetch dashboard stats
  const fetchDashboardData = async () => {
    try {
      setRefreshing(true);
      const data = await getAnalyticsData();
      setAnalyticsData(data);
      setStats(data.stats);
      setError(null);
    } catch (err: any) {
      console.error('Failed to fetch analytics data:', err);
      setError(err.message || 'Đã xảy ra lỗi khi tải dữ liệu thống kê');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Chart data & options
  const viewsChartData = {
    labels: analyticsData?.viewsByDay.labels || [],
    datasets: [
      {
        label: 'Số lượt xem',
        data: analyticsData?.viewsByDay.data || [],
        backgroundColor: function(context: any) {
          const chart = context.chart;
          const { ctx, chartArea } = chart;
          if (!chartArea) return null;
          return createGradient(ctx, 'rgba(54, 162, 235, 0.6)', 'rgba(54, 162, 235, 0.1)');
        },
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 2,
        borderRadius: 5,
        barPercentage: 0.7,
      }
    ]
  };
  
  const viewsChartOptions = {
    responsive: true,
    plugins: {
      legend: { display: false },
      title: {
        display: true,
        text: 'Lượt xem theo ngày trong tuần',
        font: { size: 16 }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: 'rgba(0, 0, 0, 0.05)' }
      },
      x: {
        grid: { display: false }
      }
    }
  };

  // Làm đẹp dữ liệu biểu đồ thể loại phim với màu sắc rõ ràng hơn
  const genreChartData = {
    labels: analyticsData?.genreDistribution.labels || [],
    datasets: [
      {
        data: analyticsData?.genreDistribution.data || [],
        backgroundColor: [
          'rgba(255, 99, 132, 0.8)',   // Hồng đậm
          'rgba(54, 162, 235, 0.8)',   // Xanh dương đậm
          'rgba(255, 206, 86, 0.8)',   // Vàng đậm
          'rgba(75, 192, 192, 0.8)',   // Xanh lá đậm
          'rgba(153, 102, 255, 0.8)',  // Tím đậm
          'rgba(255, 159, 64, 0.8)',   // Cam đậm
          'rgba(255, 99, 132, 0.6)',   // Hồng nhạt
          'rgba(54, 162, 235, 0.6)',   // Xanh dương nhạt
          'rgba(255, 206, 86, 0.6)',   // Vàng nhạt
          'rgba(75, 192, 192, 0.6)',   // Xanh lá nhạt
        ],
        borderColor: [
          'rgb(255, 99, 132)',
          'rgb(54, 162, 235)',
          'rgb(255, 206, 86)',
          'rgb(75, 192, 192)',
          'rgb(153, 102, 255)',
          'rgb(255, 159, 64)',
          'rgb(255, 99, 132)',
          'rgb(54, 162, 235)',
          'rgb(255, 206, 86)',
          'rgb(75, 192, 192)',
        ],
        borderWidth: 2,
        hoverOffset: 15, // Hiệu ứng nổi khi hover
      }
    ]
  };

  const genreChartOptions = {
    responsive: true,
    maintainAspectRatio: false, // Cho phép điều chỉnh kích thước
    plugins: {
      legend: {
        position: 'right' as const,
        labels: {
          font: {
            size: 12,
            weight: 'bold' as const,
          },
          padding: 15,
          usePointStyle: true, // Sử dụng kiểu điểm thay vì hình chữ nhật
        }
      },
      title: {
        display: true,
        text: 'Phân bố theo thể loại phim',
        font: { size: 16, weight: 'bold' as const }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        cornerRadius: 8,
        titleFont: {
          size: 14,
          weight: 'bold' as const
        },
        bodyFont: {
          size: 13
        },
        displayColors: true,
        callbacks: {
          label: function(context: any) {
            const label = context.label || '';
            const value = context.raw || 0;
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            return `${label}: ${value} (${percentage}%)`;
          }
        }
      }
    },
    animation: {
      animateScale: true, // Hiệu ứng animation scale
      animateRotate: true // Hiệu ứng animation quay
    },
    cutout: '0%', // Không có lỗ ở giữa (pie chart đặc)
    radius: '90%' // Bán kính lớn hơn
  };

  // Làm đẹp biểu đồ tỷ lệ tương tác
  const engagementRateValue = stats ? parseInt(stats.engagementRate.replace('%', '')) : 0;
  
  const engagementChartData = {
    labels: ['Đã tương tác', 'Chưa tương tác'],
    datasets: [
      {
        data: [engagementRateValue, 100 - engagementRateValue],
        backgroundColor: [
          'rgba(75, 192, 192, 0.8)', // Xanh lá đậm hơn
          'rgba(230, 230, 230, 0.6)' // Xám nhạt
        ],
        borderColor: [
          'rgb(75, 192, 192)',
          'transparent'
        ],
        borderWidth: 2,
        cutout: '80%',
        hoverOffset: 10
      }
    ]
  };

  const engagementChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        enabled: true,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        titleFont: { size: 14 },
        bodyFont: { size: 13 },
        callbacks: {
          label: function(context: any) {
            const label = context.label || '';
            const value = context.raw || 0;
            return `${label}: ${value}%`;
          }
        }
      }
    },
    animation: {
      animateScale: true,
      animateRotate: true,
      duration: 1500 // Animation lâu hơn để thấy rõ
    }
  };

  return (
    <AdminLayout>
      <Head>
        <title>Analytics - Movie Streaming Admin</title>
      </Head>

      <div className="analytics-dashboard">
        <section className="content-header">
          <div className="container-fluid">
            <div className="row mb-3">
              <div className="col-sm-6">
                <h1 className="page-title">Analytics Dashboard</h1>
                <p className="text-muted">Tổng quan dữ liệu và số liệu thống kê</p>
              </div>
              <div className="col-sm-6 d-flex justify-content-end align-items-center">
                <button 
                  className="btn btn-outline-primary"
                  onClick={fetchDashboardData}
                  disabled={isLoading || refreshing}
                >
                  <FaSyncAlt className={`mr-2 ${refreshing ? 'spin' : ''}`} /> 
                  {refreshing ? 'Đang làm mới...' : 'Làm mới dữ liệu'}
                </button>
              </div>
            </div>
          </div>
        </section>

        <section className="content">
          <div className="container-fluid">
            {error && (
              <div className="alert alert-danger">
                <FaExclamationTriangle className="me-2" />
                {error}
              </div>
            )}

            {isLoading ? (
              <div className="text-center p-5">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Đang tải...</span>
                </div>
                <p className="mt-3">Đang tải dữ liệu thống kê...</p>
              </div>
            ) : (
              <>
                {/* Stats Cards */}
                <div className="row">
                  <div className="col-lg-3 col-md-6 mb-4">
                    <div className="info-box bg-white shadow">
                      <span className="info-box-icon bg-primary">
                        <FaUsers />
                      </span>
                      <div className="info-box-content">
                        <span className="info-box-text">Tổng người dùng</span>
                        <span className="info-box-number">{stats?.counts.users || 0}</span>
                        <div className="progress-description">
                          <FaRegClock className="me-1" /> <small>Mới: {stats?.newUsers || 0} (7 ngày qua)</small>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="col-lg-3 col-md-6 mb-4">
                    <div className="info-box bg-white shadow">
                      <span className="info-box-icon bg-success">
                        <FaFilm />
                      </span>
                      <div className="info-box-content">
                        <span className="info-box-text">Tổng số phim</span>
                        <span className="info-box-number">{stats?.counts.movies || 0}</span>
                      </div>
                    </div>
                  </div>

                  <div className="col-lg-3 col-md-6 mb-4">
                    <div className="info-box bg-white shadow">
                      <span className="info-box-icon bg-info">
                        <FaEye />
                      </span>
                      <div className="info-box-content">
                        <span className="info-box-text">Lượt xem</span>
                        <span className="info-box-number">{stats?.counts.views.toLocaleString() || 0}</span>
                      </div>
                    </div>
                  </div>

                  <div className="col-lg-3 col-md-6 mb-4">
                    <div className="info-box bg-white shadow">
                      <span className="info-box-icon bg-warning">
                        <FaComment />
                      </span>
                      <div className="info-box-content">
                        <span className="info-box-text">Bình luận</span>
                        <span className="info-box-number">{stats?.counts.comments || 0}</span>
                        <div className="progress-description text-danger">
                          <FaExclamationTriangle className="me-1" /> <small>Báo cáo: {stats?.reports || 0}</small>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Charts */}
                <div className="row">
                  {/* Engagement Rate */}
                  <div className="col-lg-4 mb-4">
                    <div className="card shadow h-100">
                      <div className="card-header d-flex justify-content-between align-items-center">
                        <h3 className="card-title mb-0">
                          <FaPercentage className="me-2 text-primary" /> Tỷ lệ tương tác
                        </h3>
                      </div>
                      <div className="card-body d-flex flex-column align-items-center justify-content-center">
                        <div className="engagement-chart-container">
                          <Doughnut data={engagementChartData} options={engagementChartOptions} />
                          <div className="engagement-rate">
                            <span className="rate-value">{stats?.engagementRate || '0%'}</span>
                          </div>
                        </div>
                        <p className="text-center text-muted mt-3">
                          Tỷ lệ tương tác trung bình của người dùng với nội dung
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Genre Distribution */}
                  <div className="col-lg-8 mb-4">
                    <div className="card shadow h-100">
                      <div className="card-header d-flex justify-content-between align-items-center">
                        <h3 className="card-title mb-0">
                          <FaChartPie className="me-2 text-primary" /> Phân bố thể loại
                        </h3>
                      </div>
                      <div className="card-body genre-chart-container">
                        <Pie data={genreChartData} options={genreChartOptions} />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="row">
                  {/* Views Chart */}
                  <div className="col-12 mb-4">
                    <div className="card shadow">
                      <div className="card-header d-flex justify-content-between align-items-center">
                        <h3 className="card-title mb-0">
                          <FaChartBar className="me-2 text-primary" /> Phân tích lượt xem
                        </h3>
                      </div>
                      <div className="card-body">
                        <Bar data={viewsChartData} options={viewsChartOptions} />
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </section>
      </div>

      <style jsx>{`
        .analytics-dashboard {
          animation: fadeIn 0.3s ease-in-out;
          padding: 1rem;
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
          border-radius: 0.75rem;
          min-height: 100px;
          transition: transform 0.3s, box-shadow 0.3s;
          overflow: hidden;
        }
        
        .info-box:hover {
          transform: translateY(-5px);
          box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15) !important;
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
          padding: 15px 15px 15px 0;
        }
        
        .info-box-text {
          display: block;
          font-size: 1rem;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          color: #666;
          font-weight: 500;
        }
        
        .info-box-number {
          display: block;
          font-weight: 700;
          font-size: 1.75rem;
          color: #333;
        }
        
        .progress-description {
          font-size: 0.85rem;
          color: #666;
          margin-top: 8px;
          display: flex;
          align-items: center;
        }
        
        .card {
          margin-bottom: 1rem;
          border: none;
          border-radius: 0.75rem;
          overflow: hidden;
          box-shadow: 0 0.125rem 0.375rem rgba(0, 0, 0, 0.1);
          transition: transform 0.3s, box-shadow 0.3s;
        }
        
        .card:hover {
          transform: translateY(-3px);
          box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.12);
        }
        
        .card-header {
          padding: 1rem 1.25rem;
          background-color: #f8f9fa;
          border-bottom: 1px solid rgba(0, 0, 0, 0.05);
        }
        
        .card-title {
          margin: 0;
          font-size: 1.1rem;
          font-weight: 600;
          color: #333;
          display: flex;
          align-items: center;
        }
        
        .card-body {
          padding: 1.25rem;
        }

        .genre-chart-container {
          height: 330px;
          position: relative;
          display: flex;
          justify-content: center;
          align-items: center;
        }
        
        .engagement-chart-container {
          position: relative;
          height: 230px;
          width: 230px;
          display: flex;
          justify-content: center;
          align-items: center;
        }
        
        .engagement-rate {
          position: absolute;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          animation: pulse 2s infinite;
        }
        
        .rate-value {
          font-size: 2.5rem;
          font-weight: bold;
          color: #4bc0c0;
          text-shadow: 0px 0px 10px rgba(75, 192, 192, 0.2);
        }
        
        .spinner-border {
          width: 3rem;
          height: 3rem;
        }
        
        .spin {
          animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
          100% { transform: rotate(360deg); }
        }
        
        @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.05); }
          100% { transform: scale(1); }
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

        .shadow {
          box-shadow: 0 0.25rem 0.75rem rgba(0, 0, 0, 0.1) !important;
        }
        
        .text-primary {
          color: #007bff !important;
        }

        .visually-hidden {
          position: absolute;
          width: 1px;
          height: 1px;
          padding: 0;
          margin: -1px;
          overflow: hidden;
          clip: rect(0, 0, 0, 0);
          white-space: nowrap;
          border: 0;
        }
      `}</style>
    </AdminLayout>
  );
};

export default AdminAnalyticsPage;