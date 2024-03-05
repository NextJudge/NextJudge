import { useState } from 'react'
import './App.css'
import Home from '@/routes/home'
import Navbar from '@/routes/navbar'
import { ThemeProvider } from "@/components/theme-provider"



function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      {
        <div>
          <Navbar/>   
          <Home/>
      </div>
    }
    </ThemeProvider>
  )
}

export default App
