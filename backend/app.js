const path = require('path');
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const fetch = require('node-fetch');

require('dotenv').config({ path: path.join(__dirname, '.env') });

const app = express();
const router = express.Router();

app.use(cors());
app.use(express.json());

const globalForMongoose = global;
let connectionPromise = globalForMongoose.__summusMongooseConnectionPromise || null;

const readMongoUri = () => {
  const explicitCandidates = [
    process.env.MONGO_URI,
    process.env.MONGODB_URI,
    process.env.summus_MONGODB_URI,
  ];

  const dynamicCandidates = Object.entries(process.env)
    .filter(([key, value]) => key.endsWith('_MONGODB_URI') && typeof value === 'string' && value.trim())
    .map(([, value]) => value);

  return [...explicitCandidates, ...dynamicCandidates].find(
    (value) => typeof value === 'string' && value.trim()
  );
};

const connectToDatabase = async () => {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  const mongoUri = readMongoUri();
  if (!mongoUri) {
    throw new Error('MongoDB URI not configured. Expected MONGO_URI, MONGODB_URI, or *_MONGODB_URI');
  }

  if (!connectionPromise) {
    connectionPromise = mongoose.connect(mongoUri);
    globalForMongoose.__summusMongooseConnectionPromise = connectionPromise;
  }

  try {
    await connectionPromise;
  } catch (error) {
    globalForMongoose.__summusMongooseConnectionPromise = null;
    connectionPromise = null;
    throw error;
  }

  return mongoose.connection;
};

const userSchema =
  mongoose.models.User?.schema ||
  new mongoose.Schema({
    username: { type: String, unique: true },
    password: String,
    note: { type: String, default: '' },
  });

const User = mongoose.models.User || mongoose.model('User', userSchema);

const verifyToken = (req, res, next) => {
  const token = req.headers.authorization;
  if (!token) {
    return res.status(401).json({ message: 'No token' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    return next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

const ensureDatabase = async (req, res, next) => {
  try {
    await connectToDatabase();
    return next();
  } catch (error) {
    console.error('Database connection failed:', error.message);
    return res.status(500).json({ message: 'Database connection failed' });
  }
};

router.get('/health', async (req, res) => {
  try {
    await connectToDatabase();
    return res.json({ ok: true, database: 'connected' });
  } catch (error) {
    return res.status(500).json({ ok: false, database: 'disconnected' });
  }
});

router.post('/register', ensureDatabase, async (req, res) => {
  const { username, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const user = new User({ username, password: hashedPassword });

  try {
    await user.save();
    return res.status(201).json({ message: 'User created' });
  } catch (error) {
    return res.status(400).json({ message: 'User exists' });
  }
});

router.post('/login', ensureDatabase, async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username });

  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET);
  return res.json({ token });
});

router.get('/note', ensureDatabase, verifyToken, async (req, res) => {
  const user = await User.findById(req.userId);
  return res.json({ note: user?.note || '' });
});

router.post('/note', ensureDatabase, verifyToken, async (req, res) => {
  await User.findByIdAndUpdate(req.userId, { note: req.body.note });
  return res.json({ message: 'Saved' });
});

const OPENAI_API_URL = 'https://api.openai.com/v1/responses';

const normalizeOpenAiRole = (role) => {
  if (role === 'assistant') return 'assistant';
  if (role === 'system' || role === 'developer') return 'developer';
  return 'user';
};

const buildOpenAiInput = (messages) =>
  messages
    .filter((message) => typeof message?.content === 'string' && message.content.trim())
    .map((message) => ({
      role: normalizeOpenAiRole(message.role),
      content: message.content.trim(),
    }));

const extractOpenAiText = (data) => {
  if (typeof data?.output_text === 'string' && data.output_text.trim()) {
    return data.output_text.trim();
  }

  const outputs = Array.isArray(data?.output) ? data.output : [];
  return outputs
    .flatMap((item) => (Array.isArray(item?.content) ? item.content : []))
    .filter((item) => item?.type === 'output_text' && typeof item.text === 'string')
    .map((item) => item.text)
    .join('\n')
    .trim();
};

router.post('/ai', async (req, res) => {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    const model = process.env.OPENAI_MODEL || 'gpt-5-mini';
    if (!apiKey) {
      console.error('OPENAI_API_KEY is missing');
      return res.status(500).json({ message: 'OPENAI_API_KEY not configured' });
    }

    const messages = Array.isArray(req.body.messages) ? req.body.messages : [];
    if (messages.length === 0) {
      return res.status(400).json({ message: 'No messages provided' });
    }

    const input = buildOpenAiInput(messages);
    if (input.length === 0) {
      return res.status(400).json({ message: 'No valid messages provided' });
    }

    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        input,
        text: { format: { type: 'text' } },
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      return res.status(response.status).json({
        message: data?.error?.message || 'AI request failed',
        code: data?.error?.code,
      });
    }

    const reply = extractOpenAiText(data);
    return res.json({ reply: reply || 'Sem resposta agora.', model });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Erro ao contactar AI' });
  }
});

app.use(router);
app.use('/api', router);

module.exports = app;
module.exports.connectToDatabase = connectToDatabase;
