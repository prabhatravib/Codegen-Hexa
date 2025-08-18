import React from 'react'
import { CodeGenInterface } from './components/CodeGenInterface'
import { VoiceAgent } from './components/VoiceAgent'
import { VoiceProvider } from './hooks/useVoiceInteraction'
import { CodeGenProvider } from './store/codeGenStore'

function App() {
  return (
    <VoiceProvider>
      <CodeGenProvider>
        <div className="min-h-screen bg-background">
          <header className="border-b bg-card">
            <div className="container mx-auto px-4 py-4">
              <h1 className="text-2xl font-bold text-foreground">
                Voice CodeGen Hexa
              </h1>
              <p className="text-muted-foreground">
                AI-Powered Code Generation with Voice Assistant
              </p>
            </div>
          </header>
          
          <main className="container mx-auto px-4 py-8">
            {/* Code Generation Interface - Full Width */}
            <div className="w-full">
              <CodeGenInterface />
            </div>
          </main>
        </div>
      </CodeGenProvider>
    </VoiceProvider>
  )
}

export default App
