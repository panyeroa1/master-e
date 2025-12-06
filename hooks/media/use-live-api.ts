
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

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { GenAILiveClient } from '../../lib/genai-live-client';
import { LiveConnectConfig, Modality, LiveServerToolCall, GoogleGenAI } from '@google/genai';
import { AudioStreamer } from '../../lib/audio-streamer';
import { audioContext } from '../../lib/utils';
import VolMeterWorket from '../../lib/worklets/vol-meter';
import { useLogStore, useSettings } from '@/lib/state';

export type UseLiveApiResults = {
  client: GenAILiveClient;
  setConfig: (config: LiveConnectConfig) => void;
  config: LiveConnectConfig;

  connect: () => Promise<void>;
  disconnect: () => void;
  connected: boolean;

  volume: number;
  isVolumeEnabled: boolean;
  setVolumeEnabled: (enabled: boolean) => void;
};

export function useLiveApi({
  apiKey,
}: {
  apiKey: string;
}): UseLiveApiResults {
  const { model, imageModel } = useSettings();
  const client = useMemo(() => new GenAILiveClient(apiKey, model), [apiKey, model]);

  const audioStreamerRef = useRef<AudioStreamer | null>(null);

  const [volume, setVolume] = useState(0);
  const [connected, setConnected] = useState(false);
  const [config, setConfig] = useState<LiveConnectConfig>({});
  const [isVolumeEnabled, setVolumeEnabled] = useState(true);

  // register audio for streaming server -> speakers
  useEffect(() => {
    if (!audioStreamerRef.current) {
      audioContext({ id: 'audio-out' }).then((audioCtx: AudioContext) => {
        audioStreamerRef.current = new AudioStreamer(audioCtx);
        audioStreamerRef.current
          .addWorklet<any>('vumeter-out', VolMeterWorket, (ev: any) => {
            setVolume(ev.data.volume);
          })
          .then(() => {
            // Successfully added worklet
          })
          .catch(err => {
            console.error('Error adding worklet:', err);
          });
      });
    }
  }, [audioStreamerRef]);

  // Handle output muting
  useEffect(() => {
    if (audioStreamerRef.current) {
      audioStreamerRef.current.gainNode.gain.value = isVolumeEnabled ? 1.0 : 0.0;
    }
  }, [isVolumeEnabled]);

  useEffect(() => {
    const onOpen = () => {
      setConnected(true);
    };

    const onClose = () => {
      setConnected(false);
    };

    const stopAudioStreamer = () => {
      if (audioStreamerRef.current) {
        audioStreamerRef.current.stop();
      }
    };

    const onAudio = (data: ArrayBuffer) => {
      if (audioStreamerRef.current) {
        audioStreamerRef.current.addPCM16(new Uint8Array(data));
      }
    };

    // Bind event listeners
    client.on('open', onOpen);
    client.on('close', onClose);
    client.on('interrupted', stopAudioStreamer);
    client.on('audio', onAudio);

    const onToolCall = async (toolCall: LiveServerToolCall) => {
      const functionResponses: any[] = [];

      for (const fc of toolCall.functionCalls) {
        // Log the function call trigger
        const triggerMessage = `Triggering function call: **${
          fc.name
        }**\n\`\`\`json\n${JSON.stringify(fc.args, null, 2)}\n\`\`\``;
        useLogStore.getState().addTurn({
          role: 'system',
          text: triggerMessage,
          isFinal: true,
        });
        
        // Handle specific image generation tools locally
        if (fc.name === 'generate_image' || fc.name === 'edit_image') {
          try {
            const ai = new GoogleGenAI({ apiKey });
            let imageBase64: string | undefined = undefined;

            const selectedImageModel = imageModel || 'gemini-2.5-flash-image';
            const requestConfig: any = {};
            
            // Only add imageConfig for the advanced model
            if (selectedImageModel === 'gemini-3-pro-image-preview') {
               requestConfig.imageConfig = { aspectRatio: '1:1', imageSize: '1K' };
            } else {
               // Flash image supports aspect ratio but not imageSize
               requestConfig.imageConfig = { aspectRatio: '1:1' };
            }

            if (fc.name === 'generate_image') {
              const prompt = (fc.args as any).prompt;
              
              const response = await ai.models.generateContent({
                model: selectedImageModel,
                contents: { parts: [{ text: prompt }] },
                config: requestConfig
              });
              
              const parts = response.candidates?.[0]?.content?.parts;
              if (parts) {
                for (const part of parts) {
                   if (part.inlineData) {
                      imageBase64 = part.inlineData.data;
                      break;
                   }
                }
              }

              if (imageBase64) {
                 useLogStore.getState().addTurn({
                   role: 'system',
                   text: `Generative Image Result (${selectedImageModel}) for prompt: "${prompt}"`,
                   image: imageBase64,
                   isFinal: true
                 });
                 functionResponses.push({
                    id: fc.id,
                    name: fc.name,
                    response: { result: 'Image generated successfully and displayed to the user.' },
                 });
              } else {
                 functionResponses.push({
                   id: fc.id,
                   name: fc.name,
                   response: { result: 'Failed to generate image (no data returned).' },
                 });
              }

            } else if (fc.name === 'edit_image') {
               const prompt = (fc.args as any).prompt;
               // Get the last image from history to use as reference
               const turns = useLogStore.getState().turns;
               const lastImageTurn = [...turns].reverse().find(t => t.image);
               
               if (lastImageTurn && lastImageTurn.image) {
                   const response = await ai.models.generateContent({
                    model: selectedImageModel,
                    contents: {
                        parts: [
                            { inlineData: { mimeType: 'image/png', data: lastImageTurn.image } },
                            { text: prompt }
                        ]
                    },
                    config: requestConfig
                   });
                   
                   const parts = response.candidates?.[0]?.content?.parts;
                   if (parts) {
                    for (const part of parts) {
                       if (part.inlineData) {
                          imageBase64 = part.inlineData.data;
                          break;
                       }
                    }
                   }

                   if (imageBase64) {
                     useLogStore.getState().addTurn({
                       role: 'system',
                       text: `Edited Image Result (${selectedImageModel}) for prompt: "${prompt}"`,
                       image: imageBase64,
                       isFinal: true
                     });
                     functionResponses.push({
                        id: fc.id,
                        name: fc.name,
                        response: { result: 'Image edited successfully and displayed to the user.' },
                     });
                   } else {
                     functionResponses.push({
                       id: fc.id,
                       name: fc.name,
                       response: { result: 'Failed to edit image (no data returned).' },
                     });
                   }

               } else {
                   functionResponses.push({
                       id: fc.id,
                       name: fc.name,
                       response: { result: 'No previous image found to edit.' },
                   });
               }
            }

          } catch (error: any) {
            console.error('Image generation error:', error);
            useLogStore.getState().addTurn({
               role: 'system',
               text: `Image Generation Error: ${error.message}`,
               isFinal: true
            });
            functionResponses.push({
               id: fc.id,
               name: fc.name,
               response: { error: error.message },
            });
          }

        } else {
          // Default handler for other tools
          functionResponses.push({
            id: fc.id,
            name: fc.name,
            response: { result: 'ok' },
          });
        }
      }

      // Log the function call response
      if (functionResponses.length > 0) {
        const responseMessage = `Function call response:\n\`\`\`json\n${JSON.stringify(
          functionResponses,
          null,
          2,
        )}\n\`\`\``;
        useLogStore.getState().addTurn({
          role: 'system',
          text: responseMessage,
          isFinal: true,
        });
      }

      client.sendToolResponse({ functionResponses: functionResponses });
    };

    client.on('toolcall', onToolCall);

    return () => {
      // Clean up event listeners
      client.off('open', onOpen);
      client.off('close', onClose);
      client.off('interrupted', stopAudioStreamer);
      client.off('audio', onAudio);
      client.off('toolcall', onToolCall);
    };
  }, [client, apiKey]); 

  const connect = useCallback(async () => {
    if (!config) {
      throw new Error('config has not been set');
    }
    client.disconnect();
    await client.connect(config);
  }, [client, config]);

  const disconnect = useCallback(async () => {
    client.disconnect();
    setConnected(false);
  }, [setConnected, client]);

  return {
    client,
    config,
    setConfig,
    connect,
    connected,
    disconnect,
    volume,
    isVolumeEnabled,
    setVolumeEnabled,
  };
}
