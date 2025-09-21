-- Fix database functions - drop all triggers with cascade
-- Drop all existing triggers and functions first
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users CASCADE;
DROP TRIGGER IF EXISTS admin_changes_trigger ON public.admin CASCADE;
DROP TRIGGER IF EXISTS admin_changes_audit ON public.admin CASCADE;

-- Drop functions with cascade
DROP FUNCTION IF EXISTS public.handle_new_admin_user() CASCADE;
DROP FUNCTION IF EXISTS public.log_admin_changes() CASCADE;

-- Recreate the handle_new_admin_user function with correct column reference
CREATE OR REPLACE FUNCTION public.handle_new_admin_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Insert into admin table when a new user is created
  INSERT INTO public.admin (user_id, username, agent_name, role, state)
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
$function$;

-- Recreate the log_admin_changes function with correct column reference
CREATE OR REPLACE FUNCTION public.log_admin_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    INSERT INTO public.audit_log (user_id, action, details)
    VALUES (
      NEW.user_id,
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
    VALUES (OLD.user_id, 'ลบผู้ใช้', format('ลบผู้ใช้: %s', OLD.username));
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$function$;

-- Recreate the trigger for new user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_admin_user();

-- Recreate the trigger for admin changes
CREATE TRIGGER admin_changes_trigger
  AFTER UPDATE OR DELETE ON public.admin
  FOR EACH ROW
  EXECUTE FUNCTION public.log_admin_changes();