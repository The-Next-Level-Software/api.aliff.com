import { createClient } from "@supabase/supabase-js";
import ws from "ws";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    "Missing Supabase environment variables. Set SUPABASE_URL and SUPABASE_KEY (or SUPABASE_SERVICE_ROLE_KEY)."
  );
}

const supabase = createClient(supabaseUrl, supabaseKey,
  {
    realtime: {
      transport: ws,
    },
  }
);

export default supabase;