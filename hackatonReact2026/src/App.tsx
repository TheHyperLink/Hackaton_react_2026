import { useState } from 'react'
import './App.css'
import UserNotes from './components/UserNotes'
import HalloweenBackground from "./components/background/HalloweenBackground"

function App() {

  return (
    <>
    
      <HalloweenBackground/>
      <div className="min-h-dvh  text-white">
        <UserNotes></UserNotes>
      </div>

    </>
  )
}

export default App
