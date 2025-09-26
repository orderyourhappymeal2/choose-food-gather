-- Drop the existing foreign key constraint that's causing the issue
ALTER TABLE public.audit_log DROP CONSTRAINT IF EXISTS audit_log_user_id_fkey;

-- Make user_id nullable and remove the foreign key constraint
-- This allows audit logs to exist even after users are deleted
ALTER TABLE public.audit_log ALTER COLUMN user_id DROP NOT NULL;

-- Update the trigger function to handle delete operations better
CREATE OR REPLACE FUNCTION public.log_admin_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
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
    -- For DELETE, insert audit log without referencing the user_id foreign key
    INSERT INTO public.audit_log (user_id, action, details)
    VALUES (
      NULL, -- Don't reference the deleted user_id
      'ลบผู้ใช้', 
      format('ลบผู้ใช้: %s (ID: %s)', OLD.username, OLD.user_id)
    );
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create the trigger if it doesn't exist
DROP TRIGGER IF EXISTS admin_changes_trigger ON public.admin;
CREATE TRIGGER admin_changes_trigger
  AFTER UPDATE OR DELETE ON public.admin
  FOR EACH ROW EXECUTE FUNCTION public.log_admin_changes();