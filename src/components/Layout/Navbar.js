import React, { useState, useEffect } from "react";
import Link from "next/link";
import { FaSearch, FaBell, FaBars, FaTimes, FaHome, FaFilm, FaTv, FaHeart, FaBookmark, FaHistory } from "react-icons/fa";
import { useRouter } from "next/router";

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearchInput, setShowSearchInput] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const router = useRouter();

  // Xử lý hiệu ứng mờ khi cuộn trang
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
      setShowSearchInput(false);
      setSearchQuery("");
    }
  };

  const toggleSearchInput = () => {
    setShowSearchInput(!showSearchInput);
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  useEffect(() => {
    // Đóng menu khi nhấp vào ngoài menu
    const handleClickOutside = (event) => {
      const navbarCollapse = document.getElementById("navbarNav");
      const navbarToggler = document.querySelector(".navbar-toggler");
      
      if (
        isMenuOpen && 
        navbarCollapse && 
        !navbarCollapse.contains(event.target) &&
        !navbarToggler.contains(event.target)
      ) {
        setIsMenuOpen(false);
      }
    };

    // Thêm sự kiện click để đóng menu
    if (isMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isMenuOpen]);

  // Xử lý đóng menu khi click vào nút X
  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  const handleAvatarClick = () => {
    router.push('/auth/login');
  };

  // Tạo overlay xử lý click ngoài menu
  const handleOverlayClick = (e) => {
    e.stopPropagation(); // Ngăn event bubble
    setIsMenuOpen(false);
  };

  return (
    <nav className={`navbar navbar-expand-lg fixed-top ${isScrolled ? "bg-dark shadow-lg" : "bg-transparent"}`}>
      {/* Overlay để đóng menu khi click ngoài */}
      {isMenuOpen && (
        <div 
          className="menu-overlay d-lg-none" 
          onClick={handleOverlayClick}
          aria-hidden="true"
        />
      )}

      <div className="container-fluid px-3 px-lg-5">
        <div className="d-flex align-items-center">
          <button 
            className="navbar-toggler border-0 d-lg-none" 
            type="button" 
            onClick={toggleMenu}
            aria-expanded={isMenuOpen}
            aria-label="Toggle navigation"
          >
            <FaBars className="text-white" />
          </button>
          
          <Link href="/" className="navbar-brand text-danger fw-bold ms-1 me-lg-4 mx-lg-0">
            <img
              src="/img/phimlogo-removebg-preview.PNG"
              alt="Logo"
              className="navbar-logo"
              style={{ width: "120px", height: "32px" }}
            />
          </Link>
        </div>
        
        <div className="d-flex d-lg-none align-items-center ms-auto">
          {showSearchInput ? (
            <form onSubmit={handleSearch} className="d-flex me-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="form-control form-control-sm bg-dark text-white border-secondary"
                placeholder="Tìm kiếm..."
                autoFocus
                style={{ width: "120px" }}
              />
              <button type="submit" className="btn btn-sm btn-outline-danger ms-2">
                Tìm
              </button>
            </form>
          ) : (
            <FaSearch className="text-white fs-5 me-3 cursor-pointer" onClick={toggleSearchInput} />
          )}
          <div className="profile-avatar" onClick={handleAvatarClick}>
            <img 
              src="/img/avatar.png" 
              alt="User Avatar" 
              className="rounded-circle" 
              style={{ width: '32px', height: '32px' }} 
              onError={(e) => { e.target.src = "/img/default-avatar.png"; }}
            />
          </div>
        </div>

        <div className={`collapse navbar-collapse ${isMenuOpen ? 'show' : ''}`} id="navbarNav">
          {/* Nút đóng menu - Điều chỉnh vị trí lên góc trên bên phải */}
          <div className="d-lg-none position-absolute top-0 end-0 p-3">
            <button 
              className="btn btn-link text-white p-0 border-0" 
              onClick={closeMenu}
              aria-label="Close menu"
            >
              <FaTimes style={{ fontSize: '24px' }} />
            </button>
          </div>
          
          <ul className="navbar-nav flex-column flex-lg-row mx-auto">
            <li className="nav-item">
              <Link href="/" className="nav-link text-white px-3">
                <span className="d-inline-block d-lg-none me-2"><FaHome /></span>
                Trang chủ
              </Link>
            </li>
            <li className="nav-item">
              <Link href="/search" className="nav-link text-white px-3">
                <span className="d-inline-block d-lg-none me-2"><FaSearch /></span>
                Tìm kiếm
              </Link>
            </li>
            <li className="nav-item">
              <Link href="/movies" className="nav-link text-white px-3">
                <span className="d-inline-block d-lg-none me-2"><FaFilm /></span>
                Phim Lẻ
              </Link>
            </li>
            <li className="nav-item">
              <Link href="/series" className="nav-link text-white px-3">
                <span className="d-inline-block d-lg-none me-2"><FaTv /></span>
                Phim Bộ
              </Link>
            </li>
            <li className="nav-item">
              <Link href="/favorites" className="nav-link text-white px-3">
                <span className="d-inline-block d-lg-none me-2"><FaHeart /></span>
                Yêu Thích
              </Link>
            </li>
            <li className="nav-item">
              <Link href="/watchlater" className="nav-link text-white px-3">
                <span className="d-inline-block d-lg-none me-2"><FaBookmark /></span>
                Xem sau
              </Link>
            </li>
            <li className="nav-item">
              <Link href="/history" className="nav-link text-white px-3">
                <span className="d-inline-block d-lg-none me-2"><FaHistory /></span>
                Đã Xem
              </Link>
            </li>
          </ul>

          <div className="d-none d-lg-flex align-items-center gap-3">
            {showSearchInput ? (
              <form onSubmit={handleSearch} className="d-flex">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="form-control form-control-sm bg-dark text-white border-secondary"
                  placeholder="Tìm kiếm..."
                  autoFocus
                />
                <button type="submit" className="btn btn-sm btn-outline-danger ms-2">
                  Tìm
                </button>
              </form>
            ) : (
              <FaSearch className="text-white fs-5 cursor-pointer" onClick={toggleSearchInput} />
            )}
            <FaBell className="text-white fs-5 cursor-pointer" />
            <div className="profile-avatar" onClick={handleAvatarClick}>
              <img 
                src="/img/avatar.png" 
                alt="User Avatar" 
                className="rounded-circle" 
                style={{ width: '40px', height: '40px' }} 
                onError={(e) => { e.target.src = "/img/default-avatar.png"; }}
              />
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .navbar {
          transition: background 0.3s ease-in-out, box-shadow 0.3s;
          z-index: 1000;
        }
        .nav-link {
          font-size: 16px;
          font-weight: 500;
          transition: color 0.3s;
          padding: 0.5rem 1rem;
        }
        .nav-link:hover {
          color: #e50914 !important; /* Màu đỏ Netflix khi hover */
        }
        .profile-avatar img {
          object-fit: cover;
          cursor: pointer;
        }
        .navbar-logo {
          max-width: 150px;
          height: auto;
        }
        .cursor-pointer {
          cursor: pointer;
        }
        .navbar-toggler:focus {
          box-shadow: none;
        }
        
        /* Overlay để đóng menu khi click ngoài */
        .menu-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(47, 46, 46, 0.5);
          z-index: 998; /* Dưới navbar-collapse một chút */
          cursor: pointer;
        }
        
        /* Cải thiện mobile menu styling */
        @media (max-width: 992px) {
          .navbar-collapse {
            position: fixed;
            top: 0;
            left: -280px; /* Bắt đầu từ ngoài màn hình */
            width: 280px; /* Chiều rộng cố định vừa phải */
            height: 100vh;
            background-color: rgba(0, 0, 0, 0.95);
            padding: 70px 1rem 1rem; /* Để navbar ở trên */
            z-index: 999;
            border-right: 1px solid rgba(255, 255, 255, 0.1);
            transition: left 0.3s ease;
            overflow-y: auto;
          }
          
          .navbar-collapse.show {
            left: 0; /* Hiển thị khi mở */
            box-shadow: 0 0 15px rgba(0, 0, 0, 0.5);
          }
          
          .nav-item {
            margin: 12px 0;
            text-align: left;
            border-bottom: 1px solid rgba(255, 255, 255, 0.08);
            padding-bottom: 8px;
          }
          
          .nav-item:last-child {
            border-bottom: none;
          }
        }
      `}</style>
    </nav>
  );
};

export default Navbar;
