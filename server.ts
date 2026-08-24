import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// API Endpoint for AI Treasury Assistant (Gemini)
app.post('/api/ai-assistant', async (req: express.Request, res: express.Response) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(400).json({ error: 'API Key Gemini belum diset di lingkungan server.' });
    }

    const { prompt, type, contextData } = req.body;
    const ai = new GoogleGenAI({ apiKey });

    const systemInstruction = `Anda adalah Asisten Khusus Bendahara Kantin Sekolah. Tugas Anda adalah membantu bendahara kantin sekolah dalam menyusun template pesan WhatsApp tagihan yang profesional, ramah, dan efektif, serta memberikan masukan analisis keuangan dan rekomendasi pengelolaan kantin. Gunakan Bahasa Indonesia yang sopan, jelas, dan beretika.`;

    let userPrompt = prompt;

    if (type === 'wa-reminder') {
      userPrompt = `Buatkan draf pesan WhatsApp tagihan iuran kantin sekolah dengan data berikut:
- Nama Kantin/Lapak: ${contextData.namaKantin || ''}
- Nama Pemilik: ${contextData.namaPemilik || ''}
- Tanggal Tagihan: ${contextData.tanggal || ''}
- Nominal Iuran Hari Ini: Rp ${Number(contextData.nominal || 0).toLocaleString('id-ID')}
- Total Tunggakan (jika ada): Rp ${Number(contextData.totalTunggakan || 0).toLocaleString('id-ID')}
- Status Pembayaran saat ini: Belum Lunas
- Metode Pembayaran Tersedia: Tunai / Transfer Bank / QRIS Kantin

Tolong buatkan 2 pilihan format pesan WA:
Opsi 1 (Sopan & Pengingat Ramah Hari Ini)
Opsi 2 (Tegas & Formal untuk Tunggakan)
Sertakan detail pembayaran, instruksi konfirmasi bukti transfer, dan penutup hormat atas nama Bendahara Kantin Sekolah.`;
    } else if (type === 'financial-insight') {
      userPrompt = `Tolong analisis ringkasan rekapitulasi iuran kantin sekolah berikut dan berikan ringkasan eksekutif 3 poin utama & 2 rekomendasi konkret untuk Bendahara Kantin:
Data Rekapitulasi: ${JSON.stringify(contextData)}
Berikan saran peningkatan persentase pembayaran lunas (collection rate) dan penanganan tunggakan secara bijak.`;
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: userPrompt,
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    res.json({ text: response.text });
  } catch (err: any) {
    console.error('Gemini API Error:', err);
    res.status(500).json({ error: err.message || 'Gagal menghubungi server AI.' });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Kantin App] Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
