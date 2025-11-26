-- Add DELETE policy for attendance_records

-- Allow admins to delete any attendance record
CREATE POLICY IF NOT EXISTS "Attendance admin delete" 
ON public.attendance_records
FOR DELETE TO authenticated
USING (
  public.has_role(auth.uid(), 'superadmin')
  OR public.has_role(auth.uid(), 'admin_rrhh')
);

-- Allow users to delete their own attendance records (optional, comment out if not desired)
-- CREATE POLICY IF NOT EXISTS "Users delete own attendance" 
-- ON public.attendance_records
-- FOR DELETE TO authenticated
-- USING (auth.uid() = user_id);
