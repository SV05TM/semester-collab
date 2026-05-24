import { useState } from 'react';

const steps = [
  {
    icon: '🎓',
    title: 'Welcome to Semester Collab',
    description: 'Your all-in-one platform for managing semester events with your team. Plan, track, and collaborate — all in one place.',
    color: 'from-indigo-500 to-purple-600'
  },
  {
    icon: '📅',
    title: 'Create Events',
    description: 'Set up events with dates, times, and locations. Add your organization name and invite team members right from the start.',
    color: 'from-blue-500 to-cyan-500'
  },
  {
    icon: '📋',
    title: 'Assign Tasks',
    description: 'Break work into tasks organized by section — Finances, Marketing, Logistics, and more. Assign them to team members with deadlines.',
    color: 'from-emerald-500 to-teal-500'
  },
  {
    icon: '💰',
    title: 'Track Finances',
    description: 'Manage your event budget with the SFB format and track fundraising activities. Export to Excel when you need to submit reports.',
    color: 'from-amber-500 to-orange-500'
  },
  {
    icon: '📝',
    title: 'Meeting Notes',
    description: 'Document your planning sessions with agendas, discussion notes, action items, and decisions. Never lose track of what was discussed.',
    color: 'from-rose-500 to-pink-500'
  },
  {
    icon: '👥',
    title: 'Groups & Pinging',
    description: 'Organize members into groups. Ping individuals or entire groups with notifications that reach them even when the app is closed.',
    color: 'from-violet-500 to-purple-500'
  },
  {
    icon: '🚀',
    title: 'You\'re Ready!',
    description: 'Create your first event and start collaborating. Add it to your home screen for the best experience with push notifications.',
    color: 'from-indigo-600 to-purple-700'
  }
];

export default function OnboardingTutorial({ onComplete }) {
  const [currentStep, setCurrentStep] = useState(0);

  const next = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const prev = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1);
  };

  const skip = () => onComplete();

  const step = steps[currentStep];
  const isLast = currentStep === steps.length - 1;

  return (
    <div className="fixed inset-0 z-[200] bg-gray-900 flex flex-col">
      {/* Skip button */}
      {!isLast && (
        <div className="absolute top-4 right-4 z-10">
          <button onClick={skip} className="text-white/60 hover:text-white text-sm font-medium px-3 py-1.5 rounded-lg hover:bg-white/10 transition">
            Skip
          </button>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
        {/* Icon */}
        <div className={`w-24 h-24 sm:w-32 sm:h-32 bg-gradient-to-br ${step.color} rounded-3xl flex items-center justify-center mb-8 shadow-2xl`}>
          <span className="text-4xl sm:text-5xl">{step.icon}</span>
        </div>

        {/* Text */}
        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">{step.title}</h2>
        <p className="text-gray-400 text-base sm:text-lg max-w-md leading-relaxed">{step.description}</p>
      </div>

      {/* Bottom controls */}
      <div className="px-8 pb-8 sm:pb-12">
        {/* Progress dots */}
        <div className="flex justify-center gap-2 mb-6">
          {steps.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentStep(idx)}
              className={`h-2 rounded-full transition-all ${
                idx === currentStep ? 'w-8 bg-white' : 'w-2 bg-white/30'
              }`}
              aria-label={`Go to step ${idx + 1}`}
            />
          ))}
        </div>

        {/* Buttons */}
        <div className="flex gap-3 max-w-sm mx-auto">
          {currentStep > 0 && (
            <button
              onClick={prev}
              className="flex-1 py-3 rounded-xl text-white border border-white/20 font-medium hover:bg-white/10 transition"
            >
              Back
            </button>
          )}
          <button
            onClick={next}
            className={`flex-1 py-3 rounded-xl font-medium transition shadow-lg ${
              isLast
                ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-indigo-500/30'
                : 'bg-white text-gray-900 shadow-white/20'
            }`}
          >
            {isLast ? 'Get Started' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  );
}
