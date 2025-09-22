import { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'admin' | 'user';
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { user, admin, loading } = useAuth();
  const location = useLocation();

  // Show loading spinner while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-slate-600" />
          <p className="text-slate-600">กำลังตรวจสอบการเข้าสู่ระบบ...</p>
        </div>
      </div>
    );
  }

  // Redirect to welcome if not authenticated
  if (!user || !admin) {
    return <Navigate to="/welcome" state={{ from: location }} replace />;
  }

  // Check if admin is enabled
  if (admin.state !== 'enable') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg border border-slate-200">
          <h2 className="text-xl font-semibold text-slate-800 mb-2">บัญชีถูกระงับ</h2>
          <p className="text-slate-600">บัญชีของคุณถูกระงับการใช้งาน กรุณาติดต่อผู้ดูแลระบบ</p>
        </div>
      </div>
    );
  }

  // Check role-based access
  if (requiredRole && admin.role !== requiredRole) {
    return <Navigate to="/welcome" replace />;
  }

  return <>{children}</>;
}