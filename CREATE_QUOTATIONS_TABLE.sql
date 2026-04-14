-- =====================================================
-- CREATE QUOTATIONS TABLE FOR NAAMA
-- =====================================================
-- This SQL creates the quotations table and enables users
-- and employees to create, view, and manage quotations in the system.

-- Create the quotations table
CREATE TABLE IF NOT EXISTS public.quotations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_name TEXT NOT NULL,
    product_name TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price NUMERIC(12,2) NOT NULL,
    total_amount NUMERIC(12,2) NOT NULL,
    notes TEXT,
    created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.quotations ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to view all quotations
CREATE POLICY "Authenticated users can view quotations" 
  ON public.quotations
  FOR SELECT 
  TO authenticated
  USING (true);

-- Allow authenticated users to insert their own quotations
CREATE POLICY "Authenticated users can insert quotations" 
  ON public.quotations
  FOR INSERT 
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

-- Allow users to update their own quotations
CREATE POLICY "Users can update their own quotations" 
  ON public.quotations
  FOR UPDATE 
  TO authenticated
  USING (auth.uid() = created_by);

-- Allow users to delete their own quotations or employers to delete any
CREATE POLICY "Users can delete their own quotations" 
  ON public.quotations
  FOR DELETE 
  TO authenticated
  USING (auth.uid() = created_by OR public.has_role(auth.uid(), 'employer'));

-- Add trigger for automatic updated_at timestamp
DROP TRIGGER IF EXISTS update_quotations_updated_at ON public.quotations;
CREATE TRIGGER update_quotations_updated_at 
  BEFORE UPDATE ON public.quotations
  FOR EACH ROW 
  EXECUTE FUNCTION public.update_updated_at_column();
