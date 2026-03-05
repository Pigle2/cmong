-- 3-level category hierarchy
CREATE TABLE categories (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  parent_id BIGINT REFERENCES categories(id) ON DELETE CASCADE,
  depth INTEGER NOT NULL DEFAULT 0 CHECK (depth BETWEEN 0 AND 2),
  sort_order INTEGER NOT NULL DEFAULT 0,
  icon TEXT -- lucide icon name for top-level categories
);

CREATE INDEX idx_categories_parent ON categories(parent_id);
CREATE INDEX idx_categories_slug ON categories(slug);
CREATE INDEX idx_categories_depth ON categories(depth);
