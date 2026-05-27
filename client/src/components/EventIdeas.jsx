import { useState, useEffect } from 'react';
import api from '../api';

const EVENT_IDEAS = [
  { title: 'Cultural Night', description: 'Showcase diverse cultures through food, performances, and art from different backgrounds.', type: 'cultural', estimated_budget: '$200-500', best_time: 'mid' },
  { title: 'Resume Workshop', description: 'Bring in career services to help students polish their resumes and LinkedIn profiles.', type: 'workshop', estimated_budget: '$50-100', best_time: 'early' },
  { title: 'Charity 5K Run', description: 'Organize a campus fun run to raise money for a local charity or cause.', type: 'fundraiser', estimated_budget: '$150-300', best_time: 'mid' },
  { title: 'Game Night Tournament', description: 'Host a bracket-style tournament with board games, video games, and prizes.', type: 'social', estimated_budget: '$75-150', best_time: 'any' },
  { title: 'Alumni Networking Mixer', description: 'Connect current students with alumni for career advice and mentorship opportunities.', type: 'networking', estimated_budget: '$100-250', best_time: 'late' },
  { title: 'Campus Cleanup Day', description: 'Volunteer event to beautify campus grounds, plant trees, and pick up litter.', type: 'community-service', estimated_budget: '$30-75', best_time: 'early' },
  { title: 'Study Jam Session', description: 'Reserve a space for group studying with free snacks, coffee, and tutors available.', type: 'academic', estimated_budget: '$50-100', best_time: 'mid' },
  { title: 'Open Mic Night', description: 'Give students a stage to perform poetry, music, comedy, or spoken word.', type: 'social', estimated_budget: '$100-200', best_time: 'any' },
  { title: 'Bake Sale Fundraiser', description: 'Sell homemade baked goods on campus to raise funds for your next big event.', type: 'fundraiser', estimated_budget: '$30-60', best_time: 'any' },
  { title: 'Movie Night Under the Stars', description: 'Set up an outdoor projector and screen a popular movie with popcorn and blankets.', type: 'social', estimated_budget: '$75-150', best_time: 'mid' },
  { title: 'Professional Headshot Day', description: 'Hire a photographer to take free professional headshots for students.', type: 'workshop', estimated_budget: '$200-400', best_time: 'early' },
  { title: 'Hackathon Weekend', description: '24-48 hour coding competition with teams building projects and winning prizes.', type: 'academic', estimated_budget: '$300-600', best_time: 'mid' },
  { title: 'Salsa Dance Class', description: 'Bring in an instructor to teach beginner salsa or bachata dancing.', type: 'cultural', estimated_budget: '$100-200', best_time: 'any' },
  { title: 'Mental Health Awareness Panel', description: 'Invite counselors and speakers to discuss stress management and wellness.', type: 'workshop', estimated_budget: '$50-100', best_time: 'mid' },
  { title: 'Clothing Swap', description: 'Students bring clothes they no longer wear and swap with others — sustainable fashion.', type: 'community-service', estimated_budget: '$20-50', best_time: 'any' },
  { title: 'Trivia Night', description: 'Host a pub-style trivia competition with themed rounds and team prizes.', type: 'social', estimated_budget: '$50-100', best_time: 'any' },
  { title: 'Startup Pitch Competition', description: 'Students pitch business ideas to a panel of judges for feedback and prizes.', type: 'academic', estimated_budget: '$200-400', best_time: 'late' },
  { title: 'Food Truck Festival', description: 'Bring multiple food trucks to campus for a lunchtime food festival.', type: 'social', estimated_budget: '$100-300', best_time: 'mid' },
  { title: 'Karaoke Night', description: 'Rent a karaoke machine and let students sing their hearts out with friends.', type: 'social', estimated_budget: '$75-150', best_time: 'any' },
  { title: 'Blood Drive', description: 'Partner with Red Cross to host a campus blood donation event.', type: 'community-service', estimated_budget: '$0-25', best_time: 'any' },
  { title: 'Photography Walk', description: 'Guided photo walk around campus or nearby areas to practice photography skills.', type: 'workshop', estimated_budget: '$10-30', best_time: 'early' },
  { title: 'Potluck Dinner', description: 'Everyone brings a dish from their culture or family tradition to share.', type: 'cultural', estimated_budget: '$25-50', best_time: 'any' },
  { title: 'Career Fair Prep Workshop', description: 'Practice elevator pitches, review resumes, and prep for upcoming career fairs.', type: 'academic', estimated_budget: '$25-50', best_time: 'early' },
  { title: 'Tie-Dye Party', description: 'Provide white t-shirts and dye for a colorful, hands-on social event.', type: 'social', estimated_budget: '$75-150', best_time: 'early' },
  { title: 'Panel: Life After Graduation', description: 'Recent grads share their experiences transitioning from college to career.', type: 'networking', estimated_budget: '$50-100', best_time: 'late' },
  { title: 'Volunteer at Food Bank', description: 'Organize a group trip to sort and distribute food at a local food bank.', type: 'community-service', estimated_budget: '$10-30', best_time: 'any' },
  { title: 'Escape Room Challenge', description: 'Book an escape room for team bonding or set up a DIY one on campus.', type: 'social', estimated_budget: '$100-250', best_time: 'any' },
  { title: 'Financial Literacy Workshop', description: 'Teach budgeting, investing basics, and student loan management.', type: 'workshop', estimated_budget: '$25-75', best_time: 'early' },
  { title: 'Talent Show', description: 'Students perform any talent — singing, dancing, magic, comedy — for prizes.', type: 'social', estimated_budget: '$150-300', best_time: 'late' },
  { title: 'Hiking Trip', description: 'Organize a group hike at a nearby trail with transportation provided.', type: 'social', estimated_budget: '$50-100', best_time: 'early' },
  { title: 'Coding Workshop for Beginners', description: 'Teach basic HTML/CSS or Python to students with no coding experience.', type: 'academic', estimated_budget: '$25-50', best_time: 'any' },
  { title: 'Friendsgiving Dinner', description: 'Pre-Thanksgiving dinner with your org — turkey, sides, and gratitude.', type: 'social', estimated_budget: '$100-200', best_time: 'late' },
  { title: 'Car Wash Fundraiser', description: 'Classic fundraiser — wash cars in a parking lot to raise money for your org.', type: 'fundraiser', estimated_budget: '$20-50', best_time: 'early' },
  { title: 'Guest Speaker Series', description: 'Invite a local entrepreneur, professor, or community leader to speak.', type: 'networking', estimated_budget: '$50-200', best_time: 'any' },
  { title: 'Art Gallery Night', description: 'Display student artwork in a gallery-style event with refreshments.', type: 'cultural', estimated_budget: '$75-150', best_time: 'late' },
  { title: 'Yoga in the Park', description: 'Free outdoor yoga session led by a certified instructor for stress relief.', type: 'community-service', estimated_budget: '$50-100', best_time: 'any' },
];

const TYPE_COLORS = {
  social: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300',
  fundraiser: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  workshop: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  'community-service': 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  cultural: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  networking: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300',
  academic: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300'
};

function getRandomIdeas(count = 3) {
  const shuffled = [...EVENT_IDEAS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

export default function EventIdeas() {
  const [ideas, setIdeas] = useState(() => getRandomIdeas());
  const [saving, setSaving] = useState(null);

  const refresh = () => setIdeas(getRandomIdeas());

  const bookmarkIdea = async (idea) => {
    setSaving(idea.title);
    try {
      await api.post('/bookmarks', idea);
      setTimeout(() => setSaving(null), 1500);
    } catch (err) {
      console.error('Failed to bookmark', err);
      setSaving(null);
    }
  };

  return (
    <div className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 dark:from-indigo-500/5 dark:to-purple-500/5 border border-indigo-200/50 dark:border-indigo-800/50 rounded-2xl p-5 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Event Ideas</h3>
        </div>
        <button
          onClick={refresh}
          className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-medium flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>

      <div className="space-y-2.5">
        {ideas.map((idea, idx) => (
          <div key={idx} className="bg-white dark:bg-slate-800 rounded-xl p-3.5 border border-slate-100 dark:border-slate-700 flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200">{idea.title}</h4>
                {idea.type && (
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${TYPE_COLORS[idea.type] || 'bg-gray-100 text-gray-600'}`}>
                    {idea.type}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">{idea.description}</p>
              <div className="flex gap-3 mt-1.5 text-[10px] text-slate-400 dark:text-slate-500">
                {idea.estimated_budget && <span>Budget: {idea.estimated_budget}</span>}
                {idea.best_time && <span>Best: {idea.best_time} semester</span>}
              </div>
            </div>
            <button
              onClick={() => bookmarkIdea(idea)}
              disabled={saving === idea.title}
              className="flex-shrink-0 p-2 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 disabled:opacity-50"
              aria-label={`Bookmark ${idea.title}`}
            >
              {saving === idea.title ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-500" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                </svg>
              )}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
