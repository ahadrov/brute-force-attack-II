import { useState, useEffect, useRef } from 'react'
import './App.css'

function App() {
  const [targetUrl, setTargetUrl] = useState('http://localhost:3000/login')
  const [targetUsername, setTargetUsername] = useState('test2')
  const [attackType, setAttackType] = useState('dictionary')
  const [dictionary, setDictionary] = useState('rockyou.txt')
  const [characters, setCharacters] = useState('abcdefghijklmnopqrstuvwxyz0123456789')
  const [length, setLength] = useState(4)

  const [logs, setLogs] = useState([])
  const [isRunning, setIsRunning] = useState(false)
  const logsEndRef = useRef(null)

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const statusRes = await fetch('http://localhost:3001/api/status')
        const statusData = await statusRes.json()
        setIsRunning(statusData.isRunning)

        const logsRes = await fetch('http://localhost:3001/api/logs')
        const logsData = await logsRes.json()
        setLogs(logsData.logs || [])
      } catch (err) {}
    }

    const interval = setInterval(fetchStatus, 500)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [logs])

  const handleStartAttack = async () => {
    try {
      await fetch('http://localhost:3001/api/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: targetUrl,
          username: targetUsername,
          attackType,
          dictionary,
          characters,
          length
        })
      })
      setIsRunning(true)
    } catch (err) {
      alert("Error starting attack. Is the backend server running?")
    }
  }

  const handleStopAttack = async () => {
    try {
      await fetch('http://localhost:3001/api/stop', { method: 'POST' })
      setIsRunning(false)
    } catch (err) {
      alert("Error stopping attack.")
    }
  }

  return (
    <div className="container">
      <header>
        <h1>BRUTE FORCE <span>ATTACK TOOL</span></h1>
        <p className="subtitle">Dictionary Attack Configuration Interface</p>
      </header>

      <main>
        <div className="config-panel">
          <h2>Target Configuration</h2>

          <div className="form-group">
            <label>Target Form URL</label>
            <input
              type="text"
              value={targetUrl}
              onChange={(e) => setTargetUrl(e.target.value)}
              disabled={isRunning}
            />
          </div>

          <div className="form-group">
            <label>Target Username(s) (comma separated)</label>
            <input
              type="text"
              value={targetUsername}
              onChange={(e) => setTargetUsername(e.target.value)}
              disabled={isRunning}
              placeholder="e.g. admin, test, user"
            />
          </div>

          <div className="form-group">
            <label>Attack Type</label>
            <select
              value={attackType}
              onChange={(e) => setAttackType(e.target.value)}
              disabled={isRunning}
            >
              <option value="dictionary">Dictionary Attack</option>
              <option value="custom">Custom Brute Force</option>
            </select>
          </div>

          {attackType === 'dictionary' ? (
            <div className="form-group">
              <label>Dictionary / Wordlist</label>
              <select
                value={dictionary}
                onChange={(e) => setDictionary(e.target.value)}
                disabled={isRunning}
              >
                <option value="password.list">password.list (Small)</option>
                <option value="rockyou.txt">rockyou.txt (Large)</option>
              </select>
            </div>
          ) : (
            <>
              <div className="form-group">
                <label>Characters</label>
                <input
                  type="text"
                  value={characters}
                  onChange={(e) => setCharacters(e.target.value)}
                  disabled={isRunning}
                />
              </div>
              <div className="form-group">
                <label>Length</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={length}
                  onChange={(e) => setLength(parseInt(e.target.value) || 1)}
                  disabled={isRunning}
                />
              </div>
            </>
          )}

          <div className="actions">
            {!isRunning ? (
                <button className="btn-start" onClick={handleStartAttack}>INITIATE ATTACK</button>
            ) : (
                <button className="btn-stop" onClick={handleStopAttack}>ABORT MISSION</button>
            )}
          </div>
        </div>

        <div className={`terminal-panel ${isRunning ? 'active' : ''}`}>
          <div className="terminal-header">
            <span className="dot red"></span>
            <span className="dot yellow"></span>
            <span className="dot green"></span>
            <span className="terminal-title">bash - attack_logs_v2</span>
            <span className="status-badge">
                {isRunning ? (
                    <span className="running"><span className="pulse">●</span> ACTIVE</span>
                ) : (
                    <span className="idle">○ IDLE</span>
                )}
            </span>
          </div>
          <div className="terminal-wrap">
            <div className="terminal-body scanlines">
              <div className="terminal-content">
                {logs.length === 0 && <span className="placeholder">Awaiting command payload...</span>}
                {logs.map((log, index) => {
                  let logClass = "log-line"
                  if (log.includes("SUCCESS!")) logClass += " success glow"
                  else if (log.includes("ERROR:") || log.includes("[-]")) logClass += " error"
                  else if (log.includes("[Attempt")) logClass += " attempt"
                  else logClass += " info"

                  return (
                    <div key={index} className={logClass}>
                      <span className="prompt-arrow">❯ </span>
                      {log}
                    </div>
                  )
                })}
                {isRunning && <div className="log-line blinking-cursor">❯ █</div>}
                <div ref={logsEndRef} style={{ height: '10px' }} />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default App
