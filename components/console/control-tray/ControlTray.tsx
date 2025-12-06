
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

import cn from 'classnames';

import { memo, ReactNode, useEffect, useRef, useState } from 'react';
import { AudioRecorder } from '../../../lib/audio-recorder';
import { useSettings, useTools, useLogStore, useSupervisor } from '@/lib/state';

import { useLiveAPIContext } from '../../../contexts/LiveAPIContext';

export type ControlTrayProps = {
  children?: ReactNode;
};

function ControlTray({ children }: ControlTrayProps) {
  const [audioRecorder] = useState(() => new AudioRecorder());
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(0);
  const [isClipped, setIsClipped] = useState(false);
  const connectButtonRef = useRef<HTMLButtonElement>(null);
  const micButtonRef = useRef<HTMLButtonElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // History for rolling graph
  const historyRef = useRef<number[]>(new Array(30).fill(0));

  const { client, connected, connect, disconnect, isVolumeEnabled, setVolumeEnabled } = useLiveAPIContext();

  useEffect(() => {
    if (!connected && connectButtonRef.current) {
      connectButtonRef.current.focus();
    }
  }, [connected]);

  useEffect(() => {
    if (!connected) {
      setMuted(false);
      setVolume(0);
      setIsClipped(false);
      historyRef.current.fill(0);
    }
  }, [connected]);

  useEffect(() => {
    const onData = (base64: string) => {
      client.sendRealtimeInput([
        {
          mimeType: 'audio/pcm;rate=16000',
          data: base64,
        },
      ]);
    };
    
    const onVolumetrics = (metrics: { volume: number; clipped: boolean }) => {
        setVolume(metrics.volume);
        if (metrics.clipped) {
          setIsClipped(true);
          // Auto-reset clip indicator after a short delay
          setTimeout(() => setIsClipped(false), 1000);
        }
        
        // Update history
        historyRef.current.shift();
        historyRef.current.push(metrics.volume);
    };

    if (connected && !muted && audioRecorder) {
      audioRecorder.on('data', onData);
      audioRecorder.on('volumetrics', onVolumetrics);
      audioRecorder.start();
    } else {
      audioRecorder.stop();
    }
    return () => {
      audioRecorder.off('data', onData);
      audioRecorder.off('volumetrics', onVolumetrics);
    };
  }, [connected, client, muted, audioRecorder]);

  useEffect(() => {
      if (canvasRef.current) {
          const ctx = canvasRef.current.getContext('2d');
          if (ctx) {
              const width = canvasRef.current.width;
              const height = canvasRef.current.height;
              
              ctx.clearRect(0, 0, width, height);
              
              // Draw background grid
              ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
              ctx.fillRect(0, 0, width, height);
              
              // Draw rolling graph
              const barWidth = width / historyRef.current.length;
              
              historyRef.current.forEach((val, i) => {
                const x = i * barWidth;
                const h = Math.min(1, val * 5) * height; // amplify for visual
                const y = height - h;
                
                // Color based on intensity
                if (val > 0.8) ctx.fillStyle = '#ff4600'; // Critical
                else if (val > 0.5) ctx.fillStyle = '#ffbb33'; // High
                else if (val > 0.1) ctx.fillStyle = '#4285f4'; // Active Voice
                else ctx.fillStyle = '#3c4043'; // Noise Floor / Low
                
                ctx.fillRect(x, y, barWidth - 1, h);
              });
              
              // Draw Clip Indicator if clipped
              if (isClipped) {
                ctx.fillStyle = 'rgba(255, 70, 0, 0.3)';
                ctx.fillRect(0, 0, width, height);
              }
          }
      }
      
      // Update mic button halo
      if (micButtonRef.current) {
          const haloSize = Math.min(20, volume * 100); 
          micButtonRef.current.style.setProperty('--volume', `${haloSize}px`);
      }
  }, [volume, isClipped]);

  const handleMicClick = () => {
    if (connected) {
      setMuted(!muted);
    } else {
      connect();
    }
  };

  const micButtonTitle = connected
    ? muted
      ? 'Unmute microphone'
      : 'Mute microphone'
    : 'Connect and start microphone';

  const connectButtonTitle = connected ? 'Stop streaming' : 'Start streaming';

  return (
    <section className="control-tray">
      <div className={cn('audio-monitor', { hidden: !connected || muted })}>
        <canvas className="audio-scope" ref={canvasRef} width="60" height="28" />
        {isClipped && <div className="clip-indicator">CLIP</div>}
      </div>
      
      <nav className={cn('actions-nav')}>
        <button
          ref={micButtonRef}
          className={cn('action-button mic-button')}
          onClick={handleMicClick}
          title={micButtonTitle}
        >
          {!muted ? (
            <span className="material-symbols-outlined filled">mic</span>
          ) : (
            <span className="material-symbols-outlined filled">mic_off</span>
          )}
        </button>
        <button
          className={cn('action-button')}
          onClick={() => setVolumeEnabled(!isVolumeEnabled)}
          title={isVolumeEnabled ? "Mute Output" : "Unmute Output"}
        >
          {isVolumeEnabled ? (
            <span className="material-symbols-outlined filled">volume_up</span>
          ) : (
            <span className="material-symbols-outlined filled">volume_off</span>
          )}
        </button>
        <button
          className={cn('action-button')}
          onClick={useLogStore.getState().clearTurns}
          aria-label="Reset Chat"
          title="Reset session logs"
        >
          <span className="icon">refresh</span>
        </button>
        {children}
      </nav>

      <div className={cn('connection-container', { connected })}>
        <div className="connection-button-container">
          <button
            ref={connectButtonRef}
            className={cn('action-button connect-toggle', { connected })}
            onClick={connected ? disconnect : connect}
            title={connectButtonTitle}
          >
            <span className="material-symbols-outlined filled">
              {connected ? 'pause' : 'play_arrow'}
            </span>
          </button>
        </div>
        <span className="text-indicator">Streaming</span>
      </div>
      
      <style>{`
        .audio-monitor {
          position: absolute;
          left: -80px;
          top: 50%;
          transform: translateY(-50%);
          background: var(--Neutral-10);
          border: 1px solid var(--Neutral-30);
          border-radius: 8px;
          padding: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .audio-scope {
          border-radius: 4px;
        }
        .clip-indicator {
          position: absolute;
          top: -16px;
          left: 50%;
          transform: translateX(-50%);
          background: var(--Red-500);
          color: white;
          font-size: 9px;
          font-weight: bold;
          padding: 2px 4px;
          border-radius: 4px;
          pointer-events: none;
        }
        .audio-monitor.hidden {
          display: none;
        }
      `}</style>
    </section>
  );
}

export default memo(ControlTray);
