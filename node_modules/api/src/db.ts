import 'dotenv/config';
import { MongoClient, Db, ObjectId } from 'mongodb';

const uri = process.env.MONGODB_URI as string;
const dbName = process.env.MONGODB_DB as string;
if (!uri) throw new Error('MONGODB_URI no definida');
if (!dbName) throw new Error('MONGODB_DB no definida');

let client: MongoClient;
let clientPromise: Promise<MongoClient>;
let _db: Db;

declare global { var _mongoClientPromise: Promise<MongoClient> | undefined; }

export function asId(id: string) { return new ObjectId(id); }

export async function getDb(): Promise<Db> {
  if (_db) return _db;
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri);
    global._mongoClientPromise = client.connect();
  }
  client = await global._mongoClientPromise;
  _db = client.db(dbName);
  return _db;
}
