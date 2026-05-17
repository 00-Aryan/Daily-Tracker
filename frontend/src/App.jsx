import { Component } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import Tasks from './pages/Tasks';
import DailyLog from './pages/DailyLog';
import StudyQA from './pages/StudyQA';
import JobTracker from './pages/JobTracker';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <p className="text-center text-stone-600 py-8">
          Something went wrong. Refresh the page.
        </p>
      );
    }
    return this.props.children;
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
        <main className="flex-1 overflow-y-auto p-6">
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </main>
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
          <Route
            path="*"
            element={
              <div className="p-8 text-center">
                <h2 className="text-xl font-semibold text-stone-700">Page not found</h2>
                <p className="text-stone-400 mt-2">This page doesn't exist.</p>
              </div>
            }
          />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
