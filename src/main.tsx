import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from 'sonner'
import App from './App'
import SpeedTestPage from './pages/SpeedTestPage'
import MapPage from './pages/MapPage'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Toaster
        position="bottom-right"
        theme="dark"
        toastOptions={{
          style: {
            background: '#091425',
            border: '1px solid rgba(0, 255, 136, 0.2)',
            color: 'white',
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: '13px',
          },
        }}
      />
      <Routes>
        <Route path="/" element={<SpeedTestPage />} />
        <Route path="/map" element={<MapPage />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
)
