
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';
import './WelcomeScreen.css';
import { useTools, Template } from '../../../lib/state';

const welcomeContent: Record<Template, { title: string; description: string; prompts: string[] }> = {
  'papap-pipoy': {
    title: 'Papap Pipoy (Orbitz Radio)',
    description: 'Warm, empathetic, late-night radio DJ. Offers advice on love, heartbreak, and life with a mix of humor and "real talk" in Taglish.',
    prompts: [
      "Papap Pipoy, ang sakit maiwan...",
      "Pa-request naman ng kanta para sa ex ko.",
      "Normal lang ba kabahan sa first date?",
    ],
  },
  'niyero': {
    title: 'Kapitan Niyero (Seafarer Mentor)',
    description: 'The Philippines’ most relatable Seafarer Mentor & Career Captain. Right-hand assistant of Captain Panyero. Speaks Taglish with seafarer slang.',
    prompts: [
      "Kap, paano ba mag-apply sa cruise ship?",
      "Trauma na ako sa last barko ko, ano gagawin ko?",
      "Goods ba ang offer na $1500 para sa OS?",
    ],
  },
};

const WelcomeScreen: React.FC = () => {
  const { template, setTemplate } = useTools();
  const { title, description, prompts } = welcomeContent[template];
  return (
    <div className="welcome-screen">
      <div className="welcome-content">
        <div className="title-container">
          <span className="welcome-icon">mic</span>
          <div className="title-selector">
            <select value={template} onChange={(e) => setTemplate(e.target.value as Template)} aria-label="Select a template">
              <option value="niyero">Kapitan Niyero (Seafarer Mentor)</option>
              <option value="papap-pipoy">Papap Pipoy (Orbitz Radio)</option>
            </select>
            <span className="icon">arrow_drop_down</span>
          </div>
        </div>
        <p>{description}</p>
        <div className="example-prompts">
          {prompts.map((prompt, index) => (
            <div key={index} className="prompt">{prompt}</div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default WelcomeScreen;
