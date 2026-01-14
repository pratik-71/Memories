# Implementation Plan - Special Day App

## App Overview
A professional mobile application for personal time-tracking and memory keeping. Users can track meaningful moments, measure time precisely, and celebrate milestones.

## Tech Stack
- **Framework**: React Native (Expo)
- **Styling**: NativeWind (Tailwind CSS) + Expo Linear Gradient
- **State Management**: Zustand
- **Backend**: Firebase (Auth + Firestore)

## Architecture & Data Structure

### 1. Firebase Collections
*   **users**: `uid`, `email`, `createdAt`
*   **moments**:
    *   `id`: string
    *   `userId`: string
    *   `title`: string
    *   `description`: string (optional)
    *   `startDate`: timestamp
    *   `type`: 'count_up' | 'countdown'
    *   `isPaused`: boolean
    *   `pausedAt`: timestamp (if paused)
    *   `accumulatedTime`: number (milliseconds)
    *   `backgroundImage`: string (url)
*   **milestones**:
    *   `id`: string
    *   `momentId`: string
    *   `type`: '1_week' | '100_days' | '1000_hours' | '1_year' ...
    *   `achievedAt`: timestamp

## Features Checklist

### Phase 1: Foundation & Auth
- [ ]  Setup Firebase Config
- [ ]  Implement Authentication Flow (Login/Signup)
- [ ]  Create Protected Routes (Auth Guard)

### Phase 2: Core Moment Management
- [ ]  **Create Moment Screen**: Form for Title, Date, Time, Type.
- [ ]  **Dashboard**: List of moment cards.
- [ ]  **Live Timer Hook**: Efficient `setInterval` logic to update UI every second without re-rendering everything.
- [ ]  **Precision Logic**: Handle time difference calculation including "stopped/frozen" states.

### Phase 3: Milestones & Celebrations
- [ ]  **Milestone Engine**: Logic to check for upcoming or passed milestones.
- [ ]  **Celebration UI**: Animations and messages when a milestone is reached.

### Phase 4: Polish & Notifications
- [ ]  Push Notifications for milestones.
- [ ]  Dark Mode optimizations.
- [ ]  Animations (Smooth card entry, timer ticks).

## Design Guidelines
- **Visuals**: Minimal, emotional, modern.
- **Interactions**: Smooth animations, glassmorphism effects using NativeWind.
- **Usability**: One-handed usage optimization.
