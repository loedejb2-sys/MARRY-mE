export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Directly set your Upstash URL and token from process.env fallback
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL || 'https://polished-marten-120532.upstash.io';
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;

  if (!token) {
    return res.status(500).json({ 
      error: 'Token missing. Please check Vercel environment variables or paste token into code.' 
    });
  }

  const baseUrl = url.replace(/\/$/, '');

  try {
    // 1. SAVE ANSWER (POST)
    if (req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
      const answer = body.answer || 'YES';
      const timestamp = body.timestamp || new Date().toLocaleString();
      const valToStore = JSON.stringify({ answer, timestamp });

      const upstashRes = await fetch(`${baseUrl}/`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(['SET', 'proposal_answer', valToStore])
      });

      const upstashData = await upstashRes.json();
      return res.status(200).json({ success: true, answer, timestamp, raw: upstashData });
    }

    // 2. FETCH ANSWER (GET)
    if (req.method === 'GET') {
      const upstashRes = await fetch(`${baseUrl}/`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(['GET', 'proposal_answer'])
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
    return res.status(500).json({ error: 'Execution failure', message: err.message });
  }
}
