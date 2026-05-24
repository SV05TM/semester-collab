import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { beforeAll, afterAll } from 'vitest';

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
  // Ensure all indexes are created
  await Promise.all(
    Object.values(mongoose.connection.models).map(model => model.ensureIndexes())
  );
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});
