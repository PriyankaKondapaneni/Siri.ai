import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

import authRouter from './routes/auth.js';
import tasksRouter from './routes/tasks.js';
import notesRouter from './routes/notes.js';
import eventsRouter from './routes/events.js';
import emailsRouter from './routes/emails.js';
import chatRouter from './routes/chat.js';
import assistantRouter from './routes/assistant.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
app.use(cors());
app.use(express.json({ limit: '2mb' }));

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, app: 'siri.ai', hasClaudeKey: Boolean(process.env.ANTHROPIC_API_KEY) });
});

app.use('/api/auth', authRouter);
app.use('/api/tasks', tasksRouter);
app.use('/api/notes', notesRouter);
app.use('/api/events', eventsRouter);
app.use('/api/emails', emailsRouter);
app.use('/api/chats', chatRouter);
app.use('/api/assistant', assistantRouter);

const clientDist = path.resolve(__dirname, '../../client/dist');
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`siri.ai server listening on http://localhost:${PORT}`);
  if (!process.env.ANTHROPIC_API_KEY) {
    console.warn('⚠️  ANTHROPIC_API_KEY not set — AI features will return stub responses.');
  }
});
