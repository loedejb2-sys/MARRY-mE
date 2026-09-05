module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const url = 'https://polished-marten-120532.upstash.io';
  const token = 'gQAAAAAAAdbUAAIgcDEyOWY2OThhNWFiNDA0MGE0OGRmNWQwYzg5NWEyYjlmNA';

  try {
    // 1. POST (Add entry or Clear all)
    if (req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});

      // Reset action
      if (!body.answer) {
        await fetch(url + '/', {
          method: 'POST',
          headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
          body: JSON.stringify(['DEL', 'proposal_history'])
        });
        return res.status(200).json({ success: true, reset: true });
      }

      // Read existing history array first
      const getRes = await fetch(url + '/', {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
        body: JSON.stringify(['GET', 'proposal_history'])
      });
      const getData = await getRes.json();
      let history = [];
      if (getData && getData.result) {
        try { history = JSON.parse(getData.result); } catch (e) {}
      }

      // Push new event
      const newEntry = {
        id: history.length + 1,
        answer: body.answer,
        timestamp: body.timestamp || new Date().toLocaleString()
      };
      history.push(newEntry);

      // Save updated history list back to Redis
      await fetch(url + '/', {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
        body: JSON.stringify(['SET', 'proposal_history', JSON.stringify(history)])
      });

      return res.status(200).json({ success: true, history });
    }

    // 2. GET (Fetch history array)
    if (req.method === 'GET') {
      const upstashRes = await fetch(url + '/', {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
        body: JSON.stringify(['GET', 'proposal_history'])
      });
      const data = await upstashRes.json();

      let history = [];
      if (data && data.result) {
        try { history = JSON.parse(data.result); } catch (e) {}
      }

      return res.status(200).json({ history });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
