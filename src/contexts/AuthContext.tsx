import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

interface Admin {
  user_id: string;
  username: string;
  agent_name: string;
  role: string;
  state: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  admin: Admin | null;
  loading: boolean;
  signInWithUsername: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        // Fetch admin data when user is authenticated
        if (session?.user) {
          setTimeout(() => {
            fetchAdminData(session.user.id);
          }, 0);
        } else {
          setAdmin(null);
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchAdminData(session.user.id);
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchAdminData = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('admin')
        .select('*')
        .eq('user_id', userId)
        .eq('state', 'enable')
        .single();

      if (error) {
        console.error('Error fetching admin data:', error);
        setAdmin(null);
      } else {
        setAdmin(data);
        // Navigate based on role after successful authentication
        if (window.location.pathname === '/') {
          if (data.role === 'admin') {
            navigate('/super-user');
          } else if (data.role === 'user') {
            navigate('/admin');
          }
        }
      }
    } catch (error) {
      console.error('Error fetching admin data:', error);
      setAdmin(null);
    } finally {
      setLoading(false);
    }
  };

  const signInWithUsername = async (username: string, password: string) => {
    try {
      setLoading(true);
      
      // Map username to internal email format
      const email = `${username}@internal.system`;
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { 
          success: false, 
          error: error.message.includes('Invalid login credentials') 
            ? 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' 
            : error.message 
        };
      }

      if (data.user) {
        return { success: true };
      }

      return { success: false, error: 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ' };
    } catch (error: any) {
      return { 
        success: false, 
        error: error.message || 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ' 
      };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        toast.error('เกิดข้อผิดพลาดในการออกจากระบบ');
        console.error('Sign out error:', error);
      }
      
      // Clear local state
      setUser(null);
      setSession(null);
      setAdmin(null);
    } catch (error) {
      console.error('Sign out error:', error);
      toast.error('เกิดข้อผิดพลาดในการออกจากระบบ');
    } finally {
      setLoading(false);
    }
  };

  const value: AuthContextType = {
    user,
    session,
    admin,
    loading,
    signInWithUsername,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}