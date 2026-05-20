import { useState } from 'react';
import FundraisingPanel from './FundraisingPanel';
import BudgetPanel from './BudgetPanel';

export default function FinancePanel({ eventId, user, eventInfo }) {
  const [activeSection, setActiveSection] = useState('budget');

  return (
    <div>
      <div className="flex gap-1 mb-5 bg-white rounded-xl p-1.5 shadow-sm border border-gray-100 w-fit">
        <button
          onClick={() => setActiveSection('budget')}
          className={`px-5 py-2.5 rounded-lg text-sm font-medium transition flex items-center gap-2 ${
            activeSection === 'budget'
              ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-500/25'
              : 'text-gray-600 hover:bg-gray-50'
          }`}
        >
          📋 Event Budget
        </button>
        <button
          onClick={() => setActiveSection('fundraising')}
          className={`px-5 py-2.5 rounded-lg text-sm font-medium transition flex items-center gap-2 ${
            activeSection === 'fundraising'
              ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-500/25'
              : 'text-gray-600 hover:bg-gray-50'
          }`}
        >
          💰 Fundraising
        </button>
      </div>

      {activeSection === 'budget' && <BudgetPanel eventId={eventId} user={user} eventInfo={eventInfo} />}
      {activeSection === 'fundraising' && <FundraisingPanel eventId={eventId} user={user} />}
    </div>
  );
}
