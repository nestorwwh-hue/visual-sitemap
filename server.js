const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

app.post('/api/crawl', async (req, res) => {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: 'URL is required' });

    try {
        const targetUrl = new URL(url);
        const baseUrl = `${targetUrl.protocol}//${targetUrl.hostname}`;

        console.log(`Crawling: ${baseUrl}`);

        const response = await axios.get(url, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36' },
            timeout: 8000
        });

        console.log(`Successfully fetched content for ${url}`);

        const $ = cheerio.load(response.data);
        const links = new Set();

        $('a').each((i, el) => {
            let href = $(el).attr('href');
            if (href) {
                try {
                    const fullUrl = new URL(href, baseUrl);
                    // Only include internal links
                    if (fullUrl.hostname === targetUrl.hostname) {
                        links.add(fullUrl.pathname.replace(/\/$/, '') || '/');
                    }
                } catch (e) { }
            }
        });

        // Build hierarchy from path strings
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

                if (index === parts.length - 1) {
                    existingPath.url = `${baseUrl}/${parts.join('/')}`;
                }
                currentLevel = existingPath.children;
            });
        });

        res.json(tree);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to crawl site' });
    }
});

app.get('/api/meta', async (req, res) => {
    const { url } = req.query;
    if (!url) return res.status(400).json({ error: 'URL is required' });

    try {
        const response = await axios.get(url, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36' },
            timeout: 8000
        });

        const $ = cheerio.load(response.data);

        const meta = {
            title: $('title').first().text().trim() || '',
            description: $('meta[name="description"]').attr('content') || $('meta[property="og:description"]').attr('content') || '',
            keywords: $('meta[name="keywords"]').attr('content') || '',
            ogImage: $('meta[property="og:image"]').attr('content') || '',
        };

        res.json(meta);
    } catch (error) {
        res.json({ title: '', description: '', keywords: '', ogImage: '' });
    }
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
