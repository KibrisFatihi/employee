// supabase/functions/admin-dashboard/repositories/adminRepository.ts
import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

export class AdminRepository {
    constructor(private supabase: SupabaseClient) {}

    // Dashboard'da tüm personelleri listelemek için
    async getAllPersonel() {
        return await this.supabase
            .from("personel")
            .select("id, username, ad_soyad, created_at")
            .order("created_at", { ascending: false });
    }

    // Panelden yeni personel eklemek için (Şifre hashli gelecek)
    async insertPersonel(username: string, passwordHash: string) {
        return await this.supabase
            .from("personel")
            .insert({
                username: username,
                password_hash: passwordHash
            });
    }

    // Panelden personeli silmek için
    async deletePersonel(personelId: number) {
        return await this.supabase
            .from("personel")
            .delete()
            .eq("id", personelId);
    }

    // Tüm giriş çıkış loglarını canlı izlemek için
    async getAllLogs() {
        return await this.supabase
            .from("giriscikislog")
            .select(`
                id,
                islem_turu,
                sapma_mesafesi,
                created_at,
                personel ( username )
            `)
            .order("created_at", { ascending: false });
    }
}
