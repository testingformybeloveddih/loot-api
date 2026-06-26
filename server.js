const express = require('express');
const cors = require('cors');
const app = express();
app.use(cors());
app.use(express.json());

let players = {};
let commands = [];

const API_KEY = "dih";
const STALE_TIMEOUT = 3000; // 3 ثوانٍ

function checkAuth(req, res, next) {
  const headerKey = req.headers['x-api-key'];
  const queryKey = req.query.key;
  if (headerKey === API_KEY || queryKey === API_KEY) {
    return next();
  }
  res.status(403).json({ error: 'ممنوع' });
}

// تنظيف اللاعبين المنقطعين
setInterval(() => {
  const now = Date.now();
  for (const [id, player] of Object.entries(players)) {
    if (now - player.lastUpdate > STALE_TIMEOUT) {
      delete players[id];
      console.log(`🗑️ تم حذف اللاعب ${player.username} (ID: ${id}) لانقطاع التحديث`);
    }
  }
}, 2000);

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

app.post('/command', checkAuth, (req, res) => {
  const { targetUserId, action, actualTargetUserId } = req.body;
  if (!targetUserId || !action) {
    return res.status(400).json({ error: 'ناقص targetUserId أو action' });
  }
  const cmd = {
    id: Date.now() + Math.random(),
    targetUserId,          // سيبقى كما هو (رقم أو نص)
    action,
    actualTargetUserId: actualTargetUserId || targetUserId,
    timestamp: Date.now()
  };
  commands.push(cmd);
  res.json({ success: true, commandId: cmd.id });
});

// ✅ التعديل الجوهري هنا
app.get('/commands/:userId', checkAuth, (req, res) => {
  const userId = req.params.userId; // نص
  const myCommands = commands.filter(cmd => String(cmd.targetUserId) === userId);
  commands = commands.filter(cmd => String(cmd.targetUserId) !== userId);
  res.json(myCommands);
});

app.delete('/command/:id', checkAuth, (req, res) => {
  commands = commands.filter(cmd => cmd.id != req.params.id);
  res.json({ success: true });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`API running on port ${PORT}`));
