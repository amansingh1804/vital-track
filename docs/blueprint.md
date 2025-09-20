# **App Name**: VitalTrack

## Core Features:

- Real-Time Data Acquisition: Fetch physiological data (ECG, SpO2, etc.) transmitted from the Arduino sensors in real-time via serial communication.
- Data Visualization: Display real-time sensor readings in interactive and dynamic charts and graphs using React libraries.
- Threshold Alerting: Configure thresholds for each vital sign. When a reading exceeds a threshold, the app will display an alert using AI as a tool to determine whether an abnormality needs notification or not.
- Historical Data Logging: Record sensor data to local storage, creating a historical log of patient vitals. This is only stored client side and does not create connections to external databases.
- Patient Demographics: Capture a minimal set of demographic data for patient identification and context.
- Connectivity Status: Monitor the connection status with the Arduino device, indicating whether data is actively being received.

## Style Guidelines:

- Primary color: Calming blue (#4681C4), evoking trust and reliability appropriate for medical contexts.
- Background color: Light gray (#E5E8EC), providing a clean and unobtrusive backdrop for vital signs data.
- Accent color: Vibrant orange (#E07A5F) for alerts and critical indicators, commanding attention.
- Body and headline font: 'Inter', a grotesque-style sans-serif providing a clean and neutral look, making it very readable at various sizes.
- Use clear, consistent icons to represent different vital signs and functions, aiding quick recognition.
- Prioritize a clean and intuitive layout, ensuring vital information is readily accessible and easy to interpret at a glance. Inspired by designs in Figma.
- Subtle transitions and animations can be used to provide visual feedback on user interactions and data updates, without being distracting.