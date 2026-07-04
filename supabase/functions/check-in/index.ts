import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
<<<<<<< HEAD
import { LogRepository } from "./src/repositories/logRepository.ts";
import { LogService } from "./src/services/logService.ts";
import { LogController } from "./src/controllers/logController.ts";

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
    
    // Katmanların ayağa kaldırılması (Dependency Injection)
    const logRepository = new LogRepository(supabase);
    const logService = new LogService(logRepository);
    const logController = new LogController(logService);

    if (req.method === "POST") {
        const response = await logController.handlePost(req);
        // Global header'ları ekleyerek response dönüyoruz
        Object.entries(GLOBAL_HEADERS).forEach(([k, v]) => response.headers.set(k, v));
        return response;
    }

    return new Response(JSON.stringify({ success: false, message: "Metod izin verilmedi" }), { status: 405, headers: GLOBAL_HEADERS });
});
=======

function hesaplaMesafeMetre(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3;
    const phi1 = lat1 * Math.PI / 180;
    const phi2 = lat2 * Math.PI / 180;
    const deltaPhi = (lat2 - lat1) * Math.PI / 180;
    const deltaLambda = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
              Math.cos(phi1) * Math.cos(phi2) *
              Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

serve(async (req) => {
    const globalHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
        'Content-Type': 'application/json'
    };

    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: globalHeaders });
    }

    try {
        const supabaseUrl = "https://tcewauvsdecrhjznlkmt.supabase.co";
        const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRjZXdhdXZzZGVjcmhqem5sa210Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI5NzA2MDUsImV4cCI6MjA5ODU0NjYwNX0.w3Cr3lnkN06xLXMHdRx_Va1dwi8RXkAtOgYY-fw3Pis";
        const supabase = createClient(supabaseUrl, supabaseAnonKey);

        if (req.method === "GET") {
            const reqUrl = new URL(req.url);
            const kapiId = reqUrl.searchParams.get("kapi");

            if (!kapiId) {
                return new Response(JSON.stringify({ success: false, message: "Kapi ID eksik!" }), { status: 400, headers: globalHeaders });
            }

            const tazeToken = "token_" + Math.random().toString(36).substring(2, 15) + Date.now();
            return new Response(JSON.stringify({ success: true, qr_token: tazeToken }), { status: 200, headers: globalHeaders });
        }

        if (req.method === "POST") {
            const body = await req.json();
            const { latitude, longitude, qr_token, sirket_konum_id, personel_id, islem_turu } = body;

            if (!latitude || !longitude || !sirket_konum_id || !personel_id || !islem_turu || !qr_token) {
                return new Response(JSON.stringify({ success: false, message: "Eksik parametre gönderildi!" }), { status: 400, headers: globalHeaders });
            }

            const { data: konum, error: konumError } = await supabase
                .from("sirketkonum")
                .select("latitude, longitude, tolerans_metre")
                .eq("id", sirket_konum_id)
                .single();
            
            if (konumError || !konum) {
                return new Response(JSON.stringify({ success: false, message: "Kapı bilgisi doğrulanamadı: " + konumError?.message }), { status: 400, headers: globalHeaders });
            }

            const mesafe = hesaplaMesafeMetre(latitude, longitude, konum.latitude, konum.longitude);

            if (mesafe > konum.tolerans_metre) {
                return new Response(JSON.stringify({ 
                    success: false, 
                    message: `Şirket sınırları dışındasınız! Mesafe: ${Math.round(mesafe)} metre.` 
                }), { status: 400, headers: globalHeaders });
            }

            // İlk olarak büyük harfli deniyoruz (GIRIS/CIKIS)
            let anaTur = "GIRIS";
            let yedekTur = "giris";
            
            if (islem_turu === "Çıkış" || islem_turu === "Cikis" || islem_turu === "cikis" || islem_turu === "CIKIS") {
                anaTur = "CIKIS";
                yedekTur = "cikis";
            }

            // 🛠️ AKILLI DENEME MEKANİZMASI
            let { error: logError } = await supabase
                .from("giriscikislog")
                .insert({
                    personel_id: personel_id,
                    sirket_konum_id: sirket_konum_id,
                    islem_turu: anaTur, // Önce büyük harfle dene
                    sapma_mesafesi: Math.round(mesafe)
                });

            // Eğer enum hatası verdiyse, otomatik olarak küçük harfli yedek türle tekrar dene kanka
            if (logError && logError.message.includes("enum")) {
                const retry = await supabase
                    .from("giriscikislog")
                    .insert({
                        personel_id: personel_id,
                        sirket_konum_id: sirket_konum_id,
                        islem_turu: yedekTur, // Küçük harfle tekrar dene
                        sapma_mesafesi: Math.round(mesafe)
                    });
                logError = retry.error;
            }

            if (logError) {
                return new Response(JSON.stringify({ success: false, message: "Veritabanına log yazılamadı: " + logError.message }), { status: 500, headers: globalHeaders });
            }

            return new Response(JSON.stringify({ 
                success: true, 
                message: "Giriş işleminiz başarıyla veritabanına kaydedildi.",
                mesafe: Math.round(mesafe)
            }), { status: 200, headers: globalHeaders });
        }

        return new Response(JSON.stringify({ success: false, message: "Gecersiz Metod" }), { status: 405, headers: globalHeaders });

    } catch (error: any) {
        return new Response(JSON.stringify({ success: false, message: error.message }), { status: 500, headers: globalHeaders });
    }
})
>>>>>>> 285d11b185e46eff63bee05c5576bf81066894b5
