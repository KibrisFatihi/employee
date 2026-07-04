import { LogService } from "../services/logService.ts";

export class LogController {
    constructor(private logService: LogService) {}

    async handlePost(req: Request) {
        try {
            const body = await req.json();
            if (!body || Object.keys(body).length === 0) {
                return new Response(JSON.stringify({ success: false, message: "Veri paketi boş!" }), { status: 400 });
            }

            const sonuc = await this.logService.islemYurut(body);

            return new Response(JSON.stringify({
                success: true,
                message: `${sonuc.yeniIslemTuru === "GIRIS" ? "Giriş" : "Çıkış"} başarılı!`,
                mesafe: sonuc.mesafe
            }), { status: 200 });

        } catch (error: any) {
            return new Response(JSON.stringify({ success: false, message: error.message }), { status: 400 });
        }
    }
}