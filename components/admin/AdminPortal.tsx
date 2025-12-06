
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { useState, useEffect } from 'react';
import { usePersonaStore, PersonaConfig, useSettings } from '@/lib/state';
import { seafarerTools } from '@/lib/tools/seafarer-tools';
import { AVAILABLE_VOICES, DEFAULT_VOICE } from '@/lib/constants';
import cn from 'classnames';

export default function AdminPortal() {
  const { personas, addPersona, removePersona } = usePersonaStore();
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [voice, setVoice] = useState(DEFAULT_VOICE);
  const [enabledTools, setEnabledTools] = useState<Record<string, boolean>>({});
  const [notification, setNotification] = useState<string | null>(null);

  // Initialize all tools as checked by default
  useEffect(() => {
    const initialTools: Record<string, boolean> = {};
    seafarerTools.forEach(tool => {
      initialTools[tool.name] = true;
    });
    setEnabledTools(initialTools);
  }, []);

  // Auto-generate slug from name
  useEffect(() => {
    if (name) {
      const generatedSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      setSlug(generatedSlug);
    }
  }, [name]);

  const handleCreate = () => {
    if (!name || !slug || !systemPrompt) {
      showNotification('Please fill in all required fields.');
      return;
    }

    const toolNames = Object.entries(enabledTools)
      .filter(([_, isEnabled]) => isEnabled)
      .map(([name]) => name);

    const newPersona: PersonaConfig = {
      id: crypto.randomUUID(),
      name,
      slug,
      systemPrompt,
      voice,
      enabledTools: toolNames,
    };

    addPersona(newPersona);
    showNotification(`Agent "${name}" created successfully!`);
    
    // Reset form
    setName('');
    setSlug('');
    setSystemPrompt('');
    setVoice(DEFAULT_VOICE);
  };

  const handleCopyLink = (personaSlug: string) => {
    const url = `${window.location.origin}/?p=${personaSlug}`;
    navigator.clipboard.writeText(url);
    showNotification('Link copied to clipboard!');
  };

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  return (
    <div className="admin-portal">
      <header className="admin-header">
        <h1>🛡️ Panyero Admin Portal</h1>
        <a href="/" className="back-link">← Back to App</a>
      </header>

      <div className="admin-content">
        {/* CREATION FORM */}
        <section className="admin-card create-agent">
          <h2>Create New Agent</h2>
          
          <div className="form-grid">
            <div className="form-group">
              <label>Agent Name</label>
              <input 
                type="text" 
                value={name} 
                onChange={e => setName(e.target.value)} 
                placeholder="e.g. Beatrice Real Estate"
              />
            </div>

            <div className="form-group">
              <label>URL Slug</label>
              <div className="slug-input-wrapper">
                <span className="slug-prefix">/?p=</span>
                <input 
                  type="text" 
                  value={slug} 
                  onChange={e => setSlug(e.target.value)} 
                  placeholder="beatrice-real-estate"
                />
              </div>
            </div>

            <div className="form-group">
              <label>Voice Model</label>
              <select value={voice} onChange={e => setVoice(e.target.value)}>
                {AVAILABLE_VOICES.map(v => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>System Prompt (Persona)</label>
            <textarea 
              value={systemPrompt} 
              onChange={e => setSystemPrompt(e.target.value)} 
              placeholder="You are Beatrice..."
              rows={10}
            />
          </div>

          <div className="form-group">
            <label>Enabled Capabilities</label>
            <div className="tools-grid">
              {seafarerTools.map(tool => (
                <label key={tool.name} className="tool-checkbox">
                  <input 
                    type="checkbox" 
                    checked={!!enabledTools[tool.name]}
                    onChange={e => setEnabledTools(prev => ({ ...prev, [tool.name]: e.target.checked }))}
                  />
                  <span className="checkmark"></span>
                  <span className="tool-label">{tool.name}</span>
                </label>
              ))}
            </div>
          </div>

          <button className="create-button" onClick={handleCreate}>
            <span className="icon">add_circle</span> Create Agent
          </button>
        </section>

        {/* EXISTING AGENTS LIST */}
        <section className="admin-card agent-list">
          <h2>Deployable Agents ({personas.length})</h2>
          
          {personas.length === 0 ? (
            <div className="empty-state">No custom agents created yet.</div>
          ) : (
            <div className="agents-grid">
              {personas.map(persona => (
                <div key={persona.id} className="agent-card">
                  <div className="agent-info">
                    <h3>{persona.name}</h3>
                    <code className="slug-badge">{persona.slug}</code>
                    <span className="voice-badge">🎙️ {persona.voice}</span>
                  </div>
                  <div className="agent-actions">
                    <button onClick={() => handleCopyLink(persona.slug)} className="action-btn copy">
                      <span className="icon">link</span> Copy Link
                    </button>
                    <button onClick={() => removePersona(persona.id)} className="action-btn delete">
                      <span className="icon">delete</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {notification && <div className="toast-notification">{notification}</div>}

      <style>{`
        .admin-portal {
          min-height: 100vh;
          background: var(--gray-900);
          color: white;
          font-family: var(--font-family);
          padding: 2rem;
        }
        .admin-header {
          max-width: 1200px;
          margin: 0 auto 2rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid var(--gray-800);
          padding-bottom: 1rem;
        }
        .back-link {
          color: var(--gray-300);
          text-decoration: none;
          font-weight: bold;
        }
        .back-link:hover { color: white; }
        
        .admin-content {
          max-width: 1200px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: 1.5fr 1fr;
          gap: 2rem;
        }
        @media (max-width: 900px) {
          .admin-content { grid-template-columns: 1fr; }
        }

        .admin-card {
          background: var(--Neutral-10);
          border: 1px solid var(--gray-800);
          border-radius: 16px;
          padding: 1.5rem;
        }
        .admin-card h2 {
          color: var(--Blue-400);
          margin-bottom: 1.5rem;
          font-size: 1.25rem;
          border-bottom: 1px solid var(--gray-800);
          padding-bottom: 0.5rem;
        }

        .form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
          margin-bottom: 1rem;
        }
        .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          margin-bottom: 1rem;
        }
        .form-group label {
          color: var(--gray-300);
          font-size: 0.85rem;
          font-weight: bold;
          text-transform: uppercase;
        }
        
        input, select, textarea {
          background: var(--Neutral-5);
          border: 1px solid var(--gray-700);
          color: white;
          padding: 0.75rem;
          border-radius: 8px;
          font-family: 'Roboto Mono', monospace;
          font-size: 0.9rem;
        }
        input:focus, select:focus, textarea:focus {
          border-color: var(--Blue-500);
          outline: none;
        }

        .slug-input-wrapper {
          display: flex;
          align-items: center;
          background: var(--Neutral-5);
          border: 1px solid var(--gray-700);
          border-radius: 8px;
          overflow: hidden;
        }
        .slug-input-wrapper input {
          border: none;
          background: transparent;
          flex-grow: 1;
        }
        .slug-prefix {
          padding-left: 0.75rem;
          color: var(--gray-500);
          font-family: 'Roboto Mono', monospace;
        }

        .tools-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 0.5rem;
          max-height: 300px;
          overflow-y: auto;
          background: var(--Neutral-5);
          padding: 1rem;
          border-radius: 8px;
          border: 1px solid var(--gray-800);
        }
        .tool-checkbox {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          cursor: pointer;
          font-size: 0.85rem;
          color: var(--gray-200);
        }
        .tool-checkbox input { display: none; }
        .checkmark {
          width: 16px;
          height: 16px;
          border: 2px solid var(--gray-500);
          border-radius: 3px;
          display: inline-block;
          position: relative;
        }
        .tool-checkbox input:checked + .checkmark {
          background: var(--Blue-500);
          border-color: var(--Blue-500);
        }
        
        .create-button {
          width: 100%;
          background: var(--Green-700);
          color: white;
          padding: 1rem;
          border-radius: 8px;
          font-weight: bold;
          margin-top: 1rem;
          transition: background 0.2s;
        }
        .create-button:hover { background: var(--Green-500); }

        .agents-grid {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .agent-card {
          background: var(--Neutral-15);
          padding: 1rem;
          border-radius: 8px;
          border: 1px solid var(--gray-800);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .agent-info h3 { margin: 0 0 0.25rem 0; font-size: 1rem; }
        .slug-badge {
          background: var(--Neutral-30);
          color: var(--Blue-400);
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 0.75rem;
          margin-right: 0.5rem;
        }
        .voice-badge {
          font-size: 0.75rem;
          color: var(--gray-500);
        }
        .agent-actions { display: flex; gap: 0.5rem; }
        .action-btn {
          padding: 0.5rem;
          border-radius: 6px;
          background: var(--Neutral-20);
          color: var(--gray-200);
        }
        .action-btn:hover { background: var(--gray-700); color: white; }
        .action-btn.copy { background: var(--Blue-800); color: var(--Blue-400); width: auto; padding: 0.5rem 1rem; font-size: 0.8rem; font-weight: bold; }
        .action-btn.copy:hover { background: var(--Blue-500); color: white; }
        
        .toast-notification {
          position: fixed;
          bottom: 2rem;
          right: 2rem;
          background: var(--Green-700);
          color: white;
          padding: 1rem 2rem;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
          animation: slideIn 0.3s ease-out;
          z-index: 9999;
        }
        @keyframes slideIn { from { transform: translateY(100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
      `}</style>
    </div>
  );
}
