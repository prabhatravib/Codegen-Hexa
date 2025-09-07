import { VoiceProvider } from './hooks/useVoiceInteraction'
import { CodeGenInterface } from './components/CodeGenInterface'
import { HexaWorker } from './components/HexaWorker'
import { useState } from 'react'
import { DiagramData } from './services/diagramCapture'

function App() {
  const [codeFlowStatus, setCodeFlowStatus] = useState<'sent' | 'not-sent'>('not-sent')
  const [diagramData, setDiagramData] = useState<DiagramData | null>(null)

  // Update diagram data when it changes
  const handleDiagramDataChange = (data: DiagramData | null) => {
    console.log('📊 App received diagram data:', data)
    setDiagramData(data)
    // Reset status when diagram data changes
    setCodeFlowStatus('not-sent')
  }

  // Update status when code flow is sent to hexagon worker
  const handleCodeFlowStatusChange = (status: 'sent' | 'not-sent') => {
    setCodeFlowStatus(status)
  }

  return (
    <VoiceProvider>
      <div className="min-h-screen" style={{ background: '#000' }}>
        <header className="py-6 text-center">
          <h1 className="text-4xl font-extrabold text-white">
            PiText <span className="text-[#FFD600]">CodeGen!</span>
          </h1>
          <p className="text-lg mt-2 text-gray-300">
            From idea to interactive code, instantly.
          </p>
          <p className="text-sm mt-1 text-gray-400">
            Try: <span className="text-[#FFD600] font-medium">"Build a Flask API for a todo app"</span> or{' '}
            <span className="text-[#FFD600] font-medium">"Create a React component for user profiles"</span>
          </p>
        </header>
        
        <main className="container mx-auto px-4 py-8">
          <div className="w-full">
            <CodeGenInterface 
              onDiagramDataChange={handleDiagramDataChange} 
              onCodeFlowStatusChange={handleCodeFlowStatusChange}
            />
          </div>
        </main>
        <HexaWorker 
          codeFlowStatus={codeFlowStatus}
          diagramData={diagramData}
        />
      </div>
    </VoiceProvider>
  )
}

export default App
