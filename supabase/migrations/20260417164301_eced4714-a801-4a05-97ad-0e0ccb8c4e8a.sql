
-- Company profiles table
CREATE TABLE public.company_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  company_name TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  email TEXT,
  logo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.company_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own company profile"
  ON public.company_profiles FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own company profile"
  ON public.company_profiles FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own company profile"
  ON public.company_profiles FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE TRIGGER update_company_profiles_updated_at
  BEFORE UPDATE ON public.company_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Invoices table
CREATE TABLE public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number TEXT NOT NULL,
  client_name TEXT NOT NULL,
  client_address TEXT,
  client_phone TEXT,
  client_email TEXT,
  product_name TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price NUMERIC(12,2) NOT NULL,
  total_amount NUMERIC(12,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'unpaid',
  due_date DATE,
  notes TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view invoices"
  ON public.invoices FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert invoices"
  ON public.invoices FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own invoices"
  ON public.invoices FOR UPDATE TO authenticated
  USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their own invoices"
  ON public.invoices FOR DELETE TO authenticated
  USING (auth.uid() = created_by OR public.has_role(auth.uid(), 'employer'));

CREATE TRIGGER update_invoices_updated_at
  BEFORE UPDATE ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Storage bucket for company logos
INSERT INTO storage.buckets (id, name, public) VALUES ('company-logos', 'company-logos', true);

CREATE POLICY "Logos are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'company-logos');

CREATE POLICY "Users can upload their own logo"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'company-logos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own logo"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'company-logos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own logo"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'company-logos' AND auth.uid()::text = (storage.foldername(name))[1]);
