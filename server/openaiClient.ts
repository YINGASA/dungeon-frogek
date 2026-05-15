import OpenAI from 'openai';

export const hasOpenAIKey = Boolean(process.env.OPENAI_API_KEY);

export const generateJsonWithOpenAI = async <T>(prompt: string): Promise<T | null> => {
  if (!hasOpenAIKey) return null;
  try {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.8,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: 'Return strict JSON only. No markdown.' },
        { role: 'user', content: prompt }
      ]
    });
    const text = response.choices[0]?.message?.content;
    return text ? (JSON.parse(text) as T) : null;
  } catch (error) {
    console.warn('OpenAI fallback:', error);
    return null;
  }
};
