import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { LogRepository } from "./repositories/logRepository.ts";
import { LogService } from "./services/logService.ts";
import { LogController } from "./controllers/logController.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

const GLOBAL_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Content-Type': 'application/json'
};

serve(async (req) => {
    if (req.method === "OPTIONS") return new Response("ok", { headers: GLOBAL_HEADERS });

    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    
    const logRepository = new LogRepository(supabase);
    const logService = new LogService(logRepository);
    const logController = new LogController(logService);

    if (req.method === "GET") {
        const tazeToken = "token_" + Math.random().toString(36).substring(2, 15) + Date.now();
        return new Response(JSON.stringify({ success: true, qr_token: tazeToken }), { status: 200, headers: GLOBAL_HEADERS });
    }

    if (req.method === "POST") {
        const response = await logController.handlePost(req);
        Object.entries(GLOBAL_HEADERS).forEach(([k, v]) => response.headers.set(k, v));
        return response;
    }

    return new Response(JSON.stringify({ success: false, message: "Metod izin verilmedi" }), { status: 405, headers: GLOBAL_HEADERS });
});
