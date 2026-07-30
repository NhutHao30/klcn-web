import React from 'react';
import AdminLayout from '../../Layout/AdminLayout';
import ProfilePage from '../ProfilePage';

const AdminProfilePage = () => {
    return (
        <AdminLayout>
            <ProfilePage />
        </AdminLayout>
    );
};

export default AdminProfilePage;
