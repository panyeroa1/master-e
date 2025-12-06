
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { FunctionCall, useSettings, useUI, useTools, useSupervisor, useLogStore, Template } from '@/lib/state';
import c from 'classnames';
import { AVAILABLE_STYLES } from '@/lib/constants';
import { useLiveAPIContext } from '@/contexts/LiveAPIContext';
import { useState, useRef, useEffect } from 'react';
import ToolEditorModal from './ToolEditorModal';

export default function Sidebar() {
  const { isSidebarOpen, toggleSidebar } = useUI();
  const { style, googleSearch, imageModel, setStyle, setGoogleSearch, setImageModel } =
    useSettings();
  const { tools, toggleTool, addTool, removeTool, updateTool, template, setTemplate } = useTools();
  const { client, connected } = useLiveAPIContext();
  const { suggestions, logs, removeSuggestion, acceptSuggestion, isAnalyzing } = useSupervisor();
  const { turns } = useLogStore();

  const [activeTab, setActiveTab] = useState<'settings' | 'messages'>('settings');
  const [editingTool, setEditingTool] = useState<FunctionCall | null>(null);
  const [isCorrectionsOpen, setIsCorrectionsOpen] = useState(true);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  
  // Messaging state
  const [inputText, setInputText] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatLogRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom of chat when new turns arrive
  useEffect(() => {
    if (chatLogRef.current) {
      chatLogRef.current.scrollTop = chatLogRef.current.scrollHeight;
    }
  }, [turns, activeTab]);

  const handleSaveTool = (updatedTool: FunctionCall) => {
    if (editingTool) {
      updateTool(editingTool.name, updatedTool);
    }
    setEditingTool(null);
  };

  const applyCorrection = (id: string, newPrompt: string) => {
    useSettings.getState().setSystemPrompt(newPrompt);
    acceptSuggestion(id);
    
    useLogStore.getState().addTurn({
      role: 'system',
      text: `✅ Correction applied: System prompt updated based on feedback.`,
      isFinal: true
    });
  };

  const handleSendMessage = () => {
    if (!inputText.trim()) return;
    
    client.send([{ text: inputText }]);
    setInputText('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const base64 = (ev.target?.result as string).split(',')[1];
      if (base64) {
        client.send([{ inlineData: { mimeType: file.type, data: base64 } }]);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = ''; // Reset input
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  return (
    <>
      <aside className={c('sidebar', { open: isSidebarOpen })}>
        <div className="sidebar-tabs">
          <button 
            className={c('tab-button', { active: activeTab === 'settings' })}
            onClick={() => setActiveTab('settings')}
          >
            Settings
          </button>
          <button 
            className={c('tab-button', { active: activeTab === 'messages' })}
            onClick={() => setActiveTab('messages')}
          >
            Messages
          </button>
          <button onClick={toggleSidebar} className="close-button" style={{padding: '0 20px', fontSize: '24px'}}>
            <span className="icon">close</span>
          </button>
        </div>

        {activeTab === 'settings' && (
          <div className="sidebar-content">
            {/* Correction Section */}
            <div className="sidebar-section">
               <button 
                 className="accordion-header" 
                 onClick={() => setIsCorrectionsOpen(!isCorrectionsOpen)}
               >
                 <span className="icon">{isCorrectionsOpen ? 'expand_more' : 'chevron_right'}</span>
                 <h4 className="sidebar-section-title" style={{marginBottom:0}}>
                   Active Corrections
                   {suggestions.length > 0 && <span className="badge">{suggestions.length}</span>}
                 </h4>
                 {isAnalyzing && <span className="analyzing-spinner icon">sync</span>}
               </button>
               
               {isCorrectionsOpen && (
                 <div className="corrections-list">
                   {suggestions.length === 0 ? (
                     <div className="empty-state">No active suggestions. Speak to the agent to trigger supervision.</div>
                   ) : (
                     suggestions.map(s => (
                       <div key={s.id} className="correction-card">
                         <div className="correction-header">
                           <span className="icon warning-icon">warning</span>
                           <span className="timestamp">{s.timestamp.toLocaleTimeString()}</span>
                         </div>
                         <p className="correction-summary"><strong>User said:</strong> "{s.originalFeedback}"</p>
                         <p className="correction-summary"><strong>Fix:</strong> {s.summary}</p>
                         <details className="prompt-preview">
                           <summary>Preview Prompt Changes</summary>
                           <pre>{s.newSystemPrompt}</pre>
                         </details>
                         <div className="correction-actions">
                           <button onClick={() => applyCorrection(s.id, s.newSystemPrompt)} className="apply-btn">
                             Apply Fix
                           </button>
                           <button onClick={() => removeSuggestion(s.id)} className="dismiss-btn">
                             Dismiss
                           </button>
                         </div>
                       </div>
                     ))
                   )}
                 </div>
               )}
            </div>

            {/* Correction History Section */}
            <div className="sidebar-section">
               <button 
                 className="accordion-header" 
                 onClick={() => setIsHistoryOpen(!isHistoryOpen)}
               >
                 <span className="icon">{isHistoryOpen ? 'expand_more' : 'chevron_right'}</span>
                 <h4 className="sidebar-section-title" style={{marginBottom:0}}>
                   All Correction Logs
                   {logs.length > 0 && <span className="badge gray">{logs.length}</span>}
                 </h4>
               </button>
               
               {isHistoryOpen && (
                 <div className="corrections-list">
                   {logs.length === 0 ? (
                     <div className="empty-state">No history yet.</div>
                   ) : (
                     logs.map(log => (
                       <div key={log.id} className={`correction-card ${log.type === 'applied' ? 'history-card' : ''} ${log.type === 'dismissed' ? 'dismissed-card' : ''}`}>
                         <div className="correction-header">
                           <span className="icon">
                             {log.type === 'applied' ? 'check_circle' : log.type === 'dismissed' ? 'cancel' : 'info'}
                           </span>
                           <span className="timestamp">{log.timestamp.toLocaleTimeString()}</span>
                         </div>
                         <p className="correction-summary">{log.summary}</p>
                         {log.detail && (
                           <details className="prompt-preview">
                             <summary>Details</summary>
                             <pre>{log.detail}</pre>
                           </details>
                         )}
                       </div>
                     ))
                   )}
                 </div>
               )}
            </div>
            
            <hr className="divider" />

            <div className="sidebar-section">
              <fieldset disabled={connected}>
                <label>
                  Persona
                  <select value={template} onChange={e => setTemplate(e.target.value as Template)}>
                    {template === 'custom' && <option value="custom">Custom Agent (Active)</option>}
                    <option value="niyero">Kapitan Niyero (Seafarer Mentor)</option>
                    <option value="papap-pipoy">Papap Pipoy (Orbitz Radio)</option>
                  </select>
                </label>
              </fieldset>
              
              <label>
                Style
                <select value={style} onChange={e => setStyle(e.target.value)}>
                  {AVAILABLE_STYLES.map(s => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Image Gen Model
                <select value={imageModel} onChange={e => setImageModel(e.target.value)} disabled={connected}>
                    <option value="gemini-2.5-flash-image">Gemini 2.5 Flash (Fast)</option>
                    <option value="gemini-3-pro-image-preview">Gemini 3 Pro (High Quality)</option>
                </select>
              </label>

              <div className="tool-item" style={{ marginTop: '8px' }}>
                <label className="tool-checkbox-wrapper">
                  <input
                    type="checkbox"
                    checked={googleSearch}
                    onChange={() => setGoogleSearch(!googleSearch)}
                    disabled={connected}
                  />
                  <span className="checkbox-visual"></span>
                </label>
                <span className="tool-name-text">Use Google Search</span>
              </div>
            </div>
            <div className="sidebar-section">
              <h4 className="sidebar-section-title">Tools</h4>
              <div className="tools-list">
                {tools.map(tool => (
                  <div key={tool.name} className="tool-item">
                    <label className="tool-checkbox-wrapper">
                      <input
                        type="checkbox"
                        id={`tool-checkbox-${tool.name}`}
                        checked={tool.isEnabled}
                        onChange={() => toggleTool(tool.name)}
                        disabled={connected}
                      />
                      <span className="checkbox-visual"></span>
                    </label>
                    <label
                      htmlFor={`tool-checkbox-${tool.name}`}
                      className="tool-name-text"
                    >
                      {tool.name}
                    </label>
                    <div className="tool-actions">
                      <button
                        onClick={() => setEditingTool(tool)}
                        disabled={connected}
                        aria-label={`Edit ${tool.name}`}
                      >
                        <span className="icon">edit</span>
                      </button>
                      <button
                        onClick={() => removeTool(tool.name)}
                        disabled={connected}
                        aria-label={`Delete ${tool.name}`}
                      >
                        <span className="icon">delete</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <button
                onClick={addTool}
                className="add-tool-button"
                disabled={connected}
              >
                <span className="icon">add</span> Add function call
              </button>
            </div>
          </div>
        )}

        {activeTab === 'messages' && (
          <div className="sidebar-messages">
            <div className="chat-log" ref={chatLogRef}>
              {turns.length === 0 && (
                <div style={{color: 'var(--gray-500)', textAlign: 'center', marginTop: '40px', fontStyle: 'italic'}}>
                  No messages yet. Start streaming to chat.
                </div>
              )}
              {turns.map((turn, i) => (
                <div key={i} className={`chat-message ${turn.role}`}>
                  <div className="message-sender">{turn.role === 'user' ? 'You' : turn.role === 'agent' ? 'Panyero' : 'System'}</div>
                  <div className="message-bubble">
                    {turn.text}
                    {turn.image && (
                      <div className="message-image">
                        <img src={`data:image/png;base64,${turn.image}`} alt="Generated content" />
                      </div>
                    )}
                    {turn.groundingChunks && turn.groundingChunks.length > 0 && (
                      <div className="grounding-chunks">
                        <br/>
                        <strong>Sources:</strong>
                        <ul>
                          {turn.groundingChunks.map((chunk, j) => (
                             <li key={j}>
                               <a href={chunk.web?.uri} target="_blank" rel="noopener noreferrer">
                                 {chunk.web?.title || chunk.web?.uri}
                               </a>
                             </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="chat-input-area">
               <input 
                 type="file" 
                 ref={fileInputRef} 
                 onChange={handleFileUpload} 
                 accept="image/*,application/pdf" 
                 style={{display: 'none'}} 
               />
               <div className="chat-input-container">
                 <button className="attach-button" onClick={triggerFileUpload} title="Attach Image or File">
                   <span className="icon">attach_file</span>
                 </button>
                 <input
                   type="text"
                   className="chat-text-input"
                   placeholder="Type a message..."
                   value={inputText}
                   onChange={(e) => setInputText(e.target.value)}
                   onKeyDown={handleKeyDown}
                   disabled={!connected}
                 />
               </div>
               <button 
                 className="send-button" 
                 onClick={handleSendMessage}
                 disabled={!connected || !inputText.trim()}
               >
                 <span className="icon">send</span>
               </button>
            </div>
          </div>
        )}

      </aside>
      {editingTool && (
        <ToolEditorModal
          tool={editingTool}
          onClose={() => setEditingTool(null)}
          onSave={handleSaveTool}
        />
      )}
      <style>{`
        .accordion-header {
          display: flex;
          align-items: center;
          gap: 8px;
          background: none;
          border: none;
          color: var(--gray-200);
          cursor: pointer;
          width: 100%;
          text-align: left;
          padding: 4px 0;
        }
        .accordion-header:hover {
          color: white;
        }
        .badge {
          background: var(--Red-500);
          color: white;
          font-size: 10px;
          padding: 2px 6px;
          border-radius: 99px;
          font-weight: bold;
          margin-left: auto;
        }
        .badge.gray {
          background: var(--Neutral-50);
        }
        .analyzing-spinner {
          animation: spin 1s linear infinite;
          margin-left: 8px;
          font-size: 16px;
          color: var(--Blue-400);
        }
        @keyframes spin { 100% { transform: rotate(360deg); } }
        
        .corrections-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-top: 12px;
          margin-bottom: 12px;
        }
        .empty-state {
          font-size: 13px;
          color: var(--gray-500);
          font-style: italic;
          padding: 8px;
        }
        .correction-card {
          background: var(--Neutral-15);
          border: 1px solid var(--Red-700);
          border-radius: 8px;
          padding: 12px;
        }
        .history-card {
          border-color: var(--Green-700);
        }
        .dismissed-card {
           border-color: var(--Neutral-50);
           opacity: 0.7;
        }
        .correction-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;
        }
        .warning-icon {
          color: var(--Red-500);
          font-size: 18px;
        }
        .check-icon {
          color: var(--Green-500);
          font-size: 18px;
        }
        .timestamp {
          font-size: 11px;
          color: var(--gray-500);
        }
        .correction-summary {
          font-size: 13px;
          margin-bottom: 6px;
          line-height: 1.4;
          color: var(--gray-200);
        }
        .prompt-preview {
          margin-top: 8px;
          margin-bottom: 8px;
        }
        .prompt-preview summary {
          font-size: 12px;
          color: var(--Blue-400);
          cursor: pointer;
          user-select: none;
        }
        .prompt-preview pre {
          font-size: 11px;
          background: var(--Neutral-5);
          padding: 8px;
          border-radius: 4px;
          overflow-x: auto;
          margin-top: 4px;
          color: var(--Neutral-80);
          max-height: 200px;
          overflow-y: auto;
        }
        .correction-actions {
          display: flex;
          gap: 8px;
          margin-top: 12px;
        }
        .apply-btn {
          background: var(--Green-700);
          color: white;
          padding: 6px 12px;
          border-radius: 4px;
          font-size: 12px;
          flex: 1;
          justify-content: center;
        }
        .apply-btn:hover { background: var(--Green-500); }
        .dismiss-btn {
          background: var(--Neutral-30);
          color: var(--gray-200);
          padding: 6px 12px;
          border-radius: 4px;
          font-size: 12px;
        }
        .dismiss-btn:hover { background: var(--Neutral-50); }
        .divider {
          border: 0;
          border-top: 1px solid var(--gray-800);
          margin: 0;
        }
        
        .message-image {
          margin-top: 8px;
          border-radius: 8px;
          overflow: hidden;
        }
        .message-image img {
          width: 100%;
          height: auto;
          display: block;
        }
      `}</style>
    </>
  );
}
