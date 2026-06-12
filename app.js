const express = require('express');
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

// Menggunakan plugin Stealth agar Puppeteer tidak terdeteksi sebagai robot
puppeteer.use(StealthPlugin());

const app = express();
const PORT = process.env.PORT || 3000;
const targetUrl = 'https://drama.sansekai.my.id/api/pinedrama/trending';

app.get('/api/trending', async (req, res) => {
    console.log('Membuka browser stealth di Cloud...');
    
    const browser = await puppeteer.launch({
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-blink-features=AutomationControlled'
        ]
    });

    try {
        const page = await browser.newPage();
        
        // Sembunyikan jejak webdriver browser
        await page.evaluateOnNewDocument(() => {
            Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
        });

        // Set User-Agent browser asli
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36');

        // Buka API target
        await page.goto(targetUrl, { waitUntil: 'networkidle2', timeout: 60000 });

        // Tunggu sejenak untuk membiarkan Cloudflare melakukan verifikasi (3-5 detik)
        await new Promise(resolve => setTimeout(resolve, 5000));

        // Ambil hasil JSON yang muncul di layar browser
        const content = await page.evaluate(() => document.querySelector('body').innerText);
        
        // Parse dan kembalikan sebagai JSON resmi
        const jsonResult = JSON.parse(content);
        res.json(jsonResult);

    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    } finally {
        await browser.close();
    }
});

app.listen(PORT, () => {
    console.log(`Server API Stealth berjalan di port ${PORT}`);
});
