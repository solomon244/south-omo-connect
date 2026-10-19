import { Router } from 'express';
import OpenAI from 'openai';
const router = Router();

router.post('/listing', async (req, res) => {
  const { title, category, details, language = 'English' } = req.body;
  if (!String(title || '').trim()) return res.status(400).json({ message: 'A product or service title is required.' });
  const safeTitle = String(title).trim().slice(0, 120);
  const safeDetails = String(details || '').trim().slice(0, 1000);
  if (process.env.OPENAI_API_KEY) {
    try {
      const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      const completion = await client.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        temperature: 0.4,
        messages: [
          { role: 'system', content: 'You help rural small businesses write clear, honest marketplace listings. Never invent origin, certifications, cultural facts, stock, quality claims, prices, or guarantees. Keep uncertainty explicit. Return a short title and description in the requested language. If details are missing, say buyers should confirm them.' },
          { role: 'user', content: `Write a marketplace listing in ${String(language).slice(0, 40)}. Title: ${safeTitle}. Category: ${String(category || 'Other').slice(0, 80)}. Producer-provided details: ${safeDetails || 'No additional details provided.'}. Return JSON with keys title and description.` }
        ], response_format: { type: 'json_object' }
      });
      const result = JSON.parse(completion.choices[0].message.content || '{}');
      return res.json({ ...result, mode: 'ai-api', reviewRequired: true });
    } catch (error) {
      console.error('AI provider unavailable; using fallback:', error.message);
    }
  }
  res.json({
    title: safeTitle,
    description: `${safeTitle} — ${String(category || 'local offer')}. ${safeDetails ? safeDetails + ' ' : ''}Please contact the producer to confirm current availability, specifications, collection or delivery arrangements, and any relevant details before ordering.`,
    mode: 'template-fallback', reviewRequired: true,
    note: 'AI API is not configured or unavailable. This draft was created from a local template; review it before publishing.'
  });
});
export default router;
