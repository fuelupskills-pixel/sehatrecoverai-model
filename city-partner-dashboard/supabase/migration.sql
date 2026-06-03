-- Create Enum Types
CREATE TYPE provider_type AS ENUM ('pharmacy', 'lab', 'hospital');
CREATE TYPE verification_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE task_type AS ENUM ('PHARMACY_DELIVERY', 'SAMPLE_COLLECTION');
CREATE TYPE task_status AS ENUM ('ASSIGNED', 'PICKED_UP', 'IN_TRANSIT', 'DELIVERED', 'COLLECTED', 'DROPPED_OFF');

-- 1. City Partners Profile Table
CREATE TABLE city_partners (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    territory_zone TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Onboarded B2B Providers CRM Table
CREATE TABLE partners_onboarded (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    city_partner_id UUID REFERENCES city_partners(id) ON DELETE SET NULL,
    provider_name TEXT NOT NULL,
    provider_type provider_type NOT NULL,
    verification_status verification_status DEFAULT 'pending',
    contact_phone TEXT NOT NULL,
    facility_address TEXT NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    registration_docs JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Partner Reseller Commission Rates (Configurable from Admin side)
CREATE TABLE partner_commissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    partner_id UUID REFERENCES partners_onboarded(id) ON DELETE CASCADE,
    commission_percentage NUMERIC(5, 2) DEFAULT 8.00, -- e.g. 8.50% commission rate
    flat_fee NUMERIC(10, 2) DEFAULT 0.00, -- Flat fee per transaction
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Dual-Engine Logistics Tasks Table
CREATE TABLE logistics_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    city_partner_id UUID REFERENCES city_partners(id) ON DELETE CASCADE,
    partner_id UUID REFERENCES partners_onboarded(id) ON DELETE SET NULL,
    task_type task_type NOT NULL,
    status task_status DEFAULT 'ASSIGNED',
    order_details JSONB NOT NULL,
    destination_address TEXT NOT NULL,
    dest_latitude DOUBLE PRECISION NOT NULL,
    dest_longitude DOUBLE PRECISION NOT NULL,
    assigned_rider_name TEXT,
    assigned_rider_phone TEXT,
    otp_verification_code VARCHAR(6),
    temperature_logs JSONB DEFAULT '[]'::jsonb, -- Cold chain parameters
    vial_barcode TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Payout Ledger with Escrow Releases
CREATE TABLE ledger_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    city_partner_id UUID REFERENCES city_partners(id) ON DELETE SET NULL,
    partner_id UUID REFERENCES partners_onboarded(id) ON DELETE SET NULL,
    amount NUMERIC(10, 2) NOT NULL,
    commission_earned NUMERIC(10, 2) NOT NULL,
    escrow_released BOOLEAN DEFAULT FALSE,
    release_date TIMESTAMP WITH TIME ZONE,
    payout_status TEXT DEFAULT 'processing',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Notification logs (Email, SMS, WhatsApp triggers history)
CREATE TABLE notification_dispatch_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID REFERENCES logistics_tasks(id) ON DELETE CASCADE,
    recipient_phone TEXT,
    recipient_email TEXT,
    channel TEXT NOT NULL, -- 'whatsapp', 'email', 'sms'
    payload JSONB NOT NULL,
    status TEXT DEFAULT 'sent',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS
ALTER TABLE city_partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE partners_onboarded ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE logistics_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE ledger_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_dispatch_logs ENABLE ROW LEVEL SECURITY;

-- Setup RLS Policies
CREATE POLICY "City Partners can manage their profile" ON city_partners FOR ALL USING (auth.uid() = id);
CREATE POLICY "City Partners can view onboarded partners" ON partners_onboarded FOR ALL USING (auth.uid() = city_partner_id);
CREATE POLICY "Admins can view and edit all commissions" ON partner_commissions FOR ALL USING (true);
CREATE POLICY "City Partners can view their commissions" ON partner_commissions FOR SELECT USING (
    partner_id IN (SELECT id FROM partners_onboarded WHERE city_partner_id = auth.uid())
);
CREATE POLICY "City Partners can view and execute assigned logistics tasks" ON logistics_tasks FOR ALL USING (auth.uid() = city_partner_id);
CREATE POLICY "City Partners can view ledger transactions" ON ledger_transactions FOR ALL USING (auth.uid() = city_partner_id);
CREATE POLICY "City Partners can view dispatch logs" ON notification_dispatch_logs FOR SELECT USING (
    task_id IN (SELECT id FROM logistics_tasks WHERE city_partner_id = auth.uid())
);
