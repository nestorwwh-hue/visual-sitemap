const axios = require('axios');
const cheerio = require('cheerio');

module.exports = async (req, res) => {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const { url } = req.body;
    if (!url) return res.status(400).json({ error: 'URL is required' });

    try {
        const targetUrl = new URL(url);
        const baseUrl = `${targetUrl.protocol}//${targetUrl.hostname}`;

        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            },
            timeout: 8000
        });

        const $ = cheerio.load(response.data);
        const links = new Set();

        $('a').each((i, el) => {
            let href = $(el).attr('href');
            if (href) {
                try {
                    const fullUrl = new URL(href, baseUrl);
                    if (fullUrl.hostname === targetUrl.hostname) {
                        links.add(fullUrl.pathname.replace(/\/$/, '') || '/');
                    }
                } catch (e) { }
            }
        });

        const tree = { name: targetUrl.hostname, url: baseUrl, children: [] };
        const pathList = Array.from(links).sort();

        pathList.forEach(pathStr => {
            if (pathStr === '/') return;
            const parts = pathStr.split('/').filter(p => p);
            let currentLevel = tree.children;
            parts.forEach((part, index) => {
                let existingPath = currentLevel.find(c => c.name === part);
                if (!existingPath) {
                    existingPath = { name: part, children: [] };
                    currentLevel.push(existingPath);
                }
                if (index === parts.length - 1) existingPath.url = `${baseUrl}/${parts.join('/')}`;
                currentLevel = existingPath.children;
            });
        });

        res.status(200).json(tree);
    } catch (error) {
        console.error('Crawl error:', error.message);
        res.status(500).json({ error: 'Failed to crawl site' });
    }
};
