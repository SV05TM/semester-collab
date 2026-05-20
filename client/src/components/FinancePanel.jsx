import { useState } from 'react';
import FundraisingPanel from './FundraisingPanel';
import BudgetPanel from './BudgetPanel';

export default function FinancePanel({ eventId, user, eventInfo }) {
  const [activeSection, setActiveSection] = useState('budget');

  return (
    <div>
      <div className="flex gap-1 mb-4 bg-white rounded-lg p-1 shadow-sm border w-fit">
        <button
          onClick={() => setActiveSection('budget')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition ${
            activeSection === 'budget'
              ? 'bg-indigo-600 text-white'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          📋 Event Budget
        </button>
        <button
          onClick={() => setActiveSection('fundraising')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition ${
            activeSection === 'fundraising'
              ? 'bg-indigo-600 text-white'
              : 'text-gray-600 hover:bg-gray-100'
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
