import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/semester-collab';

export async function connectDB() {
  if (process.env.NODE_ENV === 'test') return;
  const uri = process.env.MONGODB_URI;
  console.log('Attempting MongoDB connection...');
  console.log('URI exists:', !!uri);
  console.log('URI starts with:', uri ? uri.substring(0, 20) + '...' : 'undefined');
  try {
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 10000
    });
    console.log('Connected to MongoDB successfully');
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
    console.error('Full error:', JSON.stringify(err, null, 2));
    process.exit(1);
  }
}

// --- Schemas ---

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  organization: { type: String, default: '' },
  organizations: { type: [String], default: [] },
  created_at: { type: String, default: () => new Date().toISOString() }
});

const eventSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, default: '' },
  organization: { type: String, default: '' },
  start_date: String,
  end_date: String,
  event_time: String,
  event_location: { type: String, default: '' },
  created_by: { type: String, required: true },
  created_at: { type: String, default: () => new Date().toISOString() }
});

const eventMemberSchema = new mongoose.Schema({
  event_id: { type: String, required: true },
  user_id: { type: String, required: true },
  role: { type: String, default: 'member' },
  group: String
});

const categorySchema = new mongoose.Schema({
  event_id: { type: String, required: true },
  name: { type: String, required: true }
});

const taskSchema = new mongoose.Schema({
  event_id: { type: String, required: true },
  category_id: String,
  title: { type: String, required: true },
  description: { type: String, default: '' },
  assigned_to: String,
  status: { type: String, default: 'pending' },
  priority: { type: String, default: 'medium' },
  deadline: String,
  created_at: { type: String, default: () => new Date().toISOString() }
});

const financeSchema = new mongoose.Schema({
  event_id: { type: String, required: true },
  section: String,
  // Budget fields
  vendor: String,
  item_type: String,
  quantity: Number,
  price_per_item: Number,
  // Fundraising fields
  source: String,
  description: String,
  revenue: Number,
  expense: Number,
  amount: Number,
  type: String,
  status: String,
  created_by: { type: String, required: true },
  created_at: { type: String, default: () => new Date().toISOString() }
});

const messageSchema = new mongoose.Schema({
  event_id: { type: String, required: true },
  user_id: { type: String, required: true },
  content: { type: String, required: true },
  created_at: { type: String, default: () => new Date().toISOString() }
});

const notificationSchema = new mongoose.Schema({
  user_id: { type: String, required: true },
  event_id: String,
  message: { type: String, required: true },
  is_read: { type: Boolean, default: false },
  created_at: { type: String, default: () => new Date().toISOString() }
});

const groupSchema = new mongoose.Schema({
  event_id: { type: String, required: true },
  name: { type: String, required: true }
});

const pushSubscriptionSchema = new mongoose.Schema({
  user_id: { type: String, required: true },
  subscription: { type: Object, required: true },
  created_at: { type: String, default: () => new Date().toISOString() }
});

const meetingNoteSchema = new mongoose.Schema({
  event_id: { type: String, required: true },
  title: { type: String, required: true },
  meeting_date: String,
  attendees: [String],
  agenda: { type: String, default: '' },
  discussion: { type: String, default: '' },
  action_items: { type: Array, default: [] },
  decisions: { type: String, default: '' },
  created_by: { type: String, required: true },
  created_at: { type: String, default: () => new Date().toISOString() },
  updated_at: { type: String, default: () => new Date().toISOString() }
});

// --- Models ---

const User = mongoose.model('User', userSchema);
const Event = mongoose.model('Event', eventSchema);
const EventMember = mongoose.model('EventMember', eventMemberSchema);
const Category = mongoose.model('Category', categorySchema);
const Task = mongoose.model('Task', taskSchema);
const Finance = mongoose.model('Finance', financeSchema);
const Message = mongoose.model('Message', messageSchema);
const Notification = mongoose.model('Notification', notificationSchema);
const Group = mongoose.model('Group', groupSchema);
const PushSubscription = mongoose.model('PushSubscription', pushSubscriptionSchema);
const MeetingNote = mongoose.model('MeetingNote', meetingNoteSchema);

const friendSchema = new mongoose.Schema({
  user_id: { type: String, required: true },
  friend_id: { type: String, required: true },
  created_at: { type: String, default: () => new Date().toISOString() }
});

const Friend = mongoose.model('Friend', friendSchema);

// Export as a db object with the same interface pattern used in routes
const db = {
  users: User,
  events: Event,
  eventMembers: EventMember,
  categories: Category,
  tasks: Task,
  finances: Finance,
  messages: Message,
  notifications: Notification,
  groups: Group,
  pushSubscriptions: PushSubscription,
  meetingNotes: MeetingNote,
  friends: Friend
};

export default db;
