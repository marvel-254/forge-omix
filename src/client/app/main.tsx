import React from 'react'
import ReactDOM from 'react-dom/client'
import { EditorShell } from './EditorShell'
import { AuthGate } from '../components/auth/AuthGate'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthGate>
      <EditorShell />
    </AuthGate>
  </React.StrictMode>
)
