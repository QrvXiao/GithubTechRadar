import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import apiRoutes from './routes/api';
import { errorHandler } from './middleware/errorHandler';

dotenv.config();

const app: Application = express();

// middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI as string)
  .then(() => console.log('MongoDB connected'))
  .catch((err: Error) => console.error('MongoDB connection error:', err));

// routes 
app.use('/api', apiRoutes);

// Basic route
app.get('/', (req: Request, res: Response) => {
  res.send('Tech Radar API Running');
});

// error handling 
app.use(errorHandler);

const PORT: number = parseInt(process.env.PORT as string) || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));