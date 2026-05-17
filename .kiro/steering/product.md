# Product Overview — ProductivOS

## What It Is
ProductivOS is a personal full-stack productivity application built for a
Data Science student who struggles with fragmentation — plans, tasks, study
progress, and job applications scattered across notebooks, chats, and sheets.

One platform. Nothing gets lost. Everything is tracked and revisitable.

## Target User
Single user (Aryan Kumar) — final year B.S. Data Science student at IIT Madras.
Actively job hunting for DS/ML roles. Needs to track study progress, daily
reflections, tasks, and job applications in one place.

## Core Problem Being Solved
Plans get abandoned because there is no single thread to return to.
Notes get lost across tools. Study progress is invisible. Job applications
are untracked. This app fixes all four.

## Four Modules

### 1. Tasks + Backlog
Kanban board: Today | Done | Backlog
Two task types: General (title, priority, deadline, project) and
Study (subject → subtopic → problem → platform).
Auto-backlog at midnight. Manual drag between columns.
Progress tracking per subtopic over time.

### 2. Daily Log
Per-day reflection: what I did, blockers/feelings, tomorrow's intention.
Split view — tasks on left, log editor on right.
Journal scroll, date navigation, keyword search.

### 3. Adaptive Study Q&A
The most important module.
Gemini 1.5 Flash generates questions based on topic + user level + SWOT profile.
User answers in free text. Gemini evaluates. SM-2 algorithm calculates
numerical level score (1-10) per subtopic.
Wrong/weak answers repeat next day. Score tracked over time.
System starts at beginner and adapts up or down based on answers.

### 4. Job Tracker
Log applications: company, role, JD link, date, platform, resume version, status.
Resume performance analytics — which version gets responses.
Follow-up reminders after 7 days of no response.

## Current Build Status
- Backend: Complete (all routers live)
- Tasks page: Complete
- Daily Log page: Complete
- Job Tracker page: Complete
- Study Q&A: NOT STARTED — next to build

## Design Philosophy
- Minimal, professional, warm
- Color palette: deep navy sidebar (#0F172A), parchment content (#FAFAF5),
  saffron accent (#F97316)
- No bloat. No unnecessary features. Build exactly what is specced.
