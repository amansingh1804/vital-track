---
description: Repository Information Overview
alwaysApply: true
---

# VitalTrack Information

## Summary
VitalTrack is a real-time patient monitoring system that enables healthcare professionals to track vital signs like ECG, SpO2, blood pressure, temperature, and limb movements. It features intelligent AI alerts that analyze vital sign data to determine the severity of threshold breaches and provide actionable recommendations.

## Structure
- **src/app**: Next.js application entry points and routing
- **src/components**: UI components including the main dashboard
- **src/ai**: AI integration with Genkit for intelligent alerts
- **src/hooks**: Custom React hooks for vitals monitoring and UI state
- **src/lib**: Utility functions, types, and placeholder data

## Language & Runtime
**Language**: TypeScript
**Version**: ES2017 target with Next.js 15.3.3
**Build System**: Next.js with Turbopack
**Package Manager**: npm

## Dependencies
**Main Dependencies**:
- **Next.js**: v15.3.3 - React framework for web applications
- **React**: v18.3.1 - UI library
- **Genkit**: v1.14.1 - AI integration framework
- **Radix UI**: Various components (v1.x-2.x) - Accessible UI components
- **Recharts**: v2.15.1 - Charting library for visualizing vital signs
- **Firebase**: v11.9.1 - Backend services
- **Zod**: v3.24.2 - Schema validation

**Development Dependencies**:
- **TypeScript**: v5.x - Type checking
- **Tailwind CSS**: v3.4.1 - Utility-first CSS framework
- **Genkit CLI**: v1.14.1 - Command-line tools for AI development

## Build & Installation
```bash
# Install dependencies
npm install

# Development with Turbopack
npm run dev

# AI development
npm run genkit:dev
npm run genkit:watch

# Production build
npm run build
npm run start

# Type checking
npm run typecheck
```

## AI Integration
**Framework**: Genkit v1.14.1
**Main Features**:
- Intelligent threshold alerts for vital sign monitoring
- Severity assessment (critical, warning, normal)
- Contextual recommendations based on patient data
**Implementation**: Server-side AI flows with prompt templates

## Main Components
**Dashboard**: Real-time visualization of patient vitals
**Vital Monitoring**: Tracks ECG, SpO2, blood pressure, temperature, and movement
**Alert System**: AI-powered notifications for threshold breaches
**Patient Management**: Patient information and medical history tracking

## Data Structure
**Vitals**: Heart rate, SpO2, blood pressure, ECG data, body movement, temperature
**Thresholds**: Configurable alert thresholds for each vital sign
**Alerts**: Severity-based notifications with recommendations
**Patient Data**: Name, age, and medical context information

## Hardware Integration
**Serial Connection**: Web Serial API for Arduino connectivity
**Data Format**: JSON-based communication protocol
**Mock Data**: Simulated vital signs when hardware is not connected