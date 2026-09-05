module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const url = 'https://polished-marten-120532.upstash.io';
  const token = 'gQAAAAAAAdbUAAIgcDEyOWY2OThnNWFlNDA0MGE0OGRmMwQyZg5NWEyYjlm';

  try {
    if (req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
      
      if (!body.answer) {
        const upstashRes = await fetch(url + '/', {
          method: 'POST',
          headers: {
            Authorization: 'Bearer ' + token,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(['DEL', 'proposal_answer'])
        });

        const upstashData = await upstashRes.json();
        return res.status(200).json({ success: true, reset: true, result: upstashData });
      }

      const answer = body.answer;
      const timestamp = body.timestamp || new Date().toLocaleString();
      const valToStore = JSON.stringify({ answer, timestamp });

      const upstashRes = await fetch(url + '/', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer ' + token,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(['SET', 'proposal_answer', valToStore])
      });

      const upstashData = await upstashRes.json();
      return res.status(200).json({ success: true, answer, timestamp, result: upstashData });
    }

    if (req.method === 'GET') {
      const upstashRes = await fetch(url + '/', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer ' + token,
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
    return res.status(500).json({ error: err.message });
  }
};
