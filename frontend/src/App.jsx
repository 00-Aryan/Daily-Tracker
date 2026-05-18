import React, { Component } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import Tasks from './pages/Tasks';
import DailyLog from './pages/DailyLog';
import StudyQA from './pages/StudyQA';
import JobTracker from './pages/JobTracker';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }
  componentDidCatch(error, info) {
    console.error('ProductivOS error:', error, info)
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center
                        min-h-screen bg-[#FAFAF5] text-center p-8">
          <p className="text-5xl mb-4">⚠️</p>
          <h2 className="text-lg font-semibold text-stone-700 mb-2">
            Something went wrong
          </h2>
          <p className="text-sm text-stone-400 mb-6">
            An unexpected error occurred.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="text-sm bg-[#F97316] hover:bg-[#EA6C00]
                       text-white px-4 py-2 rounded-lg
                       transition-colors duration-150">
            Refresh Page
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

function Layout() {
  return (
    <div className="flex h-screen overflow-hidden bg-[#FAFAF5]">
      <aside className="w-56 flex-shrink-0 h-full">
        <Sidebar />
      </aside>
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Navbar />
        <ErrorBoundary>
          <main className="flex-1 overflow-y-auto p-6">
            <Outlet />
          </main>
        </ErrorBoundary>
      </div>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/tasks" replace />} />
        <Route element={<Layout />}>
          <Route path="/tasks" element={<Tasks />} />
          <Route path="/daily-log" element={<DailyLog />} />
          <Route path="/study" element={<StudyQA />} />
          <Route path="/jobs" element={<JobTracker />} />
          <Route path="*" element={
            <div className="flex flex-col items-center justify-center
                            h-full py-24 text-center">
              <p className="text-6xl mb-4">🧭</p>
              <h2 className="text-lg font-semibold text-stone-700 mb-2">
                Page not found
              </h2>
              <p className="text-sm text-stone-400 mb-6">
                This page doesn't exist.
              </p>
              <a href="/tasks"
                 className="text-sm text-[#F97316] hover:underline">
                ← Back to Tasks
              </a>
            </div>
          } />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
