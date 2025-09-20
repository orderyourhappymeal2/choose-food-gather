-- Create audit log table for usage history
CREATE TABLE public.audit_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  details TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on audit_log
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- Create policy for audit_log (admins can view all)
CREATE POLICY "Admins can view all audit logs" 
ON public.audit_log 
FOR SELECT 
USING (true);

-- Create policy for inserting audit logs
CREATE POLICY "System can insert audit logs" 
ON public.audit_log 
FOR INSERT 
WITH CHECK (true);

-- Enable RLS on admin table
ALTER TABLE public.admin ENABLE ROW LEVEL SECURITY;

-- Create policies for admin table
CREATE POLICY "Admins can view all admin records" 
ON public.admin 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can insert admin records" 
ON public.admin 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Admins can update admin records" 
ON public.admin 
FOR UPDATE 
USING (true);

CREATE POLICY "Admins can delete admin records" 
ON public.admin 
FOR DELETE 
USING (true);

-- Create function to handle new user creation and sync with admin table
CREATE OR REPLACE FUNCTION public.handle_new_admin_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert into admin table when a new user is created
  INSERT INTO public.admin (admin_id, username, agent_name, role, state)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    'ฝนส./ฝปดน.',
    'user',
    'enable'
  );
  
  -- Log the creation
  INSERT INTO public.audit_log (user_id, action, details)
  VALUES (NEW.id, 'สร้างผู้ใช้', 'สร้างบัญชีผู้ใช้ใหม่');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_admin_user();

-- Create function to log admin changes
CREATE OR REPLACE FUNCTION public.log_admin_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    INSERT INTO public.audit_log (user_id, action, details)
    VALUES (
      NEW.admin_id,
      'อัพเดทข้อมูลผู้ใช้',
      format('แก้ไขข้อมูล: %s', 
        CASE 
          WHEN OLD.agent_name != NEW.agent_name THEN format('agent_name: %s -> %s', OLD.agent_name, NEW.agent_name)
          WHEN OLD.role != NEW.role THEN format('role: %s -> %s', OLD.role, NEW.role)
          WHEN OLD.state != NEW.state THEN format('state: %s -> %s', OLD.state, NEW.state)
          ELSE 'ไม่ระบุ'
        END
      )
    );
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.audit_log (user_id, action, details)
    VALUES (OLD.admin_id, 'ลบผู้ใช้', format('ลบผู้ใช้: %s', OLD.username));
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for admin changes
CREATE TRIGGER admin_changes_audit
  AFTER UPDATE OR DELETE ON public.admin
  FOR EACH ROW EXECUTE FUNCTION public.log_admin_changes();