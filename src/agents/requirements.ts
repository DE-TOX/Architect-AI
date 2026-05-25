import type { ArchitectureMode } from '../types/profile.js';
import { ARCHITECTURE_MODE_LABELS } from '../types/profile.js';

export interface InterviewQuestion {
  id: string;
  label: string;
  help?: string;
  type: 'text' | 'select';
  options?: Array<{ label: string; value: string }>;
  defaultValue?: string;
  allowSkip: boolean;
}

export const QUESTION_BANK: InterviewQuestion[] = [
  {
    id: 'projectName',
    label: 'Project name',
    help: 'A short codename — used as the document title.',
    type: 'text',
    allowSkip: false,
  },
  {
    id: 'summary',
    label: 'Describe the product in 1–2 sentences',
    help: 'What does it do, for whom?',
    type: 'text',
    allowSkip: false,
  },
  {
    id: 'projectType',
    label: 'Project type',
    type: 'select',
    options: [
      { label: 'SaaS web app', value: 'SaaS web app' },
      { label: 'Mobile app', value: 'Mobile app' },
      { label: 'Internal dashboard', value: 'Internal dashboard' },
      { label: 'CLI tool', value: 'CLI tool' },
      { label: 'API / backend service', value: 'API / backend service' },
      { label: 'AI-native product', value: 'AI-native product' },
      { label: 'Other', value: 'Other' },
    ],
    defaultValue: 'SaaS web app',
    allowSkip: true,
  },
  {
    id: 'expectedScale',
    label: 'Expected scale (users)',
    type: 'select',
    options: [
      { label: '<1k users', value: '<1k users' },
      { label: '~10k users in year 1', value: '~10k users in year 1' },
      { label: '~100k users', value: '~100k users' },
      { label: '1M+ users', value: '1M+ users' },
    ],
    defaultValue: '~10k users in year 1',
    allowSkip: true,
  },
  {
    id: 'expectedLoad',
    label: 'Expected request load',
    type: 'select',
    options: [
      { label: 'Low / occasional', value: 'Low / occasional' },
      { label: 'Steady moderate', value: 'Steady moderate' },
      { label: 'High throughput / bursty', value: 'High throughput / bursty' },
    ],
    defaultValue: 'Steady moderate',
    allowSkip: true,
  },
  {
    id: 'deploymentPreference',
    label: 'Deployment preference',
    type: 'select',
    options: [
      { label: 'No preference', value: 'No preference' },
      { label: 'Serverless (Vercel/Cloudflare)', value: 'Serverless' },
      { label: 'Container (Fly.io/Render/ECS)', value: 'Container' },
      { label: 'Self-hosted VPS', value: 'Self-hosted VPS' },
      { label: 'On-premise', value: 'On-premise' },
    ],
    defaultValue: 'No preference',
    allowSkip: true,
  },
  {
    id: 'authNeeds',
    label: 'Authentication needs',
    type: 'select',
    options: [
      { label: 'None / public', value: 'None / public' },
      { label: 'Email + password', value: 'Email + password' },
      { label: 'Social login', value: 'Social login' },
      { label: 'Enterprise SSO (SAML/OIDC)', value: 'Enterprise SSO' },
    ],
    defaultValue: 'Email + password',
    allowSkip: true,
  },
  {
    id: 'aiRequirements',
    label: 'AI requirements',
    type: 'select',
    options: [
      { label: 'None', value: 'None' },
      { label: 'Simple chat', value: 'Simple chat' },
      { label: 'RAG / retrieval', value: 'RAG / retrieval' },
      { label: 'Agentic workflows', value: 'Agentic workflows' },
    ],
    defaultValue: 'None',
    allowSkip: true,
  },
  {
    id: 'budgetSensitivity',
    label: 'Budget sensitivity',
    type: 'select',
    options: [
      { label: 'Tight (bootstrapped / hobby)', value: 'Tight' },
      { label: 'Moderate', value: 'Moderate' },
      { label: 'Generous (funded)', value: 'Generous' },
    ],
    defaultValue: 'Moderate',
    allowSkip: true,
  },
  {
    id: 'timeline',
    label: 'Timeline to first usable version',
    type: 'select',
    options: [
      { label: 'Weekend hack', value: 'Weekend hack' },
      { label: '1–2 weeks', value: '1–2 weeks' },
      { label: '1 month MVP', value: '1 month MVP' },
      { label: '3 month build', value: '3 month build' },
      { label: '6+ months', value: '6+ months' },
    ],
    defaultValue: '1 month MVP',
    allowSkip: true,
  },
  {
    id: 'mode',
    label: 'Architecture mode',
    help: 'Biases how the system makes tradeoffs.',
    type: 'select',
    options: (Object.entries(ARCHITECTURE_MODE_LABELS) as Array<[ArchitectureMode, string]>).map(
      ([value, label]) => ({ value, label }),
    ),
    defaultValue: 'mvp',
    allowSkip: false,
  },
];

export type InterviewAnswers = Record<string, string>;

