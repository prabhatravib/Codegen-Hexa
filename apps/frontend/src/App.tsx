import { VoiceProvider } from './hooks/useVoiceInteraction'
import { CodeGenProvider } from './store/codeGenStore'
import { CodeGenInterface } from './components/CodeGenInterface'
import { VoiceAgent } from './components/VoiceAgent'

function App() {
  return (
    <VoiceProvider>
      <CodeGenProvider>
        <div className="min-h-screen">
          <header className="py-6 text-center">
            <h1 className="text-4xl font-extrabold">PiText <span className="text-[#FFD600]">CodeGen!</span></h1>
            <p className="banner-sub">From idea to interactive code, instantly.</p>
            <p className="banner-example">Try: <span className="text-[#FFD600] font-medium">"Build a Flask API for a todo app"</span> or <span className="text-[#FFD600] font-medium">"Create a React component for user profiles"</span></p>
          </header>
          <main className="container-card">
            <CodeGenInterface />
          </main>
          <VoiceAgent />
        </div>
      </CodeGenProvider>
    </VoiceProvider>
  )
}

export default App
