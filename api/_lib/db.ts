import { MongoClient, Db, ObjectId } from 'mongodb';

const uri = process.env.MONGODB_URI as string;
const dbName = process.env.MONGODB_DB as string;

if (!uri) throw new Error('MONGODB_URI no definida');
if (!dbName) throw new Error('MONGODB_DB no definida');

let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;

export function asId(id: string) {
  return new ObjectId(id);
}

export async function getDb(): Promise<Db> {
  if (cachedDb) return cachedDb;

  if (!cachedClient) {
    cachedClient = new MongoClient(uri, {
      maxPoolSize: 1, // Importante para serverless
    });
    await cachedClient.connect();
  }

  cachedDb = cachedClient.db(dbName);
  return cachedDb;
}
