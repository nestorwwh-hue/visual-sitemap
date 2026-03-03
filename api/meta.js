const axios = require('axios');
const cheerio = require('cheerio');

export default async function handler(req, res) {
    const { url } = req.query;
    if (!url) return res.status(400).json({ error: 'URL is required' });

    try {
        const response = await axios.get(url, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Vercel Client)' },
            timeout: 5000
        });

        const $ = cheerio.load(response.data);

        const meta = {
            title: $('title').first().text().trim() || '',
            description: $('meta[name="description"]').attr('content') || $('meta[property="og:description"]').attr('content') || '',
            keywords: $('meta[name="keywords"]').attr('content') || '',
            ogImage: $('meta[property="og:image"]').attr('content') || '',
        };

        res.status(200).json(meta);
    } catch (error) {
        res.status(200).json({ title: '', description: '', keywords: '', ogImage: '' });
    }
}
