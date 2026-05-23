import Datastore from 'nedb-promises';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isTest = process.env.NODE_ENV === 'test';
const dataDir = path.join(__dirname, isTest ? 'data-test' : 'data');

// Ensure data directory exists
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

function createStore(name) {
  if (isTest) {
    // In-memory for tests (no file I/O conflicts)
    return Datastore.create();
  }
  return Datastore.create({ filename: path.join(dataDir, `${name}.db`), autoload: true });
}

const db = {
  users: createStore('users'),
  events: createStore('events'),
  eventMembers: createStore('event_members'),
  categories: createStore('categories'),
  tasks: createStore('tasks'),
  finances: createStore('finances'),
  messages: createStore('messages'),
  notifications: createStore('notifications'),
  groups: createStore('groups'),
  pushSubscriptions: createStore('push_subscriptions'),
};

// Ensure unique indexes
db.users.ensureIndex({ fieldName: 'email', unique: true });
db.users.ensureIndex({ fieldName: 'username', unique: true });

export default db;
