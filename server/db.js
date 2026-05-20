import Datastore from 'nedb-promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, 'data');

const db = {
  users: Datastore.create({ filename: path.join(dataDir, 'users.db'), autoload: true }),
  events: Datastore.create({ filename: path.join(dataDir, 'events.db'), autoload: true }),
  eventMembers: Datastore.create({ filename: path.join(dataDir, 'event_members.db'), autoload: true }),
  categories: Datastore.create({ filename: path.join(dataDir, 'categories.db'), autoload: true }),
  tasks: Datastore.create({ filename: path.join(dataDir, 'tasks.db'), autoload: true }),
  finances: Datastore.create({ filename: path.join(dataDir, 'finances.db'), autoload: true }),
  messages: Datastore.create({ filename: path.join(dataDir, 'messages.db'), autoload: true }),
  notifications: Datastore.create({ filename: path.join(dataDir, 'notifications.db'), autoload: true }),
  groups: Datastore.create({ filename: path.join(dataDir, 'groups.db'), autoload: true }),
};

// Ensure unique indexes
db.users.ensureIndex({ fieldName: 'email', unique: true });
db.users.ensureIndex({ fieldName: 'username', unique: true });

export default db;
