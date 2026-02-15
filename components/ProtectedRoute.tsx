import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

interface ProtectedRouteProps {
    user: any; // Using any for now to avoid extensive type imports/definitions conflicts during refactor
    redirectPath?: string;
    children?: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
    user,
    redirectPath = '/login',
    children,
}) => {
    if (!user) {
        return <Navigate to={redirectPath} replace />;
    }

    return children ? <>{children}</> : <Outlet />;
};

export default ProtectedRoute;
