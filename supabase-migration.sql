-- ============================================================
-- Migration: landing_page preference + food_logs table
-- Run this in the Supabase SQL editor
-- ============================================================

-- 1. Add landing_page column to user settings
ALTER TABLE public.user_body_stats
  ADD COLUMN IF NOT EXISTS landing_page text DEFAULT '/dashboard';

-- ============================================================
-- 2. Daily food log table
-- ============================================================

CREATE TABLE IF NOT EXISTS public.food_logs (
  id            uuid          DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id       uuid          NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id    uuid          REFERENCES public.products(id) ON DELETE SET NULL,
  recipe_id     uuid          REFERENCES public.recipes(id) ON DELETE SET NULL,
  quantity_g    numeric       NOT NULL CHECK (quantity_g > 0),
  logged_at     timestamptz   NOT NULL DEFAULT now(),
  created_at    timestamptz   NOT NULL DEFAULT now(),
  CONSTRAINT food_logs_item_check CHECK (
    (product_id IS NOT NULL AND recipe_id IS NULL) OR
    (recipe_id  IS NOT NULL AND product_id IS NULL)
  )
);

CREATE INDEX IF NOT EXISTS food_logs_user_logged_at_idx
  ON public.food_logs(user_id, logged_at DESC);

ALTER TABLE public.food_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own food logs"
  ON public.food_logs FOR ALL
  TO authenticated
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
