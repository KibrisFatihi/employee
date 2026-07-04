import { LogRepository } from "../repositories/logRepository.ts";
import { hesaplaMesafeMetre } from "../utils/geoUtils.ts";

// SHA-256 ile şifreyi hashleyen yardımcı fonksiyon
async function hashPassword(password: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

export class LogService {
    constructor(private logRepo: LogRepository) {}

    async islemYurut(body: any) {
        const { latitude, longitude, sirket_konum_id, username, password } = body;
        
        // 1. Şifreyi güvenli hale getir
        const hashedPassword = await hashPassword(password);

        // 2. Kimlik Doğrulama (Artık hashlenmiş şifreyi gönderiyoruz kanka)
        const { data: personel, error: pErr } = await this.logRepo.getPersonel(username, hashedPassword);
        if (pErr || !personel) throw new Error("Kimlik doğrulama başarısız!");

        // 3. Konum Çekme ve Mesafe Kontrolü
        const { data: konum, error: kErr } = await this.logRepo.getSirketKonum(Number(sirket_konum_id));
        if (kErr || !konum) throw new Error("Kapı bilgisi veritabanında doğrulanamadı!");

        const mesafe = hesaplaMesafeMetre(Number(latitude), Number(longitude), konum.latitude, konum.longitude);
        if (mesafe > konum.tolerans_metre) {
            throw new Error(`Şirket sınırları dışındasınız! Mesafe: ${Math.round(mesafe)} metre.`);
        }

        // 4. Giriş mi Çıkış mı Kararı
        const { data: loglar } = await this.logRepo.getSonLog(personel.id);
        let yeniIslemTuru = "GIRIS";
        if (loglar && loglar.length > 0) {
            yeniIslemTuru = loglar[0].islem_turu === "GIRIS" ? "CIKIS" : "GIRIS";
        }

        // 5. Veritabanına Yazma
        const { error: insErr } = await this.logRepo.insertLog(personel.id, Number(sirket_konum_id), yeniIslemTuru, Math.round(mesafe));
        if (insErr) throw new Error("Log yazılamadı: " + insErr.message);

        return { yeniIslemTuru, mesafe: Math.round(mesafe) };
    }
}