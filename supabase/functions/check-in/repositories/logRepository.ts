import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

export class LogRepository {
    constructor(private supabase: SupabaseClient) {}

    async getPersonel(username: string, passwordHash: string) {
        return await this.supabase.from("personel").select("id").eq("username", username).eq("password_hash", passwordHash).single();
    }

    async getSirketKonum(sirketKonumId: number) {
        return await this.supabase.from("sirketkonum").select("latitude, longitude, tolerans_metre").eq("id", sirketKonumId).single();
    }

    async getSonLog(personelId: number) {
        return await this.supabase.from("giriscikislog").select("islem_turu").eq("personel_id", personelId).order("created_at", { ascending: false }).limit(1);
    }

    async insertLog(personelId: number, sirketKonumId: number, islemTuru: string, mesafe: number) {
        return await this.supabase.from("giriscikislog").insert({
            personel_id: personelId,
            sirket_konum_id: sirketKonumId,
            islem_turu: islemTuru,
            sapma_mesafesi: mesafe
        });
    }
}