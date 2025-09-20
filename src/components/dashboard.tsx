
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

  const sidebarContent = (
    <>
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-2">
          <Logo className="size-8 text-primary" />
          <h2 className="text-xl font-semibold tracking-tight">VitalTrack</h2>
        </div>
      </SidebarHeader>

      <SidebarContent className="p-4 pt-0">
        <div className="space-y-6">
          <div>
            <h3 className="mb-2 text-sm font-medium text-muted-foreground">Connection</h3>
            <Button onClick={state.isConnected ? actions.disconnect : actions.connect} className="w-full" variant={state.isConnected ? 'destructive' : 'default'}>
              {state.isConnecting ? <Loader className="animate-spin" /> : state.isConnected ? <Unplug /> : <Plug />}
              {state.isConnecting ? 'Connecting...' : state.isConnected ? 'Disconnect' : 'Connect to Arduino'}
            </Button>
            <p className="mt-2 text-xs text-muted-foreground text-center">
              Status: <span className={state.isConnected ? 'text-green-500' : 'text-red-500'}>{state.connectionStatus}</span>
            </p>
          </div>
          
          <Separator />
          
          <div>
            <h3 className="mb-2 text-sm font-medium text-muted-foreground">Patient Details</h3>
            <form onSubmit={form.handleSubmit(actions.updatePatient)} className="space-y-2">
              <div>
                <Label htmlFor="patientName">Name</Label>
                <Input id="patientName" {...form.register('patientName')} />
              </div>
              <div>
                <Label htmlFor="patientAge">Age</Label>
                <Input id="patientAge" type="number" {...form.register('patientAge', { valueAsNumber: true })} />
              </div>
              <div>
                <Label htmlFor="patientContext">Medical History</Label>
                <Textarea id="patientContext" {...form.register('patientContext')} rows={3} />
              </div>
              <Button type="submit" size="sm" className="w-full">
                <Save /> Save Patient Info
              </Button>
            </form>
          </div>
          
          <Separator />

          <div>
            <h3 className="mb-2 text-sm font-medium text-muted-foreground">Alert Thresholds</h3>
            <form onSubmit={form.handleSubmit(actions.updateThresholds)} className="space-y-4">
              <div className="space-y-2">
                <div>
                  <Label htmlFor="hrMax">Heart Rate Max (bpm)</Label>
                  <Input id="hrMax" type="number" {...form.register('hrMax', { valueAsNumber: true })} />
                </div>
                <div>
                  <Label htmlFor="spo2Min">SpO2 Min (%)</Label>
                  <Input id="spo2Min" type="number" {...form.register('spo2Min', { valueAsNumber: true })} />
                </div>
                <div>
                  <Label htmlFor="bpSystolicMax">Systolic BP Max (mmHg)</Label>
                  <Input id="bpSystolicMax" type="number" {...form.register('bpSystolicMax', { valueAsNumber: true })} />
                </div>
                <div>
                  <Label htmlFor="bpDiastolicMax">Diastolic BP Max (mmHg)</Label>
                  <Input id="bpDiastolicMax" type="number" {...form.register('bpDiastolicMax', { valueAsNumber: true })} />
                </div>
                 <div>
                  <Label htmlFor="tempMax">Temp Max (°C)</Label>
                  <Input id="tempMax" type="number" {...form.register('tempMax', { valueAsNumber: true })} />
                </div>
              </div>
              <Button type="submit" size="sm" className="w-full"><Settings /> Set Thresholds</Button>
            </form>
          </div>
        </div>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t">
        <p className="text-xs text-muted-foreground">&copy; 2024 VitalTrack</p>
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
                    {state.vitals.temperature ?? '--'}
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
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
