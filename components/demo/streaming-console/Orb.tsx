
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { useEffect, useRef } from 'react';
import { useLiveAPIContext } from '../../../contexts/LiveAPIContext';

export default function Orb() {
  const { volume } = useLiveAPIContext();
  const orbRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (orbRef.current) {
        // Base size is 150px
        // Scale factor: 1 + volume * 0.5 (max 1.5x size)
        const scale = 1 + Math.max(0, volume) * 0.5;
        orbRef.current.style.transform = `scale(${scale})`;
    }
  }, [volume]);

  return (
    <div className="orb-container">
      <div ref={orbRef} className="orb"></div>
      <style>{`
        .orb-container {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 100%;
            height: 100%;
            position: relative;
        }
        .orb {
            width: 150px;
            height: 150px;
            border-radius: 50%;
            background: radial-gradient(circle at 30% 30%, var(--Blue-400), var(--Blue-500));
            box-shadow: 0 0 60px var(--Blue-500), inset 0 0 40px var(--Blue-400);
            transition: transform 0.05s ease-out;
            will-change: transform;
            z-index: 10;
        }
        .orb::after {
            content: '';
            position: absolute;
            top: 10%;
            left: 15%;
            width: 20%;
            height: 15%;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.4);
            filter: blur(5px);
        }
      `}</style>
    </div>
  );
}
