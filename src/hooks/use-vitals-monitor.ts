
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from './use-toast';
import type { PatientData, Vitals, Alert, Thresholds } from '../lib/types';
import { generateMockEcgData } from '../lib/utils';
import { assessThresholdBreach } from '../app/actions';

const ECG_DATA_LENGTH = 150;

const formSchema = z.object({
  patientName: z.string().default('Jane Doe'),
  patientAge: z.number().positive().default(45),
  patientContext: z.string().default('Patient has a history of hypertension.'),
  hrMax: z.number().positive().default(120),
  spo2Min: z.number().min(0).max(100).default(92),
  bpSystolicMax: z.number().positive().default(140),
  bpDiastolicMax: z.number().positive().default(90),
  tempMax: z.number().positive().default(38),
});

type FormSchema = z.infer<typeof formSchema>;

export function useVitalsMonitor() {
  const { toast } = useToast();
  const portRef = useRef<SerialPort | null>(null);

  const [connectionStatus, setConnectionStatus] = useState('Disconnected');
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  const [vitals, setVitals] = useState<Vitals>({
    heartRate: 72,
    spo2: 98,
    systolic: 120,
    diastolic: 80,
    ecgData: generateMockEcgData(ECG_DATA_LENGTH),
    bodyMovement: 'Still',
    temperature: 36.5,
  });

  const [patient, setPatient] = useState<PatientData>({
    patientName: 'Jane Doe',
    patientAge: 45,
    patientContext: 'Patient has a history of hypertension.',
  });

  const [thresholds, setThresholds] = useState<Thresholds>({
    hrMax: 120,
    spo2Min: 92,
    bpSystolicMax: 140,
    bpDiastolicMax: 90,
    tempMax: 38,
  });

  const [alerts, setAlerts] = useState<Alert[]>([]);

  const form = useForm<FormSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      ...patient,
      ...thresholds,
    },
  });

  const processData = useCallback(
    async (newData: Partial<Vitals>) => {
      setVitals(prevVitals => {
        const newEcgPoint = newData.ecgData?.[0] ?? { time: prevVitals.ecgData.length, value: 0 };
        const updatedEcg = [...prevVitals.ecgData.slice(1), newEcgPoint];

        const updatedVitals = {
          heartRate: newData.heartRate ?? prevVitals.heartRate,
          spo2: newData.spo2 ?? prevVitals.spo2,
          systolic: newData.systolic ?? prevVitals.systolic,
          diastolic: newData.diastolic ?? prevVitals.diastolic,
          ecgData: updatedEcg,
          bodyMovement: newData.bodyMovement ?? prevVitals.bodyMovement,
          temperature: newData.temperature ?? prevVitals.temperature,
        };

        // Threshold checking
        if (updatedVitals.heartRate && updatedVitals.heartRate > thresholds.hrMax) {
          handleThresholdBreach('Heart Rate', updatedVitals.heartRate, thresholds.hrMax);
        }
        if (updatedVitals.spo2 && updatedVitals.spo2 < thresholds.spo2Min) {
          handleThresholdBreach('SpO2', updatedVitals.spo2, thresholds.spo2Min);
        }
        if (updatedVitals.systolic && updatedVitals.systolic > thresholds.bpSystolicMax) {
          handleThresholdBreach('Systolic BP', updatedVitals.systolic, thresholds.bpSystolicMax);
        }
        if (updatedVitals.diastolic && updatedVitals.diastolic > thresholds.bpDiastolicMax) {
          handleThresholdBreach('Diastolic BP', updatedVitals.diastolic, thresholds.bpDiastolicMax);
        }
        if (updatedVitals.temperature && updatedVitals.temperature > thresholds.tempMax) {
            handleThresholdBreach('Temperature', updatedVitals.temperature, thresholds.tempMax);
        }

        return updatedVitals;
      });
    },
    [thresholds, patient]
  );
  
  const handleThresholdBreach = async (vitalSign: string, reading: number, threshold: number) => {
    const alertExists = alerts.some(a => a.vitalSign === vitalSign && Math.abs(new Date(a.timestamp).getTime() - Date.now()) < 30000);
    if(alertExists) return;

    const newAlert = await assessThresholdBreach({
        vitalSign,
        reading,
        threshold,
        patientContext: `${patient.patientName}, ${patient.patientAge} years old. ${patient.patientContext}`
    });

    if(newAlert) {
        setAlerts(prev => [newAlert, ...prev]);
        toast({
            title: `${newAlert.severity.toUpperCase()} Alert: ${newAlert.vitalSign}`,
            description: `Reading of ${newAlert.reading} breached threshold.`,
            variant: newAlert.severity === 'critical' ? 'destructive' : 'default',
        });
    }
  };


  useEffect(() => {
    // Mock data feed if not connected
    if (isConnected) return;

    const intervalId = setInterval(() => {
        const newEcgValue = generateMockEcgData(1)[0].value;
        const movement = ['Still', 'Slight', 'Moderate', 'High'];
        const mockData: Partial<Vitals> = {
            heartRate: 72 + Math.round((Math.random() - 0.5) * 5),
            spo2: 98,
            systolic: 120 + Math.round((Math.random() - 0.5) * 10),
            diastolic: 80 + Math.round((Math.random() - 0.5) * 5),
            ecgData: [{ time: Date.now(), value: newEcgValue }],
            bodyMovement: movement[Math.floor(Math.random() * movement.length)],
            temperature: 36.5 + (Math.random() - 0.5),
        };
        processData(mockData);
    }, 1000); // Changed to 1 second for more noticeable movement changes

    return () => clearInterval(intervalId);
  }, [isConnected, processData]);

  const connect = async () => {
    if (!('serial' in navigator)) {
      toast({ title: 'Error', description: 'Web Serial API not supported by your browser.', variant: 'destructive' });
      return;
    }

    setIsConnecting(true);
    setConnectionStatus('Awaiting selection...');

    try {
      const port = await navigator.serial.requestPort();
      portRef.current = port;
      setConnectionStatus('Opening port...');
      await port.open({ baudRate: 9600 });
      
      setIsConnected(true);
      setIsConnecting(false);
      setConnectionStatus('Connected');
      toast({ title: 'Success', description: 'Connected to Arduino.' });

      readLoop();
    } catch (error) {
      setIsConnecting(false);
      setConnectionStatus('Disconnected');
      if (error instanceof DOMException && error.name === 'NotFoundError') {
        toast({ title: 'Info', description: 'No device selected.'});
      } else {
        toast({ title: 'Connection Error', description: (error as Error).message, variant: 'destructive' });
      }
    }
  };

  const disconnect = async () => {
    const port = portRef.current;
    if (port && port.readable) {
      // Reader cancellation will be handled in readLoop
    }
    if (port) {
      await port.close();
      portRef.current = null;
    }
    setIsConnected(false);
    setConnectionStatus('Disconnected');
    toast({ title: 'Disconnected', description: 'Disconnected from device.' });
  };

  const readLoop = async () => {
    const port = portRef.current;
    if (!port || !port.readable) return;

    const reader = port.readable.getReader();
    let partialData = '';

    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) {
          break;
        }
        
        const textDecoder = new TextDecoder();
        const text = textDecoder.decode(value);
        
        const combinedData = partialData + text;
        const lines = combinedData.split('\n');
        
        partialData = lines.pop() || '';

        for (const line of lines) {
          if (line.trim()) {
            try {
              const data = JSON.parse(line.trim());
              processData(data);
            } catch (e) {
              console.warn('Could not parse JSON from serial:', line.trim());
            }
          }
        }
      }
    } catch (error) {
      console.error('Read loop error:', error);
      disconnect();
    } finally {
      reader.releaseLock();
    }
  };


  const updatePatient = (data: Pick<FormSchema, 'patientName' | 'patientAge' | 'patientContext'>) => {
    setPatient(data);
    toast({ title: 'Patient Info Updated' });
  };

  const updateThresholds = (data: Pick<FormSchema, 'hrMax' | 'spo2Min' | 'bpSystolicMax' | 'bpDiastolicMax' | 'tempMax'>) => {
    setThresholds(data);
    toast({ title: 'Thresholds Updated' });
  };
  
  const dismissAlert = (index: number) => {
    setAlerts(prev => prev.filter((_, i) => i !== index));
  };
  
  const markAlertsAsRead = () => {
    setAlerts(prev => prev.map(a => ({...a, isRead: true})));
  }

  return {
    state: {
      vitals,
      patient,
      thresholds,
      alerts,
      connectionStatus,
      isConnected,
      isConnecting,
    },
    actions: {
      connect,
      disconnect,
      updatePatient,
      updateThresholds,
      dismissAlert,
      markAlertsAsRead,
    },
    form,
  };
}
