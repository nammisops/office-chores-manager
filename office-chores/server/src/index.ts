import express from 'express';
import cors from 'cors';
import teamMembersRouter from './routes/teamMembers';
import choresRouter from './routes/chores';
import instancesRouter from './routes/instances';
import notificationsRouter from './routes/notifications';
import cronRouter from './routes/cron';
import { errorHandler } from './middleware/errorHandler';

const app = express();
const PORT = process.env.PORT ?? 3001;

app.use(cors());
app.use(express.json());

app.use('/api/team-members', teamMembersRouter);
app.use('/api/chores', choresRouter);
app.use('/api/instances', instancesRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/cron', cronRouter);

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
