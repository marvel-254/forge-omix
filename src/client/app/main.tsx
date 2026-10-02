import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { EditorShell } from './EditorShell'
import { AuthGate } from '../components/auth/AuthGate'
import { applyTheme, getStoredTheme } from '../lib/theme'
import './index.css'

applyTheme(getStoredTheme())

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthGate>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<EditorShell />} />
          <Route path="/project/:projectId" element={<EditorShell />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthGate>
  </React.StrictMode>
)
