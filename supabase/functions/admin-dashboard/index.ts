// supabase/functions/admin-dashboard/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { AdminRepository } from "./repositories/adminRepository.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

const GLOBAL_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, GET, DELETE, OPTIONS',
    'Content-Type': 'application/json'
};

// SHA-256 ile admin panelinden eklenen şifreyi hashlemek için yardımcı fonksiyon
async function hashPassword(password: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

serve(async (req) => {
    if (req.method === "OPTIONS") return new Response("ok", { headers: GLOBAL_HEADERS });

    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    const adminRepo = new AdminRepository(supabase);
    const url = new URL(req.url);
    const action = url.searchParams.get("action"); // ?action=logs gibi ayırt etmek için

    try {
        // --- 1. DATA GETİRME İŞLEMLERİ (GET) ---
        if (req.method === "GET") {
            if (action === "logs") {
                const { data, error } = await adminRepo.getAllLogs();
                if (error) throw error;
                return new Response(JSON.stringify({ success: true, data }), { status: 200, headers: GLOBAL_HEADERS });
            } 
            
            // Varsayılan olarak tüm personelleri dön kanka
            const { data, error } = await adminRepo.getAllPersonel();
            if (error) throw error;
            return new Response(JSON.stringify({ success: true, data }), { status: 200, headers: GLOBAL_HEADERS });
        }

        // --- 2. YENİ PERSONEL EKLEME (POST) ---
        if (req.method === "POST") {
           const body = await req.json();
    // body içinden ad_soyad alanını da cımbızla çekiyoruz kanka
    const { username, password, ad_soyad } = body; 

    if (!username || !password) throw new Error("Kullanıcı adı ve şifre zorunludur!");

    const hashedPassword = await hashPassword(password);
    
    // Veritabanına ad_soyad verisini de gönderiyoruz
    const { error } = await supabase
        .from("personel")
        .insert({
            username: username,
            password_hash: hashedPassword,
            ad_soyad: ad_soyad // <-- Burayı ekledik kanka!
        });
    
    if (error) throw error;
    return new Response(JSON.stringify({ success: true, message: "Personel başarıyla eklendi." }), { status: 201, headers: GLOBAL_HEADERS });
}

        // --- 3. PERSONEL SİLME (DELETE) ---
        if (req.method === "DELETE") {
            const body = await req.json();
            const { id } = body;

            if (!id) throw new Error("Silinecek personel ID'si gönderilmedi!");

            const { error } = await adminRepo.deletePersonel(Number(id));
            if (error) throw error;

            return new Response(JSON.stringify({ success: true, message: "Personel silindi." }), { status: 200, headers: GLOBAL_HEADERS });
        }

        return new Response(JSON.stringify({ success: false, message: "Metod izin verilmedi" }), { status: 405, headers: GLOBAL_HEADERS });

    } catch (error: any) {
        return new Response(JSON.stringify({ success: false, message: error.message }), { status: 400, headers: GLOBAL_HEADERS });
    }
});