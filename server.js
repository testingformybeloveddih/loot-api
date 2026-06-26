const express = require('express');
const cors = require('cors');
const app = express();
app.use(cors());
app.use(express.json());

let players = {};
let commands = [];

const API_KEY = "dih";

function checkAuth(req, res, next) {
  if (req.headers['x-api-key'] !== API_KEY) {
    return res.status(403).json({ error: 'ممنوع' });
  }
  next();
}

app.post('/update', checkAuth, (req, res) => {
  const { userId, username, backpackItems, jobId, placeId } = req.body;
  if (!userId || !username || !jobId) {
    return res.status(400).json({ error: 'بيانات ناقصة' });
  }
  players[userId] = {
    userId,
    username,
    backpackItems: backpackItems || [],
    jobId,
    placeId: placeId || "0",
    lastUpdate: Date.now()
  };
  res.json({ success: true });
});

app.get('/players', checkAuth, (req, res) => {
  res.json(Object.values(players));
});

// route جديد: إرسال أمر مع هدف فعلي
app.post('/command', checkAuth, (req, res) => {
  const { targetUserId, action, actualTargetUserId } = req.body;
  if (!targetUserId || !action) {
    return res.status(400).json({ error: 'ناقص targetUserId أو action' });
  }
  const cmd = {
    id: Date.now() + Math.random(),
    targetUserId,          // أنت (اللي راح ينفذ)
    action,                // freeze, steal, etc.
    actualTargetUserId: actualTargetUserId || targetUserId,  // الضحية
    timestamp: Date.now()
  };
  commands.push(cmd);
  res.json({ success: true, commandId: cmd.id });
});

app.get('/commands/:userId', checkAuth, (req, res) => {
  const userId = req.params.userId;
  const myCommands = commands.filter(cmd => cmd.targetUserId === userId);
  commands = commands.filter(cmd => cmd.targetUserId !== userId);
  res.json(myCommands);
});

app.delete('/command/:id', checkAuth, (req, res) => {
  commands = commands.filter(cmd => cmd.id != req.params.id);
  res.json({ success: true });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`API running on port ${PORT}`));
