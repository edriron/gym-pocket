-- ==============================================================
-- GYM POCKET — SUPABASE DATABASE SETUP
-- Run this entire script in the Supabase SQL Editor
-- ==============================================================

-- ==============================================================
-- TABLES
-- ==============================================================

-- PROFILES (auto-created on signup via trigger below)
CREATE TABLE IF NOT EXISTS public.profiles (
  id         uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email      text NOT NULL UNIQUE,
  full_name  text,
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- WEIGHT RECORDS
CREATE TABLE IF NOT EXISTS public.weight_records (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recorded_at date NOT NULL,
  weight_kg   numeric(5,2) NOT NULL CHECK (weight_kg > 0),
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, recorded_at)
);
CREATE INDEX IF NOT EXISTS idx_weight_user ON public.weight_records(user_id, recorded_at DESC);

-- PRODUCTS (global, shared across all users)
CREATE TABLE IF NOT EXISTS public.products (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by     uuid NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  name           text NOT NULL UNIQUE,
  description    text,
  calories       numeric(7,2) NOT NULL DEFAULT 0 CHECK (calories >= 0),
  carbs_g        numeric(6,2) NOT NULL DEFAULT 0 CHECK (carbs_g >= 0),
  protein_g      numeric(6,2) NOT NULL DEFAULT 0 CHECK (protein_g >= 0),
  fats_g         numeric(6,2) NOT NULL DEFAULT 0 CHECK (fats_g >= 0),
  serving_size_g numeric(7,2) CHECK (serving_size_g > 0),
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_products_name ON public.products(name);

-- RECIPES (global)
CREATE TABLE IF NOT EXISTS public.recipes (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by  uuid NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  name        text NOT NULL UNIQUE,
  description text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_recipes_name ON public.recipes(name);

-- RECIPE INGREDIENTS
CREATE TABLE IF NOT EXISTS public.recipe_ingredients (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id     uuid NOT NULL REFERENCES public.recipes(id) ON DELETE CASCADE,
  product_id    uuid REFERENCES public.products(id) ON DELETE RESTRICT,
  sub_recipe_id uuid REFERENCES public.recipes(id) ON DELETE RESTRICT,
  quantity_g    numeric(7,2) NOT NULL CHECK (quantity_g > 0),
  created_at    timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT chk_ingredient_type CHECK (
    (product_id IS NOT NULL AND sub_recipe_id IS NULL)
    OR (product_id IS NULL AND sub_recipe_id IS NOT NULL)
  ),
  CONSTRAINT chk_no_self_ref CHECK (sub_recipe_id != recipe_id)
);
CREATE INDEX IF NOT EXISTS idx_ri_recipe ON public.recipe_ingredients(recipe_id);

-- DIET TABLES
CREATE TABLE IF NOT EXISTS public.diet_tables (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name       text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_diet_tables_user ON public.diet_tables(user_id);

-- DIET SECTIONS
CREATE TABLE IF NOT EXISTS public.diet_sections (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  diet_table_id uuid NOT NULL REFERENCES public.diet_tables(id) ON DELETE CASCADE,
  name          text NOT NULL,
  sort_order    integer NOT NULL DEFAULT 0,
  created_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_diet_sections_table ON public.diet_sections(diet_table_id);

-- DIET ROWS
CREATE TABLE IF NOT EXISTS public.diet_rows (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id uuid NOT NULL REFERENCES public.diet_sections(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.products(id) ON DELETE RESTRICT,
  recipe_id  uuid REFERENCES public.recipes(id) ON DELETE RESTRICT,
  quantity_g numeric(7,2) NOT NULL DEFAULT 100 CHECK (quantity_g > 0),
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT chk_diet_row_type CHECK (
    (product_id IS NOT NULL AND recipe_id IS NULL)
    OR (product_id IS NULL AND recipe_id IS NOT NULL)
  )
);
CREATE INDEX IF NOT EXISTS idx_diet_rows_section ON public.diet_rows(section_id);

-- WORKOUT TABLES
CREATE TABLE IF NOT EXISTS public.workout_tables (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name       text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_workout_tables_user ON public.workout_tables(user_id);

-- WORKOUT EXERCISES
CREATE TABLE IF NOT EXISTS public.workout_exercises (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_table_id uuid NOT NULL REFERENCES public.workout_tables(id) ON DELETE CASCADE,
  name             text NOT NULL,
  sets             integer NOT NULL CHECK (sets > 0),
  reps             integer NOT NULL CHECK (reps > 0),
  calories         numeric(6,2) CHECK (calories >= 0),
  sort_order       integer NOT NULL DEFAULT 0,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_workout_exercises_table ON public.workout_exercises(workout_table_id);

-- TABLE SHARES (unified for diet + workout)
DO $$ BEGIN
  CREATE TYPE public.share_access AS ENUM ('view', 'edit');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.share_table_type AS ENUM ('diet', 'workout');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.table_shares (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  table_type     share_table_type NOT NULL,
  table_id       uuid NOT NULL,
  owner_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  shared_with_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  access_mode    share_access NOT NULL DEFAULT 'view',
  created_at     timestamptz NOT NULL DEFAULT now(),
  UNIQUE(table_type, table_id, shared_with_id)
);
CREATE INDEX IF NOT EXISTS idx_shares_shared_with ON public.table_shares(shared_with_id);
CREATE INDEX IF NOT EXISTS idx_shares_owner ON public.table_shares(owner_id);

-- ==============================================================
-- FUNCTIONS AND TRIGGERS
-- ==============================================================

-- Auto-update updated_at on any table that has it
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at column (idempotent)
DO $$ DECLARE tbl text; BEGIN
  FOR tbl IN SELECT unnest(ARRAY[
    'profiles','weight_records','products','recipes',
    'diet_tables','workout_tables','workout_exercises'
  ]) LOOP
    EXECUTE format(
      'DROP TRIGGER IF EXISTS trg_%s_upd ON public.%s;
       CREATE TRIGGER trg_%s_upd BEFORE UPDATE ON public.%s
       FOR EACH ROW EXECUTE FUNCTION public.set_updated_at()',
      tbl, tbl, tbl, tbl
    );
  END LOOP;
END $$;

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles(id, email, full_name, avatar_url)
  VALUES(
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT(id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Recursive recipe nutrition (returns totals for the entire recipe, not per-100g)
CREATE OR REPLACE FUNCTION public.get_recipe_nutrition(p_recipe_id uuid)
RETURNS TABLE(
  calories      numeric,
  carbs_g       numeric,
  protein_g     numeric,
  fats_g        numeric,
  total_weight_g numeric
)
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  WITH RECURSIVE tree AS (
    SELECT
      ri.product_id,
      ri.sub_recipe_id,
      ri.quantity_g::numeric,
      1 AS depth
    FROM public.recipe_ingredients ri
    WHERE ri.recipe_id = p_recipe_id

    UNION ALL

    SELECT
      ri.product_id,
      ri.sub_recipe_id,
      (ri.quantity_g * (t.quantity_g / 100.0))::numeric,
      t.depth + 1
    FROM public.recipe_ingredients ri
    JOIN tree t ON t.sub_recipe_id = ri.recipe_id
    WHERE t.depth < 10
  )
  SELECT
    ROUND(SUM(t.quantity_g * p.calories  / 100.0), 2),
    ROUND(SUM(t.quantity_g * p.carbs_g   / 100.0), 2),
    ROUND(SUM(t.quantity_g * p.protein_g / 100.0), 2),
    ROUND(SUM(t.quantity_g * p.fats_g    / 100.0), 2),
    ROUND(SUM(t.quantity_g), 2)
  FROM tree t
  JOIN public.products p ON p.id = t.product_id
  WHERE t.product_id IS NOT NULL;
$$;

-- User lookup by email (used for sharing feature)
CREATE OR REPLACE FUNCTION public.get_user_id_by_email(p_email text)
RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT id FROM public.profiles
  WHERE email = lower(trim(p_email))
  LIMIT 1;
$$;

-- ==============================================================
-- ROW LEVEL SECURITY
-- ==============================================================

ALTER TABLE public.profiles          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weight_records    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipes           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipe_ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diet_tables       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diet_sections     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diet_rows         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_tables    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.table_shares      ENABLE ROW LEVEL SECURITY;

-- Drop existing policies (allows idempotent re-run)
DO $$ DECLARE r record; BEGIN
  FOR r IN SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r.policyname, r.tablename);
  END LOOP;
END $$;

-- PROFILES
CREATE POLICY "profiles: auth read"  ON public.profiles FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "profiles: own update" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- WEIGHT RECORDS (owner only)
CREATE POLICY "weight: own select" ON public.weight_records FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "weight: own insert" ON public.weight_records FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "weight: own update" ON public.weight_records FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "weight: own delete" ON public.weight_records FOR DELETE USING (auth.uid() = user_id);

-- PRODUCTS (global read, creator write)
CREATE POLICY "products: auth read"   ON public.products FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "products: auth insert" ON public.products FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "products: own update"  ON public.products FOR UPDATE USING (auth.uid() = created_by);
CREATE POLICY "products: own delete"  ON public.products FOR DELETE USING (auth.uid() = created_by);

-- RECIPES (global read, creator write)
CREATE POLICY "recipes: auth read"   ON public.recipes FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "recipes: auth insert" ON public.recipes FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "recipes: own update"  ON public.recipes FOR UPDATE USING (auth.uid() = created_by);
CREATE POLICY "recipes: own delete"  ON public.recipes FOR DELETE USING (auth.uid() = created_by);

-- RECIPE INGREDIENTS (global read, recipe creator write)
CREATE POLICY "ri: auth read"
  ON public.recipe_ingredients FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "ri: creator insert"
  ON public.recipe_ingredients FOR INSERT WITH CHECK (
    EXISTS(SELECT 1 FROM public.recipes r WHERE r.id = recipe_id AND r.created_by = auth.uid())
  );
CREATE POLICY "ri: creator delete"
  ON public.recipe_ingredients FOR DELETE USING (
    EXISTS(SELECT 1 FROM public.recipes r WHERE r.id = recipe_id AND r.created_by = auth.uid())
  );

-- DIET TABLES (owner + share recipients)
CREATE POLICY "dt: select"
  ON public.diet_tables FOR SELECT USING (
    auth.uid() = user_id
    OR EXISTS(SELECT 1 FROM public.table_shares ts
      WHERE ts.table_type = 'diet' AND ts.table_id = id AND ts.shared_with_id = auth.uid())
  );
CREATE POLICY "dt: insert" ON public.diet_tables FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "dt: update"
  ON public.diet_tables FOR UPDATE USING (
    auth.uid() = user_id
    OR EXISTS(SELECT 1 FROM public.table_shares ts
      WHERE ts.table_type = 'diet' AND ts.table_id = id
        AND ts.shared_with_id = auth.uid() AND ts.access_mode = 'edit')
  );
CREATE POLICY "dt: delete" ON public.diet_tables FOR DELETE USING (auth.uid() = user_id);

-- DIET SECTIONS (inherit from diet_table)
CREATE POLICY "ds: select"
  ON public.diet_sections FOR SELECT USING (
    EXISTS(SELECT 1 FROM public.diet_tables dt WHERE dt.id = diet_table_id
      AND (dt.user_id = auth.uid()
        OR EXISTS(SELECT 1 FROM public.table_shares ts
          WHERE ts.table_type = 'diet' AND ts.table_id = dt.id AND ts.shared_with_id = auth.uid())))
  );
CREATE POLICY "ds: write"
  ON public.diet_sections FOR INSERT WITH CHECK (
    EXISTS(SELECT 1 FROM public.diet_tables dt WHERE dt.id = diet_table_id
      AND (dt.user_id = auth.uid()
        OR EXISTS(SELECT 1 FROM public.table_shares ts
          WHERE ts.table_type = 'diet' AND ts.table_id = dt.id
            AND ts.shared_with_id = auth.uid() AND ts.access_mode = 'edit')))
  );
CREATE POLICY "ds: update"
  ON public.diet_sections FOR UPDATE USING (
    EXISTS(SELECT 1 FROM public.diet_tables dt WHERE dt.id = diet_table_id
      AND (dt.user_id = auth.uid()
        OR EXISTS(SELECT 1 FROM public.table_shares ts
          WHERE ts.table_type = 'diet' AND ts.table_id = dt.id
            AND ts.shared_with_id = auth.uid() AND ts.access_mode = 'edit')))
  );
CREATE POLICY "ds: delete"
  ON public.diet_sections FOR DELETE USING (
    EXISTS(SELECT 1 FROM public.diet_tables dt WHERE dt.id = diet_table_id
      AND (dt.user_id = auth.uid()
        OR EXISTS(SELECT 1 FROM public.table_shares ts
          WHERE ts.table_type = 'diet' AND ts.table_id = dt.id
            AND ts.shared_with_id = auth.uid() AND ts.access_mode = 'edit')))
  );

-- DIET ROWS (inherit via sections)
CREATE POLICY "dr: select"
  ON public.diet_rows FOR SELECT USING (
    EXISTS(SELECT 1 FROM public.diet_sections ds
      JOIN public.diet_tables dt ON dt.id = ds.diet_table_id
      WHERE ds.id = section_id
        AND (dt.user_id = auth.uid()
          OR EXISTS(SELECT 1 FROM public.table_shares ts
            WHERE ts.table_type = 'diet' AND ts.table_id = dt.id AND ts.shared_with_id = auth.uid())))
  );
CREATE POLICY "dr: write"
  ON public.diet_rows FOR INSERT WITH CHECK (
    EXISTS(SELECT 1 FROM public.diet_sections ds
      JOIN public.diet_tables dt ON dt.id = ds.diet_table_id
      WHERE ds.id = section_id
        AND (dt.user_id = auth.uid()
          OR EXISTS(SELECT 1 FROM public.table_shares ts
            WHERE ts.table_type = 'diet' AND ts.table_id = dt.id
              AND ts.shared_with_id = auth.uid() AND ts.access_mode = 'edit')))
  );
CREATE POLICY "dr: update"
  ON public.diet_rows FOR UPDATE USING (
    EXISTS(SELECT 1 FROM public.diet_sections ds
      JOIN public.diet_tables dt ON dt.id = ds.diet_table_id
      WHERE ds.id = section_id
        AND (dt.user_id = auth.uid()
          OR EXISTS(SELECT 1 FROM public.table_shares ts
            WHERE ts.table_type = 'diet' AND ts.table_id = dt.id
              AND ts.shared_with_id = auth.uid() AND ts.access_mode = 'edit')))
  );
CREATE POLICY "dr: delete"
  ON public.diet_rows FOR DELETE USING (
    EXISTS(SELECT 1 FROM public.diet_sections ds
      JOIN public.diet_tables dt ON dt.id = ds.diet_table_id
      WHERE ds.id = section_id
        AND (dt.user_id = auth.uid()
          OR EXISTS(SELECT 1 FROM public.table_shares ts
            WHERE ts.table_type = 'diet' AND ts.table_id = dt.id
              AND ts.shared_with_id = auth.uid() AND ts.access_mode = 'edit')))
  );

-- WORKOUT TABLES (mirror of diet_tables)
CREATE POLICY "wt: select"
  ON public.workout_tables FOR SELECT USING (
    auth.uid() = user_id
    OR EXISTS(SELECT 1 FROM public.table_shares ts
      WHERE ts.table_type = 'workout' AND ts.table_id = id AND ts.shared_with_id = auth.uid())
  );
CREATE POLICY "wt: insert" ON public.workout_tables FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "wt: update"
  ON public.workout_tables FOR UPDATE USING (
    auth.uid() = user_id
    OR EXISTS(SELECT 1 FROM public.table_shares ts
      WHERE ts.table_type = 'workout' AND ts.table_id = id
        AND ts.shared_with_id = auth.uid() AND ts.access_mode = 'edit')
  );
CREATE POLICY "wt: delete" ON public.workout_tables FOR DELETE USING (auth.uid() = user_id);

-- WORKOUT EXERCISES (inherit from workout_table)
CREATE POLICY "we: select"
  ON public.workout_exercises FOR SELECT USING (
    EXISTS(SELECT 1 FROM public.workout_tables wt WHERE wt.id = workout_table_id
      AND (wt.user_id = auth.uid()
        OR EXISTS(SELECT 1 FROM public.table_shares ts
          WHERE ts.table_type = 'workout' AND ts.table_id = wt.id AND ts.shared_with_id = auth.uid())))
  );
CREATE POLICY "we: write"
  ON public.workout_exercises FOR INSERT WITH CHECK (
    EXISTS(SELECT 1 FROM public.workout_tables wt WHERE wt.id = workout_table_id
      AND (wt.user_id = auth.uid()
        OR EXISTS(SELECT 1 FROM public.table_shares ts
          WHERE ts.table_type = 'workout' AND ts.table_id = wt.id
            AND ts.shared_with_id = auth.uid() AND ts.access_mode = 'edit')))
  );
CREATE POLICY "we: update"
  ON public.workout_exercises FOR UPDATE USING (
    EXISTS(SELECT 1 FROM public.workout_tables wt WHERE wt.id = workout_table_id
      AND (wt.user_id = auth.uid()
        OR EXISTS(SELECT 1 FROM public.table_shares ts
          WHERE ts.table_type = 'workout' AND ts.table_id = wt.id
            AND ts.shared_with_id = auth.uid() AND ts.access_mode = 'edit')))
  );
CREATE POLICY "we: delete"
  ON public.workout_exercises FOR DELETE USING (
    EXISTS(SELECT 1 FROM public.workout_tables wt WHERE wt.id = workout_table_id
      AND (wt.user_id = auth.uid()
        OR EXISTS(SELECT 1 FROM public.table_shares ts
          WHERE ts.table_type = 'workout' AND ts.table_id = wt.id
            AND ts.shared_with_id = auth.uid() AND ts.access_mode = 'edit')))
  );

-- TABLE SHARES
CREATE POLICY "ts: read"   ON public.table_shares FOR SELECT USING (auth.uid() = owner_id OR auth.uid() = shared_with_id);
CREATE POLICY "ts: insert" ON public.table_shares FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "ts: update" ON public.table_shares FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "ts: delete" ON public.table_shares FOR DELETE USING (auth.uid() = owner_id);

-- ==============================================================
-- DONE
-- Run this in Supabase SQL Editor: https://app.supabase.com
-- Then configure Google OAuth in Authentication > Providers
-- ==============================================================
