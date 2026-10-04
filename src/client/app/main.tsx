import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { EditorShell } from './EditorShell'
import { AuthGate } from '../components/auth/AuthGate'
import { ErrorBoundary } from '../components/ui/ErrorBoundary'
import { applyTheme, getStoredTheme } from '../lib/theme'
import './index.css'

applyTheme(getStoredTheme())

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary area="app">
      <AuthGate>
        <BrowserRouter>
          {/* Editor routes can throw during mount; a boundary here degrades to
              a recoverable message instead of unmounting the whole tree. */}
          <ErrorBoundary area="editor">
            <Routes>
              <Route path="/" element={<EditorShell />} />
              <Route path="/project/:projectId" element={<EditorShell />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </ErrorBoundary>
        </BrowserRouter>
      </AuthGate>
    </ErrorBoundary>
  </React.StrictMode>
)
