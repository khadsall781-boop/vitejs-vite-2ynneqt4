-- Fix RLS policies for chaser_locations
    DROP POLICY IF EXISTS "Allow individual update" ON public.chaser_locations;
    CREATE POLICY "Allow individual update" ON public.chaser_locations
    FOR UPDATE USING (auth.uid() = chaser_id) WITH CHECK (auth.uid() = chaser_id);
    
    DROP POLICY IF EXISTS "Allow individual delete" ON public.chaser_locations;
    CREATE POLICY "Allow individual delete" ON public.chaser_locations
    FOR DELETE USING (auth.uid() = chaser_id);
    
    DROP POLICY IF EXISTS "Allow individual insert" ON public.chaser_locations;
    CREATE POLICY "Allow individual insert" ON public.chaser_locations
    FOR INSERT WITH CHECK (auth.uid() = chaser_id);
    
    -- Fix RLS policies for chasers
    DROP POLICY IF EXISTS "Allow individual update" ON public.chasers;
    CREATE POLICY "Allow individual update" ON public.chasers
    FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);