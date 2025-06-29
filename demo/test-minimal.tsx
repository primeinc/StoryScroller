import React from 'react'
import { createRoot } from 'react-dom/client'

function MinimalTest() {
  return (
    <div style={{ padding: '20px', background: 'red', color: 'white' }}>
      <h1>React is working!</h1>
      <p>If you see this, React is rendering correctly.</p>
    </div>
  )
}

const container = document.getElementById('root')!
const root = createRoot(container)

root.render(<MinimalTest />)