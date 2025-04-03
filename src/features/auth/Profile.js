import React from 'react';

const Profile = ({ user }) => {
    return (
        <div>
            <h2>Hồ Sơ Cá Nhân</h2>
            <p>Tên: {user.name}</p>
            <p>Email: {user.email}</p>
            {/* Thêm các thông tin khác nếu cần */}
        </div>
    );
};

export default Profile;
