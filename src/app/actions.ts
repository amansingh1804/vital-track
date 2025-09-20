
'use server';

import {
  assessThresholdBreach as assessThresholdBreachFlow,
  type AssessThresholdBreachInput,
} from '../ai/flows/intelligent-threshold-alerts';
import type { Alert } from '../lib/types';

export async function assessThresholdBreach(
  input: AssessThresholdBreachInput
): Promise<Alert | null> {
  try {
    const result = await assessThresholdBreachFlow(input);
    if (result.severity === 'normal') {
      return null;
    }
    return { ...result, vitalSign: input.vitalSign, reading: input.reading, timestamp: new Date() };
  } catch (error) {
    console.error('Error assessing threshold breach:', error);
    return {
      severity: 'warning',
      vitalSign: input.vitalSign,
      reading: input.reading,
      reason: 'AI assessment failed. Please check manually.',
      recommendation: 'Manual check of patient vitals is required.',
      timestamp: new Date(),
    };
  }
}
