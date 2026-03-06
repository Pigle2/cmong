-- Add cancel fields to orders
ALTER TABLE orders ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS cancel_reason TEXT;

-- Add deliver fields to orders
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_note TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS revision_note TEXT;

-- Update status CHECK constraint to include REFUNDED, DISPUTED
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE orders ADD CONSTRAINT orders_status_check CHECK (status IN (
  'PAID', 'ACCEPTED', 'IN_PROGRESS', 'DELIVERED', 'COMPLETED',
  'REJECTED', 'CANCELLED', 'REVISION_REQUESTED', 'REFUNDED', 'DISPUTED'
));
