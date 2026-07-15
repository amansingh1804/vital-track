
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
  gender: z.string().default('Female'),
  bloodType: z.string().default('A+'),
  weight: z.string().default('62 kg'),
  height: z.string().default('165 cm'),
  hrMax: z.number().positive().default(120),
  spo2Min: z.number().min(0).max(100).default(92),
  bpSystolicMax: z.number().positive().default(140),
  bpDiastolicMax: z.number().positive().default(90),
  tempMax: z.number().positive().default(38),
});

type FormSchema = z.infer<typeof formSchema>;

export function useVitalsMonitor() {
  const { toast } = useToast();
  const portRef = useRef<any>(null);

  const [connectionStatus, setConnectionStatus] = useState('Disconnected');
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [activeBaudRate, setActiveBaudRate] = useState<number | null>(null);

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
    gender: 'Female',
    bloodType: 'A+',
    weight: '62 kg',
    height: '165 cm',
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

  const connect = async (selectedBaudRate: number = 9600) => {
    if (!('serial' in navigator)) {
      toast({ title: 'Error', description: 'Web Serial API not supported by your browser.', variant: 'destructive' });
      return;
    }

    setIsConnecting(true);
    setConnectionStatus('Awaiting selection...');

    try {
      const port = await (navigator as any).serial.requestPort();
      portRef.current = port;
      setConnectionStatus('Opening port...');
      await port.open({ baudRate: selectedBaudRate });
      
      setIsConnected(true);
      setIsConnecting(false);
      setConnectionStatus(`Connected (@${selectedBaudRate} bps)`);
      setActiveBaudRate(selectedBaudRate);
      toast({ title: 'Success', description: `Connected to Arduino at ${selectedBaudRate} baud.` });

      readLoop();
    } catch (error) {
      setIsConnecting(false);
      setConnectionStatus('Disconnected');
      setActiveBaudRate(null);
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
      try {
        await port.close();
      } catch (err) {
        console.warn('Error closing port:', err);
      }
      portRef.current = null;
    }
    setIsConnected(false);
    setConnectionStatus('Disconnected');
    setActiveBaudRate(null);
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
          const trimmed = line.trim();
          if (trimmed) {
            try {
              const data = JSON.parse(trimmed);
              processData(data);
            } catch (e) {
              // Try parsing with regex (smart fallback for plug-and-play raw values)
              const smartData: Partial<Vitals> = {};
              
              // Heart rate: hr, bpm, heart, heartrate, pulse
              const hrMatch = trimmed.match(/(?:hr|heart|bpm|pulse)[:=\s]*([0-9.]+)/i);
              if (hrMatch) smartData.heartRate = Math.round(parseFloat(hrMatch[1]));

              // SpO2: spo2, ox, oxygen
              const spo2Match = trimmed.match(/(?:spo2|ox|oxygen)[:=\s]*([0-9.]+)/i);
              if (spo2Match) smartData.spo2 = Math.round(parseFloat(spo2Match[1]));

              // Temperature: temp, temperature, deg
              const tempMatch = trimmed.match(/(?:temp|temperature|deg|cel)[:=\s]*([0-9.]+)/i);
              if (tempMatch) smartData.temperature = parseFloat(tempMatch[1]);

              // Blood pressure: BP: 120/80, bloodpressure: 120/80
              const bpMatch = trimmed.match(/(?:bp|pressure)[:=\s]*([0-9.]+)\s*[\/\-]\s*([0-9.]+)/i);
              if (bpMatch) {
                smartData.systolic = Math.round(parseFloat(bpMatch[1]));
                smartData.diastolic = Math.round(parseFloat(bpMatch[2]));
              } else {
                const sysMatch = trimmed.match(/(?:sys|systolic)[:=\s]*([0-9.]+)/i);
                if (sysMatch) smartData.systolic = Math.round(parseFloat(sysMatch[1]));
                const diaMatch = trimmed.match(/(?:dia|diastolic)[:=\s]*([0-9.]+)/i);
                if (diaMatch) smartData.diastolic = Math.round(parseFloat(diaMatch[1]));
              }

              // Body movement: move, movement, activity
              const moveMatch = trimmed.match(/(?:move|movement|activity)[:=\s]*([a-zA-Z]+)/i);
              if (moveMatch) {
                const moveVal = moveMatch[1].toLowerCase();
                if (['still', 'slight', 'moderate', 'high'].includes(moveVal)) {
                  smartData.bodyMovement = moveVal.charAt(0).toUpperCase() + moveVal.slice(1);
                } else {
                  smartData.bodyMovement = moveMatch[1];
                }
              }

              // CSV parsing fallback: if it contains commas and we got numeric tokens
              if (Object.keys(smartData).length === 0 && trimmed.includes(',')) {
                const parts = trimmed.split(',').map(p => p.trim());
                const nums = parts.map(p => parseFloat(p)).filter(n => !isNaN(n));
                // Standard mapping: HR, SpO2, SysBP, DiaBP, Temp
                if (nums.length >= 1) smartData.heartRate = Math.round(nums[0]);
                if (nums.length >= 2) smartData.spo2 = Math.round(nums[1]);
                if (nums.length >= 4) {
                  smartData.systolic = Math.round(nums[2]);
                  smartData.diastolic = Math.round(nums[3]);
                }
                if (nums.length >= 5) smartData.temperature = nums[4];
              }

              if (Object.keys(smartData).length > 0) {
                processData(smartData);
              } else {
                console.warn('Could not parse serial data:', trimmed);
              }
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

  const updatePatient = (data: Pick<FormSchema, 'patientName' | 'patientAge' | 'patientContext' | 'gender' | 'bloodType' | 'weight' | 'height'>) => {
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
  };

  return {
    state: {
      vitals,
      patient,
      thresholds,
      alerts,
      connectionStatus,
      isConnected,
      isConnecting,
      activeBaudRate,
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
