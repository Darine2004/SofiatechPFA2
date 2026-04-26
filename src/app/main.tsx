import '../styles/index.css'
import '../styles/theme.css'
import '../styles/fonts.css'
import '../styles/tailwind.css'
import '../../default_shadcn_theme.css'

import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)