const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

let latestResponse = {
  answer: null,
  timestamp: null
};

// Receives her click answer
app.post('/api/response', (req, res) => {
  const { answer, timestamp } = req.body;
  latestResponse = { answer, timestamp };
  console.log(`[ALERT] She clicked: ${answer} at ${timestamp}`);
  res.json({ success: true });
});

// Sends choice data to your dashboard
app.get('/api/response', (req, res) => {
  res.json(latestResponse);
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
