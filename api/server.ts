import 'dotenv/config';
import { createServer } from './app';
import { connectDatabase } from './config/db';

const PORT = process.env.PORT || 6969;

async function start() {
  // await connectDatabase();
  const app = createServer();
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

start();
