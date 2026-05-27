import { Router } from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();
router.use(authenticateToken);

const GEMINI_KEY = process.env.GEMINI_API_KEY || '';

function getModel() {
  if (!GEMINI_KEY) return null;
  const genAI = new GoogleGenerativeAI(GEMINI_KEY);
  return genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
}

const SYSTEM_PROMPT = `You are an AI assistant for Semester Collab, a team collaboration app used by university student organizations to plan semester events. You help with:

- Event planning and logistics
- Creating meeting agendas
- Breaking down tasks and suggesting assignments
- Budget planning and fundraising ideas
- Marketing strategies for campus events
- Writing event descriptions and promotional copy
- Suggesting timelines and deadlines
- Resolving team coordination issues

Keep responses concise, practical, and actionable. Use bullet points when listing items. You're talking to college students planning events for their organizations.`;

router.post('/chat', async (req, res) => {
  try {
    const { message, context } = req.body;

    if (!message) return res.status(400).json({ error: 'Message is required' });

    const model = getModel();
    if (!model) {
      return res.status(503).json({ error: 'AI assistant is not configured. Add GEMINI_API_KEY to environment variables.' });
    }

    // Build context-aware prompt
    let contextPrompt = '';
    if (context) {
      if (context.eventTitle) contextPrompt += `\nCurrent event: "${context.eventTitle}"`;
      if (context.organization) contextPrompt += `\nOrganization: ${context.organization}`;
      if (context.eventDate) contextPrompt += `\nEvent date: ${context.eventDate}`;
      if (context.eventLocation) contextPrompt += `\nLocation: ${context.eventLocation}`;
      if (context.tasks) contextPrompt += `\nCurrent tasks: ${context.tasks}`;
      if (context.budget) contextPrompt += `\nBudget info: ${context.budget}`;
    }

    const fullPrompt = `${SYSTEM_PROMPT}${contextPrompt}\n\nUser: ${message}`;

    const result = await model.generateContent(fullPrompt);
    const response = result.response.text();

    res.json({ response });
  } catch (err) {
    console.error('AI error:', err.message, err.stack);
    console.error('AI full error:', JSON.stringify(err, Object.getOwnPropertyNames(err)));
    if (err.message?.includes('API_KEY') || err.message?.includes('API key')) {
      return res.status(503).json({ error: 'Invalid API key. Check your GEMINI_API_KEY.' });
    }
    res.status(500).json({ error: `AI error: ${err.message || 'Unknown error'}` });
  }
});

// Generate random event ideas
router.get('/event-ideas', async (req, res) => {
  try {
    const model = getModel();
    if (!model) return res.status(503).json({ error: 'AI not configured' });

    const prompt = `${SYSTEM_PROMPT}\n\nGenerate 3 creative and unique event ideas for a university student organization. For each event, provide:
- title: a catchy event name
- description: 1-2 sentence description
- type: one of (social, fundraiser, workshop, community-service, cultural, networking, academic)
- estimated_budget: a rough budget range like "$50-100"
- best_time: suggested time of semester (early, mid, late, any)

Make them diverse, creative, and realistic for college students. Mix different types.

Return ONLY a valid JSON array with these fields, no markdown or explanation.`;

    const result = await model.generateContent(prompt);
    let text = result.response.text().trim();
    text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    const ideas = JSON.parse(text);
    res.json({ ideas });
  } catch (err) {
    console.error('AI event-ideas error:', err.message);
    res.status(500).json({ error: 'Failed to generate event ideas' });
  }
});

// Quick action endpoints for common tasks
router.post('/suggest-tasks', async (req, res) => {
  try {
    const { eventTitle, eventType, description } = req.body;
    const model = getModel();
    if (!model) return res.status(503).json({ error: 'AI not configured' });

    const prompt = `${SYSTEM_PROMPT}\n\nGenerate a task breakdown for this event. Return as a JSON array of objects with "title", "category" (one of: Finances, Marketing, Logistics, General), and "priority" (low/medium/high/urgent).

Event: "${eventTitle}"
${description ? `Description: ${description}` : ''}
${eventType ? `Type: ${eventType}` : ''}

Return ONLY valid JSON array, no markdown or explanation.`;

    const result = await model.generateContent(prompt);
    let text = result.response.text().trim();
    // Strip markdown code fences if present
    text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    const tasks = JSON.parse(text);
    res.json({ tasks });
  } catch (err) {
    console.error('AI suggest-tasks error:', err.message);
    res.status(500).json({ error: 'Failed to generate task suggestions' });
  }
});

router.post('/generate-agenda', async (req, res) => {
  try {
    const { meetingTopic, eventTitle, attendeeCount, duration } = req.body;
    const model = getModel();
    if (!model) return res.status(503).json({ error: 'AI not configured' });

    const prompt = `${SYSTEM_PROMPT}\n\nGenerate a meeting agenda for a student organization meeting.

Topic: "${meetingTopic}"
${eventTitle ? `Related event: "${eventTitle}"` : ''}
${attendeeCount ? `Attendees: ~${attendeeCount} people` : ''}
${duration ? `Duration: ${duration} minutes` : ''}

Format it as a clean agenda with time allocations. Keep it practical and concise.`;

    const result = await model.generateContent(prompt);
    res.json({ agenda: result.response.text() });
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate agenda' });
  }
});

export default router;
