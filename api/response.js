module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Hardcoded values to eliminate Vercel Env Variable issues
  const url = 'https://polished-marten-120532.upstash.io';
  const token = 'gQAAAAAAAdbUAAIgcDEyOWY2OThnNWFlNDA0MGE0OGRmMwQyZg5NWEyYjlm...'; 

  try {
    // 1. POST (Save click)
    if (req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
      const answer = body.answer || 'YES';
      const timestamp = body.timestamp || new Date().toLocaleString();
      const payload = JSON.stringify({ answer, timestamp });

      const upstashRes = await fetch(`${url}/set/proposal_answer/${encodeURIComponent(payload)}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await upstashRes.json();
      return res.status(200).json({ success: true, answer, timestamp, result: data });
    }

    // 2. GET (Read status)
    if (req.method === 'GET') {
      const upstashRes = await fetch(`${url}/get/proposal_answer`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await upstashRes.json();

      if (data && data.result) {
        try {
          const parsed = typeof data.result === 'string' ? JSON.parse(data.result) : data.result;
          return res.status(200).json(parsed);
        } catch (e) {
          return res.status(200).json({ answer: data.result, timestamp: null });
        }
      }

      return res.status(200).json({ answer: null, timestamp: null });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
