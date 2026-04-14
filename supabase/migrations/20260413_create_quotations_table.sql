-- Create quotations table
CREATE TABLE public.quotations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_name TEXT NOT NULL,
    product_name TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price NUMERIC(12,2) NOT NULL,
    total_amount NUMERIC(12,2) NOT NULL,
    notes TEXT,
    created_by UUID REFERENCES auth.users(id) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.quotations ENABLE ROW LEVEL SECURITY;

-- Authenticated users can view all quotations
CREATE POLICY "Authenticated users can view quotations" ON public.quotations
  FOR SELECT TO authenticated
  USING (true);

-- Authenticated users can insert their own quotations
CREATE POLICY "Authenticated users can insert quotations" ON public.quotations
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = created_by);

-- Users can update their own quotations
CREATE POLICY "Users can update their own quotations" ON public.quotations
  FOR UPDATE TO authenticated
  USING (auth.uid() = created_by);

-- Employers can delete any quotation, users can delete their own
CREATE POLICY "Users can delete their own quotations" ON public.quotations
  FOR DELETE TO authenticated
  USING (auth.uid() = created_by OR public.has_role(auth.uid(), 'employer'));

-- Updated_at trigger for quotations
CREATE TRIGGER update_quotations_updated_at BEFORE UPDATE ON public.quotations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
