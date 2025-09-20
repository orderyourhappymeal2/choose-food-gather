-- Fix search path security issues for the functions we just created

-- Update handle_new_admin_user function with proper search_path
CREATE OR REPLACE FUNCTION public.handle_new_admin_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;

-- Update log_admin_changes function with proper search_path
CREATE OR REPLACE FUNCTION public.log_admin_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;