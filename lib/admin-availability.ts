import type { Database } from "@/lib/supabase/database.types";

export type ScheduleBlock =
  Database["public"]["Tables"]["schedule_blocks"]["Row"];

