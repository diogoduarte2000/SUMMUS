const path = require('path');
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const fetch = require('node-fetch');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error(err));

const User = mongoose.model('User', new mongoose.Schema({
  username: { type: String, unique: true },
  password: String,
  note: { type: String, default: '' }
}));

// Middleware to verify token
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization;
  if (!token) return res.status(401).json({ message: 'No token' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

app.post('/register', async (req, res) => {
  const { username, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const user = new User({ username, password: hashedPassword });
  try {
    await user.save();
    res.status(201).json({ message: 'User created' });
  } catch (err) {
    res.status(400).json({ message: 'User exists' });
  }
});

app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username });
  if (!user || !await bcrypt.compare(password, user.password)) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }
  const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET);
  res.json({ token });
});

app.get('/note', verifyToken, async (req, res) => {
  const user = await User.findById(req.userId);
  res.json({ note: user.note });
});

app.post('/note', verifyToken, async (req, res) => {
  await User.findByIdAndUpdate(req.userId, { note: req.body.note });
  res.json({ message: 'Saved' });
});

let cachedModel = null;
let cachedVersion = null;

const fetchAvailableModel = async (apiKey) => {
  const versions = ['v1', 'v1beta'];
  for (const version of versions) {
    try {
      const resp = await fetch(
        `https://generativelanguage.googleapis.com/${version}/models?key=${apiKey}`
      );
      const data = await resp.json();
      if (!resp.ok) continue;
      const models = Array.isArray(data.models) ? data.models : [];
      const pick =
        models.find(
          (m) =>
            (m.displayName || '').toLowerCase().includes('flash') &&
            (m.supportedGenerationMethods || []).includes('generateContent')
        ) ||
        models.find((m) => (m.supportedGenerationMethods || []).includes('generateContent')) ||
        null;
      if (pick) {
        return {
          version,
          model: pick.name.replace(/^models\//, ''),
        };
      }
    } catch (err) {
      // continue loop
    }
  }
  return null;
};

app.post('/ai', async (req, res) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    const preferredModel = (process.env.GEMINI_MODEL || 'gemini-1.5-flash').replace(
      /^models\//,
      ''
    );
    const preferredVersion = process.env.GEMINI_API_VERSION || 'v1';
    if (!apiKey) {
      console.error('GEMINI_API_KEY is missing');
      return res.status(500).json({ message: 'GEMINI_API_KEY not configured' });
    }

    const messages = Array.isArray(req.body.messages) ? req.body.messages : [];
    if (messages.length === 0) {
      return res.status(400).json({ message: 'No messages provided' });
    }

    const contents = messages.map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content || '' }],
    }));

    const attempts = [];
    attempts.push({ version: preferredVersion, model: preferredModel });
    attempts.push({ version: 'v1', model: 'gemini-1.5-flash' });
    attempts.push({ version: 'v1beta', model: 'gemini-1.5-flash' });

    if (cachedModel && cachedVersion) {
      attempts.unshift({ version: cachedVersion, model: cachedModel });
    }

    let lastError = null;
    for (const attempt of attempts) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/${attempt.version}/models/${attempt.model}:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents,
              generationConfig: { temperature: 0.7 },
            }),
          }
        );

        const data = await response.json();
        if (!response.ok) {
          lastError = data?.error || { message: 'AI request failed', code: response.status };
          if (
            lastError.message &&
            lastError.message.toLowerCase().includes('not found') &&
            !cachedModel
          ) {
            const discovered = await fetchAvailableModel(apiKey);
            if (discovered) {
              cachedModel = discovered.model;
              cachedVersion = discovered.version;
              attempts.push({ version: cachedVersion, model: cachedModel });
            }
          }
          continue;
        }

        const reply =
          data?.candidates?.[0]?.content?.parts?.[0]?.text ||
          (data?.candidates?.[0]?.content?.parts || []).map((p) => p.text).join('\n') ||
          '';
        cachedModel = attempt.model;
        cachedVersion = attempt.version;
        return res.json({ reply, model: attempt.model, version: attempt.version });
      } catch (innerErr) {
        lastError = { message: innerErr.message };
      }
    }

    return res.status(500).json({
      message: lastError?.message || 'AI request failed',
      code: lastError?.code,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erro ao contactar AI' });
  }
});

app.listen(5000, () => console.log('Server running on port 5000'));
