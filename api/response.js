export default async function handler(req, res) {
  // Enable CORS so local/preview/production calls succeed
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Support both UPSTASH and Vercel KV environment variable names
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;

  if (!url || !token) {
    console.error("Missing Redis credentials in Vercel environment variables.");
    return res.status(500).json({ error: 'Missing Redis credentials in environment' });
  }

  try {
    // 1. SAVE RESPONSE (POST)
    if (req.method === 'POST') {
      const body = req.body || {};
      const answer = body.answer || 'YES';
      const timestamp = body.timestamp || new Date().toISOString();

      const payload = JSON.stringify({ answer, timestamp });

      // Store in Redis via Upstash REST API
      const upstashRes = await fetch(`${url}/set/proposal_answer/${encodeURIComponent(payload)}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!upstashRes.ok) {
        const errText = await upstashRes.text();
        console.error("Upstash SET error:", errText);
        return res.status(500).json({ error: 'Failed to write to Redis', details: errText });
      }

      return res.status(200).json({ success: true, answer, timestamp });
    }

    // 2. READ RESPONSE (GET)
    if (req.method === 'GET') {
      const upstashRes = await fetch(`${url}/get/proposal_answer`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!upstashRes.ok) {
        return res.status(200).json({ answer: null, timestamp: null });
      }

      const data = await upstashRes.json();

      // Upstash REST API returns { result: "string_value" }
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
    console.error("Serverless Handler Error:", err);
    return res.status(500).json({ error: 'Internal Server Error', details: err.message });
  }
}
