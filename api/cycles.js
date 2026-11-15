import { put, get } from '@vercel/blob';

const PATH = 'cycles/data.json';

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      const result = await get(PATH, { access: 'private' });
      if (!result || !result.stream) {
        return res.status(200).json({ entries: [] });
      }
      const text = await new Response(result.stream).text();
      res.setHeader('Cache-Control', 'no-store');
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      return res.status(200).send(text);
    }

    if (req.method === 'PUT') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      if (!body || !Array.isArray(body.entries)) {
        return res.status(400).json({ error: 'invalid payload' });
      }
      const entries = body.entries.filter(
        (e) => e && typeof e.id === 'string' && typeof e.start === 'string'
      );
      await put(PATH, JSON.stringify({ entries, updatedAt: Date.now() }), {
        access: 'private',
        allowOverwrite: true,
        addRandomSuffix: false,
        contentType: 'application/json',
      });
      return res.status(200).json({ ok: true, count: entries.length });
    }

    res.setHeader('Allow', 'GET, PUT');
    return res.status(405).json({ error: 'method not allowed' });
  } catch (err) {
    if (err && err.name === 'BlobNotFoundError') {
      return res.status(200).json({ entries: [] });
    }
    console.error('cycles api error', err && err.name);
    return res.status(500).json({ error: 'storage error' });
  }
}
