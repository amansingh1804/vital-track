
'use client';

import * as React from 'react';
import {
  HeartPulse,
  Gauge,
  User,
  Settings,
  AlertTriangle,
  Bell,
  Plug,
  Unplug,
  Save,
  Loader,
  X,
  Menu,
  Move,
  Droplet,
  Thermometer,
  Edit,
  Activity,
  FileText,
  Check,
  Copy,
  Cpu,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
  PolarAngleAxis,
  RadialBar,
  RadialBarChart,
} from 'recharts';
import type { ChartConfig } from './ui/chart';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarTrigger,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
} from './ui/sidebar';
import { useVitalsMonitor } from '../hooks/use-vitals-monitor';
import { Logo } from './icons';
import { Alert as UIAlert, AlertDescription, AlertTitle } from './ui/alert';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from './ui/drawer';
import { ScrollArea } from './ui/scroll-area';
import { Separator } from './ui/separator';
import { useIsMobile } from '../hooks/use-mobile';
import { format } from 'date-fns';
import { cn } from '../lib/utils';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from './ui/sheet';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from './ui/tabs';

const ecgChartConfig = {
  value: {
    label: 'ECG',
    color: 'hsl(var(--chart-1))',
  },
} satisfies ChartConfig;

const spo2ChartConfig = {
  percentage: {
    label: 'SpO2',
    color: 'hsl(var(--chart-2))',
  },
} satisfies ChartConfig;

function ClientOnly({ children }: { children: React.ReactNode }) {
  const [hasMounted, setHasMounted] = React.useState(false);
  React.useEffect(() => {
    setHasMounted(true);
  }, []);

  if (!hasMounted) {
    return null;
  }

  return <>{children}</>;
}


export default function Dashboard() {
  const {
    state,
    actions,
    form,
  } = useVitalsMonitor();
  const isMobile = useIsMobile();
  const unreadAlerts = state.alerts.filter(a => !a.isRead).length;

  const [isPatientSheetOpen, setIsPatientSheetOpen] = React.useState(false);
  const [isConnectDialogOpen, setIsConnectDialogOpen] = React.useState(false);
  const [selectedBaudRate, setSelectedBaudRate] = React.useState(9600);
  const [isCopied, setIsCopied] = React.useState(false);

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const arduinoJsonCode = `// VitalTrack JSON Sender
#include <Arduino.h>

void setup() {
  Serial.begin(9600); // Or your selected baud rate
}

void loop() {
  // Print valid JSON stream
  Serial.print("{\\"heartRate\\":");
  Serial.print(random(65, 85));
  Serial.print(",\\"spo2\\":");
  Serial.print(random(95, 100));
  Serial.print(",\\"temperature\\":");
  Serial.print(36.5 + random(-5, 5)/10.0, 1);
  Serial.print(",\\"systolic\\":");
  Serial.print(random(115, 125));
  Serial.print(",\\"diastolic\\":");
  Serial.print(random(75, 85));
  Serial.print(",\\"bodyMovement\\":\\"Still\\"");
  Serial.println("}");
  
  delay(1000);
}`;

  const arduinoCsvCode = `// VitalTrack CSV Sender
#include <Arduino.h>

void setup() {
  Serial.begin(9600); // Or your selected baud rate
}

void loop() {
  // CSV Format: HR, SpO2, Systolic, Diastolic, Temp
  Serial.print(random(65, 85)); // Heart Rate
  Serial.print(",");
  Serial.print(random(95, 100)); // SpO2
  Serial.print(",");
  Serial.print(random(115, 125)); // Systolic BP
  Serial.print(",");
  Serial.print(random(75, 85)); // Diastolic BP
  Serial.print(",");
  Serial.println(36.5 + random(-5, 5)/10.0, 1); // Temp (with newline at the end)
  
  delay(1000);
}`;

  const arduinoTextCode = `// VitalTrack Key-Value Raw Text Sender
#include <Arduino.h>

void setup() {
  Serial.begin(9600); // Or your selected baud rate
}

void loop() {
  // The website's smart parser automatically extracts parameters using regex
  Serial.print("Pulse Rate: ");
  Serial.print(random(65, 85));
  Serial.print(" bpm | Oxygen Level: ");
  Serial.print(random(95, 100));
  Serial.print("% | Body Temp: ");
  Serial.print(36.2 + random(0, 10)/10.0);
  Serial.println("C");
  
  delay(1000);
}`;

  const sidebarContent = (
    <>
      <SidebarHeader className="p-4 border-b border-border bg-background/50">
        <div className="flex items-center gap-2.5">
          <Logo className="size-7 text-primary" />
          <h2 className="text-lg font-bold tracking-tight text-foreground">VitalTrack</h2>
        </div>
      </SidebarHeader>

      <SidebarContent className="p-4 pt-4 space-y-5">
        <div>
          <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">Serial Stream</h3>
          {state.isConnected ? (
            <div className="space-y-2">
              <Button onClick={actions.disconnect} className="w-full gap-2 h-9 bg-destructive hover:bg-destructive/90 text-destructive-foreground text-xs font-semibold">
                <Unplug className="size-4" /> Disconnect Device
              </Button>
              <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-2.5 text-center">
                <span className="text-xs text-emerald-400 font-medium">
                  Connected on USB ({state.activeBaudRate} bps)
                </span>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <Button 
                onClick={() => setIsConnectDialogOpen(true)} 
                className="w-full gap-2 h-9 text-xs font-semibold"
                variant="default"
              >
                <Plug className="size-4" /> Connect to Arduino
              </Button>
              <div className="rounded-lg bg-secondary/20 border border-border p-2.5 text-center">
                <span className="text-xs text-muted-foreground font-medium">
                  Streaming simulated vitals
                </span>
              </div>
            </div>
          )}
        </div>
        
        <Separator />
        
        <div>
          <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">Patient File</h3>
          <Button onClick={() => setIsPatientSheetOpen(true)} variant="outline" className="w-full justify-start gap-2 h-9 text-xs border-primary/10">
            <User className="size-4 text-primary" /> Edit Patient Information
          </Button>
        </div>
        
        <Separator />

        <div>
          <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">Alert Thresholds</h3>
          <form onSubmit={form.handleSubmit(actions.updateThresholds)} className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label htmlFor="hrMax" className="text-[10px] font-semibold text-muted-foreground">Heart Rate Max</Label>
                <Input id="hrMax" type="number" className="h-8 text-xs bg-background border-border" {...form.register('hrMax', { valueAsNumber: true })} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="spo2Min" className="text-[10px] font-semibold text-muted-foreground">SpO2 Min (%)</Label>
                <Input id="spo2Min" type="number" className="h-8 text-xs bg-background border-border" {...form.register('spo2Min', { valueAsNumber: true })} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="bpSystolicMax" className="text-[10px] font-semibold text-muted-foreground">Systolic BP Max</Label>
                <Input id="bpSystolicMax" type="number" className="h-8 text-xs bg-background border-border" {...form.register('bpSystolicMax', { valueAsNumber: true })} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="bpDiastolicMax" className="text-[10px] font-semibold text-muted-foreground">Diastolic BP Max</Label>
                <Input id="bpDiastolicMax" type="number" className="h-8 text-xs bg-background border-border" {...form.register('bpDiastolicMax', { valueAsNumber: true })} />
              </div>
              <div className="space-y-1 col-span-2">
                <Label htmlFor="tempMax" className="text-[10px] font-semibold text-muted-foreground">Temperature Max (°C)</Label>
                <Input id="tempMax" type="number" className="h-8 text-xs bg-background border-border" {...form.register('tempMax', { valueAsNumber: true })} />
              </div>
            </div>
            <Button type="submit" size="sm" className="w-full gap-1 h-8 text-xs bg-secondary/80 hover:bg-secondary text-secondary-foreground font-semibold"><Settings className="size-3" /> Save Thresholds</Button>
          </form>
        </div>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-border bg-background/50">
        <p className="text-[10px] text-muted-foreground text-center">&copy; 2026 VitalTrack System</p>
      </SidebarFooter>
    </>
  );

  const AlertList = ({ inDrawer }: { inDrawer?: boolean }) => (
    <ScrollArea className={inDrawer ? "h-[60svh]" : "h-full"}>
      <div className="space-y-4 p-1">
        {state.alerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
            <Bell className="size-10" />
            <p>No alerts yet.</p>
          </div>
        ) : (
          state.alerts.map((alert, index) => (
            <UIAlert
              key={index}
              variant={alert.severity === 'critical' ? 'destructive' : 'default'}
              className={cn(
                alert.severity === 'warning' && 'border-yellow-500/50 text-yellow-500 dark:border-yellow-500 [&>svg]:text-yellow-500',
                "relative"
              )}
            >
              <Button variant="ghost" size="icon" className="absolute top-2 right-2 h-6 w-6" onClick={() => actions.dismissAlert(index)}>
                <X className="size-4" />
              </Button>
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle className="capitalize font-bold">
                {alert.severity} Alert: {alert.vitalSign}
              </AlertTitle>
              <AlertDescription>
                <p><strong>Reading:</strong> {alert.reading}</p>
                <p><strong>Reason:</strong> {alert.reason}</p>
                <p><strong>Recommendation:</strong> {alert.recommendation}</p>
                <p className="text-xs text-muted-foreground mt-2">{format(alert.timestamp, "PPP p")}</p>
              </AlertDescription>
            </UIAlert>
          ))
        )}
      </div>
    </ScrollArea>
  );

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <Sidebar>{sidebarContent}</Sidebar>
        <SidebarInset>
          <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-background/80 px-4 backdrop-blur-sm sm:px-6">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="md:hidden" />
              <div>
                <h1 className="text-xl font-semibold">{state.patient.patientName || 'Patient Dashboard'}</h1>
                <p className="text-sm text-muted-foreground">Real-Time Monitoring</p>
              </div>
            </div>

            {isMobile ? (
              <Drawer onOpenChange={(open) => open && actions.markAlertsAsRead()}>
                <DrawerTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    {unreadAlerts > 0 && (
                      <span className="absolute top-0 right-0 flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-destructive"></span>
                      </span>
                    )}
                  </Button>
                </DrawerTrigger>
                <DrawerContent>
                  <DrawerHeader>
                    <DrawerTitle>Notifications</DrawerTitle>
                  </DrawerHeader>
                  <AlertList inDrawer />
                </DrawerContent>
              </Drawer>
            ) : (
              <div className="flex items-center gap-4">
                <ClientOnly>
                  <span className="text-sm text-muted-foreground">{format(new Date(), 'PPP')}</span>
                </ClientOnly>
              </div>
            )}
          </header>

          <main className="flex-1 p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {/* Top Patient Profile Banner Card */}
            <Card className="col-span-1 lg:col-span-3 xl:col-span-4 bg-gradient-to-r from-card/90 to-secondary/20 border-border relative overflow-hidden shadow-md rounded-xl p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div className="flex items-center gap-4 flex-1">
                <div className="relative">
                  <div className="size-14 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center font-bold text-lg text-primary tracking-wide shadow-inner">
                    {state.patient.patientName ? state.patient.patientName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'PT'}
                  </div>
                  {/* Pulse Ring Status indicator */}
                  <span className="absolute bottom-0 right-0 flex h-3.5 w-3.5">
                    <span className={cn(
                      "animate-ping absolute inline-flex h-full w-full rounded-full opacity-75",
                      state.alerts.some(a => a.severity === 'critical') ? 'bg-destructive' : 'bg-emerald-500'
                    )}></span>
                    <span className={cn(
                      "relative inline-flex rounded-full h-3.5 w-3.5 border-2 border-card",
                      state.alerts.some(a => a.severity === 'critical') ? 'bg-destructive' : 'bg-emerald-500'
                    )}></span>
                  </span>
                </div>
                
                <div className="space-y-1">
                  <div className="flex items-center gap-2.5">
                    <h2 className="text-xl font-bold text-foreground leading-none">{state.patient.patientName || 'Anonymous Patient'}</h2>
                    <span className="text-xs bg-muted px-2 py-0.5 rounded text-muted-foreground font-medium border border-border">
                      ID: #VT-{state.patient.patientAge || '45'}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <span><strong>Age:</strong> {state.patient.patientAge || '--'} yrs</span>
                    <span className="text-muted-foreground/30">•</span>
                    <span><strong>Gender:</strong> {state.patient.gender || '--'}</span>
                    <span className="text-muted-foreground/30">•</span>
                    <span><strong>Blood:</strong> {state.patient.bloodType || '--'}</span>
                    <span className="text-muted-foreground/30">•</span>
                    <span><strong>Weight:</strong> {state.patient.weight || '--'}</span>
                    <span className="text-muted-foreground/30">•</span>
                    <span><strong>Height:</strong> {state.patient.height || '--'}</span>
                  </div>
                </div>
              </div>

              <div className="flex-1 md:max-w-md bg-secondary/10 p-3 rounded-lg border border-border/50 text-xs">
                <span className="font-semibold text-muted-foreground uppercase tracking-wider text-[10px] block mb-1">Clinical Summary & Context</span>
                <p className="text-foreground/90 line-clamp-2 italic">
                  "{state.patient.patientContext || 'No medical record description provided.'}"
                </p>
              </div>

              <div className="flex items-center gap-3 w-full md:w-auto justify-end">
                <div className="text-right hidden sm:block">
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block">Source Protocol</span>
                  <span className="text-xs font-semibold text-foreground flex items-center gap-1">
                    <Activity className="size-3 text-primary animate-pulse" />
                    {state.isConnected ? `USB serial @ ${state.activeBaudRate || '9600'} baud` : 'Mock Vital Simulator'}
                  </span>
                </div>
                
                <Button 
                  onClick={() => setIsPatientSheetOpen(true)} 
                  variant="outline" 
                  size="sm" 
                  className="gap-1.5 h-9 font-medium text-xs border-primary/20 hover:bg-secondary/40 text-primary-foreground bg-primary/5"
                >
                  <Edit className="size-3.5" /> Edit Record
                </Button>
              </div>
            </Card>

            <Card className="lg:col-span-2 xl:col-span-2">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <HeartPulse className="text-primary" />
                  ECG
                </CardTitle>
                <div className="text-right">
                  <p className="text-3xl font-bold">{state.vitals.heartRate ?? '--'}</p>
                  <p className="text-sm text-muted-foreground">bpm</p>
                </div>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={state.vitals.ecgData}>
                    <defs>
                      <linearGradient id="colorEcg" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--chart-3))" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0.1} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis dataKey="time" hide />
                    <YAxis domain={['dataMin - 20', 'dataMax + 20']} hide />
                    <RechartsTooltip contentStyle={{ background: "hsl(var(--background))", border: "1px solid hsl(var(--border))" }} />
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke="hsl(var(--chart-3))"
                      fillOpacity={1}
                      fill="url(#colorEcg)"
                      isAnimationActive={false}
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gauge className="text-destructive" />
                  SpO2
                </CardTitle>
              </CardHeader>
              <CardContent className="flex items-center justify-center">
                <ClientOnly>
                  <ResponsiveContainer width="100%" height={200}>
                      <RadialBarChart
                          innerRadius="65%"
                          outerRadius="100%"
                          data={[{ name: 'spo2', value: state.vitals.spo2 ?? 0, fill: 'var(--color-percentage)' }]}
                          startAngle={180}
                          endAngle={-180}
                      >
                          <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                          <RadialBar background dataKey="value" angleAxisId={0} data={[{value: 100}]} fill="hsl(var(--muted))" />
                          <RadialBar dataKey="value" cornerRadius={10} />
                          <text
                              x="50%"
                              y="50%"
                              textAnchor="middle"
                              dominantBaseline="middle"
                              className="text-5xl font-bold fill-foreground"
                          >
                              {state.vitals.spo2 ?? '--'}
                          </text>
                          <text
                              x="50%"
                              y="65%"
                              textAnchor="middle"
                              dominantBaseline="middle"
                              className="text-lg fill-muted-foreground"
                          >
                              %
                          </text>
                      </RadialBarChart>
                  </ResponsiveContainer>
                </ClientOnly>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Droplet className="text-chart-4" />
                  Blood Pressure
                </CardTitle>
              </CardHeader>
              <CardContent className="flex items-center justify-center h-[200px]">
                <div className="text-center">
                  <p className="text-4xl font-bold">
                    {state.vitals.systolic ?? '--'}/{state.vitals.diastolic ?? '--'}
                  </p>
                  <p className="text-sm text-muted-foreground">mmHg</p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Thermometer className="text-chart-5" />
                  Temperature
                </CardTitle>
              </CardHeader>
              <CardContent className="flex items-center justify-center h-[200px]">
                <div className="text-center">
                  <p className="text-4xl font-bold">
                    {state.vitals.temperature != null ? state.vitals.temperature.toFixed(1) : '--'}
                  </p>
                  <p className="text-sm text-muted-foreground">°C</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Move className="text-chart-3" />
                  Body Movement
                </CardTitle>
              </CardHeader>
              <CardContent className="flex items-center justify-center h-[200px]">
                <p className="text-4xl font-bold capitalize">{state.vitals.bodyMovement ?? 'Still'}</p>
              </CardContent>
            </Card>

            <Card className="lg:col-span-3 xl:col-span-3 hidden xl:block">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell /> Alerts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <AlertList />
              </CardContent>
            </Card>
          </main>

          {/* Arduino Setup Dialog */}
          <Dialog open={isConnectDialogOpen} onOpenChange={setIsConnectDialogOpen}>
            <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto bg-card border-border">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-xl font-bold text-foreground">
                  <Cpu className="text-primary size-6" /> Arduino Setup & Connection
                </DialogTitle>
                <DialogDescription className="text-muted-foreground text-sm">
                  Configure your connection settings and copy standard Arduino starter sketches.
                </DialogDescription>
              </DialogHeader>
              
              <Tabs defaultValue="setup" className="w-full mt-4">
                <TabsList className="grid w-full grid-cols-4 bg-muted">
                  <TabsTrigger value="setup">Setup</TabsTrigger>
                  <TabsTrigger value="json">JSON Code</TabsTrigger>
                  <TabsTrigger value="csv">CSV Code</TabsTrigger>
                  <TabsTrigger value="text">Text Code</TabsTrigger>
                </TabsList>
                
                <TabsContent value="setup" className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="baudRate" className="text-sm font-semibold">Baud Rate (Bits Per Second)</Label>
                    <div className="grid grid-cols-5 gap-2">
                      {[9600, 19200, 38400, 57600, 115200].map((rate) => (
                        <Button
                          key={rate}
                          type="button"
                          variant={selectedBaudRate === rate ? 'default' : 'outline'}
                          className="h-9 text-xs"
                          onClick={() => setSelectedBaudRate(rate)}
                        >
                          {rate}
                        </Button>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Ensure this matches the <code className="bg-muted px-1 py-0.5 rounded text-primary font-mono">Serial.begin(baudRate)</code> parameter in your Arduino sketch.
                    </p>
                  </div>
                  
                  <div className="rounded-lg border bg-secondary/20 p-4 space-y-2">
                    <h4 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                      <Activity className="size-4 text-emerald-500 animate-pulse" /> Plug-and-Play Parsing
                    </h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Our system runs an intelligent parser. It will automatically detect data in <strong>JSON</strong>, <strong>CSV (Comma-Separated)</strong>, or <strong>Raw Key-Value pairs</strong> (e.g. <code className="text-primary font-mono">Pulse Rate: 75 bpm</code>) dynamically. Just plug your device, configure the baud rate, and stream!
                    </p>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <Button variant="outline" onClick={() => setIsConnectDialogOpen(false)}>Cancel</Button>
                    <Button onClick={() => {
                      setIsConnectDialogOpen(false);
                      actions.connect(selectedBaudRate);
                    }} className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-6">
                      Select Port & Start Stream
                    </Button>
                  </div>
                </TabsContent>
                
                <TabsContent value="json" className="space-y-3 pt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">Upload this code to stream via formatted JSON objects.</span>
                    <Button size="sm" variant="ghost" className="h-7 text-xs gap-1.5" onClick={() => handleCopy(arduinoJsonCode)}>
                      {isCopied ? <Check className="size-3 text-green-500" /> : <Copy className="size-3" />}
                      {isCopied ? 'Copied' : 'Copy Code'}
                    </Button>
                  </div>
                  <pre className="p-3 bg-muted rounded-md text-xs overflow-x-auto max-h-[300px] font-mono text-emerald-400 border border-border">
                    {arduinoJsonCode}
                  </pre>
                </TabsContent>
                
                <TabsContent value="csv" className="space-y-3 pt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">Upload this code to stream using comma-separated vital readings.</span>
                    <Button size="sm" variant="ghost" className="h-7 text-xs gap-1.5" onClick={() => handleCopy(arduinoCsvCode)}>
                      {isCopied ? <Check className="size-3 text-green-500" /> : <Copy className="size-3" />}
                      {isCopied ? 'Copied' : 'Copy Code'}
                    </Button>
                  </div>
                  <pre className="p-3 bg-muted rounded-md text-xs overflow-x-auto max-h-[300px] font-mono text-emerald-400 border border-border">
                    {arduinoCsvCode}
                  </pre>
                </TabsContent>

                <TabsContent value="text" className="space-y-3 pt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">Upload this code to stream using simple key-value tags.</span>
                    <Button size="sm" variant="ghost" className="h-7 text-xs gap-1.5" onClick={() => handleCopy(arduinoTextCode)}>
                      {isCopied ? <Check className="size-3 text-green-500" /> : <Copy className="size-3" />}
                      {isCopied ? 'Copied' : 'Copy Code'}
                    </Button>
                  </div>
                  <pre className="p-3 bg-muted rounded-md text-xs overflow-x-auto max-h-[300px] font-mono text-emerald-400 border border-border">
                    {arduinoTextCode}
                  </pre>
                </TabsContent>
              </Tabs>
            </DialogContent>
          </Dialog>

          {/* Patient Info Side Sheet popup */}
          <Sheet open={isPatientSheetOpen} onOpenChange={setIsPatientSheetOpen}>
            <SheetContent className="w-full sm:max-w-md overflow-y-auto bg-card border-l border-border p-6">
              <SheetHeader className="mb-6">
                <SheetTitle className="text-xl font-bold flex items-center gap-2 text-foreground">
                  <User className="size-5 text-primary" /> Patient Medical File
                </SheetTitle>
                <SheetDescription className="text-muted-foreground text-xs">
                  Update the active patient credentials, anthropometric measures, and clinical context.
                </SheetDescription>
              </SheetHeader>
              
              <form onSubmit={form.handleSubmit((data) => {
                actions.updatePatient(data);
                setIsPatientSheetOpen(false);
              })} className="space-y-4">
                <div className="space-y-1">
                  <Label htmlFor="patientName" className="text-xs font-semibold text-muted-foreground">Full Name</Label>
                  <Input id="patientName" className="bg-background border-border" {...form.register('patientName')} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label htmlFor="patientAge" className="text-xs font-semibold text-muted-foreground">Age (years)</Label>
                    <Input id="patientAge" type="number" className="bg-background border-border" {...form.register('patientAge', { valueAsNumber: true })} />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="gender" className="text-xs font-semibold text-muted-foreground">Gender</Label>
                    <Input id="gender" className="bg-background border-border" {...form.register('gender')} placeholder="Female / Male / Other" />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-1">
                    <Label htmlFor="bloodType" className="text-xs font-semibold text-muted-foreground">Blood Type</Label>
                    <Input id="bloodType" className="bg-background border-border" {...form.register('bloodType')} placeholder="A+" />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="weight" className="text-xs font-semibold text-muted-foreground">Weight</Label>
                    <Input id="weight" className="bg-background border-border" {...form.register('weight')} placeholder="62 kg" />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="height" className="text-xs font-semibold text-muted-foreground">Height</Label>
                    <Input id="height" className="bg-background border-border" {...form.register('height')} placeholder="165 cm" />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="patientContext" className="text-xs font-semibold text-muted-foreground">Medical History & Diagnosis</Label>
                  <Textarea id="patientContext" className="bg-background border-border" {...form.register('patientContext')} rows={5} placeholder="History of cardiovascular diseases, hypertension..." />
                </div>
                
                <div className="pt-4 flex gap-2">
                  <Button type="button" variant="outline" className="w-full" onClick={() => setIsPatientSheetOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold">
                    <Save className="mr-1.5 size-4" /> Save Record
                  </Button>
                </div>
              </form>
            </SheetContent>
          </Sheet>

        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
