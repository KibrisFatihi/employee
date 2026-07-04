import { LogRepository } from "../repositories/logRepository.ts";
import { hesaplaMesafeMetre } from "../utils/geoUtils.ts";

export class LogService {
    constructor(private logRepo: LogRepository) {}

    async islemYurüt(body: any) {
        const { latitude, longitude, sirket_konum_id, username, password } = body;

        // 1. Kimlik Doğrulama
        const { data: personel, error: pErr } = await this.logRepo.getPersonel(username, password);
        if (pErr || !personel) throw new Error("Kimlik doğrulama başarısız!");

        // 2. Konum Çekme ve Mesafe Kontrolü
        const { data: konum, error: kErr } = await this.logRepo.getSirketKonum(Number(sirket_konum_id));
        if (kErr || !konum) throw new Error("Kapı bilgisi veritabanında doğrulanamadı!");

        const mesafe = hesaplaMesafeMetre(Number(latitude), Number(longitude), konum.latitude, konum.longitude);
        if (mesafe > konum.tolerans_metre) throw new Error(`Şirket sınırları dışındasınız! Mesafe: ${Math.round(mesafe)} metre.`);

        // 3. Giriş mi Çıkış mı Kararı
        const { data: loglar } = await this.logRepo.getSonLog(personel.id);
        let yeniIslemTuru = "GIRIS";
        if (loglar && loglar.length > 0) {
            yeniIslemTuru = loglar[0].islem_turu === "GIRIS" ? "CIKIS" : "GIRIS";
        }

        // 4. Veritabanına Yazma
        const { error: insErr } = await this.logRepo.insertLog(personel.id, Number(sirket_konum_id), yeniIslemTuru, Math.round(mesafe));
        if (insErr) throw new Error("Log yazılamadı: " + insErr.message);

        return { yeniIslemTuru, mesafe: Math.round(mesafe) };
    }
}