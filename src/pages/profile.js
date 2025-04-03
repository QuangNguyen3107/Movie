import React, { useState, useEffect } from 'react';

const ProfilePage = () => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Lấy thông tin user từ session
    const fetchUserProfile = async () => {
      const response = await fetch('/api/auth/session');
      const data = await response.json();
      setUser(data.user);
    };
    fetchUserProfile();
  }, []);

  return (
    <div className="container mt-5">
      <div className="card bg-dark text-white">
        <div className="card-body">
          <div className="row">
            <div className="col-md-4">
              <img 
                src={user?.image || '/default-avatar.png'}
                alt="Avatar"
                className="img-fluid rounded-circle"
              />
            </div>
            <div className="col-md-8">
              <h3>{user?.name}</h3>
              <p>{user?.email}</p>
              {/* Thêm các thông tin khác */}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage; 