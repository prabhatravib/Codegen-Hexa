import { VoiceProvider } from './hooks/useVoiceInteraction'
import { CodeGenInterface } from './components/CodeGenInterface'
import { HexaWorker } from './components/HexaWorker'

function App() {
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
            <CodeGenInterface />
          </div>
        </main>
        <HexaWorker />
      </div>
    </VoiceProvider>
  )
}

export default App
