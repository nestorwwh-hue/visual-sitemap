const axios = require('axios');
const cheerio = require('cheerio');

module.exports = async (req, res) => {
    const { url } = req.query;
    if (!url) return res.status(400).json({ error: 'URL is required' });

    try {
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            },
            timeout: 5000
        });

        const $ = cheerio.load(response.data);
        const title = $('title').text() || '';
        const description = $('meta[name="description"]').attr('content') || '';
        const keywords = $('meta[name="keywords"]').attr('content') || '';

        // Simular un preview usando un placeholder o favicon se fuera necesario
        const preview = `https://www.google.com/s2/favicons?domain=${new URL(url).hostname}&sz=64`;

        res.status(200).json({ title, description, keywords, preview });
    } catch (error) {
        console.error('Meta error:', error.message);
        res.status(200).json({ title: 'Not available', description: 'Error fetching metadata', keywords: '', preview: null });
    }
};
