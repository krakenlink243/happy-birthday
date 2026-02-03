import { useEffect, useRef, useState } from "react";

export function useBlowDetection(onBlowDetected, isReadyToDetect, externalAudioContext, externalStream) {
  const analyserRef = useRef(null);
  const animationFrameRef = useRef(null);
  const microphoneRef = useRef(null);
  const [isListening, setIsListening] = useState(false);

  // Ngưỡng phát hiện thổi (0-255). 
  // Tiếng thổi thường tạo ra âm lượng lớn ở dải tần thấp.
  const BLOW_THRESHOLD = 60; 

  const startAnalyzing = () => {
    if (!externalAudioContext || !externalStream || isListening) return;

    try {
      // Kết nối Stream có sẵn vào AudioContext
      microphoneRef.current = externalAudioContext.createMediaStreamSource(externalStream);
      analyserRef.current = externalAudioContext.createAnalyser();
      analyserRef.current.fftSize = 256;

      microphoneRef.current.connect(analyserRef.current);

      setIsListening(true);
      detectLoop();
    } catch (err) {
      console.error("Lỗi setup Audio Analyzer:", err);
    }
  };

  const detectLoop = () => {
    if (!analyserRef.current) return;

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);

    let sum = 0;
    // Chỉ lấy dải tần thấp (nơi tiếng phù tập trung nhiều nhất)
    for (let i = 0; i < dataArray.length; i++) {
        sum += dataArray[i];
    }
    const average = sum / dataArray.length;

    if (average > BLOW_THRESHOLD) {
      onBlowDetected && onBlowDetected();
      stopAnalyzing(); 
    } else {
      animationFrameRef.current = requestAnimationFrame(detectLoop);
    }
  };

  const stopAnalyzing = () => {
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    // Chỉ ngắt kết nối node, không close context để tránh lỗi
    if (microphoneRef.current) microphoneRef.current.disconnect();
    if (analyserRef.current) analyserRef.current.disconnect();
    setIsListening(false);
  };

  useEffect(() => {
    if (isReadyToDetect) {
      // Resume context nếu bị iOS suspend
      if (externalAudioContext && externalAudioContext.state === 'suspended') {
        externalAudioContext.resume();
      }
      startAnalyzing();
    } else {
      stopAnalyzing();
    }
    return () => stopAnalyzing();
  }, [isReadyToDetect, externalAudioContext, externalStream]);

  return { isListening };
}