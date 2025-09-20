// src/ai/flows/intelligent-threshold-alerts.ts
'use server';

/**
 * @fileOverview An intelligent threshold alerts AI agent that determines the severity of vital sign threshold breaches.
 *
 * - assessThresholdBreach - A function that assesses the severity of a threshold breach.
 * - AssessThresholdBreachInput - The input type for the assessThresholdBreach function.
 * - AssessThresholdBreachOutput - The return type for the assessThresholdBreach function.
 */

import {ai} from '../genkit';
import {z} from 'genkit';

const AssessThresholdBreachInputSchema = z.object({
  vitalSign: z.string().describe('The name of the vital sign that breached the threshold (e.g., heart rate, SpO2).'),
  reading: z.number().describe('The current reading of the vital sign.'),
  threshold: z.number().describe('The threshold that was breached.'),
  patientContext: z.string().describe('Additional context about the patient, such as age, medical history, and current condition.'),
});
export type AssessThresholdBreachInput = z.infer<typeof AssessThresholdBreachInputSchema>;

const AssessThresholdBreachOutputSchema = z.object({
  severity: z.enum(['critical', 'warning', 'normal']).describe('The severity of the threshold breach.'),
  reason: z.string().describe('The reason for the assigned severity level.'),
  recommendation: z.string().describe('A recommendation based on the severity of the breach.'),
});
export type AssessThresholdBreachOutput = z.infer<typeof AssessThresholdBreachOutputSchema>;

export async function assessThresholdBreach(input: AssessThresholdBreachInput): Promise<AssessThresholdBreachOutput> {
  return assessThresholdBreachFlow(input);
}

const prompt = ai.definePrompt({
  name: 'assessThresholdBreachPrompt',
  input: {schema: AssessThresholdBreachInputSchema},
  output: {schema: AssessThresholdBreachOutputSchema},
  prompt: `You are a medical expert assessing vital sign threshold breaches in patients.

  Based on the vital sign, reading, threshold, and patient context, determine the severity of the breach (critical, warning, or normal) and provide a reason and recommendation.

  Vital Sign: {{{vitalSign}}}
  Reading: {{{reading}}}
  Threshold: {{{threshold}}}
  Patient Context: {{{patientContext}}}

  Consider these factors when determining severity:
  - The specific vital sign and its normal range.
  - The magnitude of the breach (how far the reading is from the threshold).
  - The patient's overall medical history and current condition.

  Example Output:
  {
    "severity": "warning",
    "reason": "The heart rate is slightly above the threshold, but the patient has a history of anxiety, which can elevate heart rate.",
    "recommendation": "Monitor the patient's heart rate and check for other symptoms of anxiety."
  }`,
});

const assessThresholdBreachFlow = ai.defineFlow(
  {
    name: 'assessThresholdBreachFlow',
    inputSchema: AssessThresholdBreachInputSchema,
    outputSchema: AssessThresholdBreachOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
