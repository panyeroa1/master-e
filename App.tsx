
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
/**
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { useEffect, useState } from 'react';
import ControlTray from './components/console/control-tray/ControlTray';
import ErrorScreen from './components/demo/ErrorScreen';
import StreamingConsole from './components/demo/streaming-console/StreamingConsole';
import AdminPortal from './components/admin/AdminPortal'; // Import Admin Portal

import Header from './components/Header';
import Sidebar from './components/Sidebar';
import { LiveAPIProvider } from './contexts/LiveAPIContext';
import { usePersonaStore, useTools } from './lib/state';

// Get API key from process.env.API_KEY as per coding guidelines
const API_KEY = process.env.API_KEY as string;

/**
 * Main application component that provides a streaming interface for Live API.
 * Manages video streaming state and provides controls for webcam/screen capture.
 */
function App() {
  const [view, setView] = useState<'app' | 'admin'>('app');
  const [personaLoading, setPersonaLoading] = useState(false);
  const { hydrateCustomPersona } = useTools();
  const { getPersonaBySlug } = usePersonaStore();

  useEffect(() => {
    // 1. Check for Admin Mode
    const params = new URLSearchParams(window.location.search);
    if (params.get('admin') === 'true') {
      setView('admin');
      return;
    }

    // 2. Check for Persona Hydration
    const personaSlug = params.get('p');
    if (personaSlug) {
      setPersonaLoading(true);
      // Small timeout to ensure store is ready if utilizing async persistence (though localstorage is sync usually)
      setTimeout(() => {
        const persona = getPersonaBySlug(personaSlug);
        if (persona) {
          hydrateCustomPersona(persona);
          console.log(`[App] Hydrated persona: ${persona.name}`);
        } else {
          console.warn(`[App] Persona slug "${personaSlug}" not found.`);
        }
        setPersonaLoading(false);
      }, 50);
    }
  }, []);

  if (view === 'admin') {
    return <AdminPortal />;
  }

  return (
    <div className="App">
      <LiveAPIProvider apiKey={API_KEY}>
        <ErrorScreen />
        <Header />
        <Sidebar />
        <div className="streaming-console">
          <main>
            <div className="main-app-area">
              {personaLoading ? (
                <div style={{color: 'var(--gray-500)', fontSize: '1.2rem'}}>Loading Agent...</div>
              ) : (
                <StreamingConsole />
              )}
            </div>

            <ControlTray></ControlTray>
          </main>
        </div>
      </LiveAPIProvider>
    </div>
  );
}

export default App;
