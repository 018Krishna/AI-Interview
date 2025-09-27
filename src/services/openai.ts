import OpenAI from 'openai'
import { v4 as uuid } from 'uuid'
import type { CandidateProfile, InterviewQuestion } from '@/types'
import { getFallbackQuestions } from '@/utils/questionBank'

const API_KEY = import.meta.env.VITE_OPENAI_API_KEY ?? ''
const MODEL = import.meta.env.VITE_OPENAI_MODEL ?? 'gpt-4.1-mini'

const client = API_KEY
  ? new OpenAI({
      apiKey: API_KEY,
      dangerouslyAllowBrowser: true,
    })
  : null

interface OpenAIQuestionResponse {
  prompt: string
  difficulty: 'easy' | 'medium' | 'hard'
  expectedKeywords?: string[]
}

export interface OpenAIQuestionRequest {
  profile: CandidateProfile
  resumeText?: string
}

function normalizeDifficulty(value: string): 'easy' | 'medium' | 'hard' {
  const lowered = value.toLowerCase()
  if (lowered.includes('hard')) return 'hard'
  if (lowered.includes('medium')) return 'medium'
  return 'easy'
}

function ensureClient() {
  if (!client) {
    throw new Error('OpenAI API key missing. Provide VITE_OPENAI_API_KEY in your environment.')
  }
  return client
}

async function callOpenAI(prompt: string) {
  const openai = ensureClient()
  return openai.responses.create({
    model: MODEL,
    temperature: 0.6,
    input: [
      {
        role: 'system',
        content:
          'You are an interviewer focusing on React and Node.js full stack skills. Generate concise, technical interview questions.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
  })
}

function parseOpenAIResponse(outputText: string): InterviewQuestion[] {
  try {
    const parsed = JSON.parse(outputText) as { questions?: OpenAIQuestionResponse[] }
    const questions = parsed.questions ?? []

    if (questions.length < 6) {
      throw new Error('OpenAI returned fewer than 6 questions.')
    }

    return questions.slice(0, 6).map((question) => ({
      id: uuid(),
      prompt: question.prompt,
      difficulty: normalizeDifficulty(question.difficulty),
      expectedKeywords: question.expectedKeywords?.slice(0, 6) ?? [],
    }))
  } catch (error) {
    console.error('Failed to parse OpenAI response', error, outputText)
    throw new Error('Failed to parse OpenAI response.')
  }
}

export async function generateOpenAIQuestions(
  request: OpenAIQuestionRequest,
): Promise<InterviewQuestion[]> {
  const intro = [
    request.profile.name ? `Candidate: ${request.profile.name}` : null,
    request.profile.email ? `Email: ${request.profile.email}` : null,
    request.profile.phone ? `Phone: ${request.profile.phone}` : null,
  ]
    .filter(Boolean)
    .join('\n')

  const prompt = `You are preparing a timed technical interview for a full-stack React/Node developer.
Resume snippet:
"""
${(request.resumeText ?? '').slice(0, 2000)}
"""

Return a JSON object with a "questions" array containing exactly 6 items ordered by difficulty: two easy, two medium, two hard.
Each item must be an object with keys: "prompt" (string question), "difficulty" (easy|medium|hard) and "expectedKeywords" (array of 3-5 keywords).
The questions must be concise and grounded in React, Node.js, TypeScript, system design, or web performance.`

  const payload = [intro, prompt].filter(Boolean).join('\n\n')

  let lastError: unknown

  try {
    const result = await callOpenAI(payload)
    const text = result.output_text
    if (!text) {
      throw new Error('OpenAI response missing text output.')
    }
    return parseOpenAIResponse(text)
  } catch (error) {
    lastError = error
  }

  throw new Error(
    lastError instanceof Error
      ? `OpenAI request failed: ${lastError.message}`
      : 'OpenAI request failed with an unknown error.',
  )
}

export async function generateQuestionsOrFallback(
  request: OpenAIQuestionRequest,
): Promise<InterviewQuestion[]> {
  try {
    return await generateOpenAIQuestions(request)
  } catch (error) {
    console.warn('Falling back to local question bank', error)
    return getFallbackQuestions()
  }
}
