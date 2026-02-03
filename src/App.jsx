import { useState, useRef } from "react";
import ImageStack from "./components/ImageStack";
import Cake from "./components/Cake";
import { useBlowDetection } from "./hooks/useBlowDetection";
// 1. Import EmailJS
import emailjs from '@emailjs/browser';
import "./App.css";

// Link nhạc (Mình để sẵn link Github, bạn có thể thay bằng link khác)
const BIRTHDAY_SONG_URL = "m.mp3";

function App() {
  const [hasStarted, setHasStarted] = useState(false);
  const [isStackGone, setIsStackGone] = useState(false);
  const [isCandleLit, setIsCandleLit] = useState(true);
  const [readyToBlow, setReadyToBlow] = useState(false);

  // State lời chúc
  const [showCake, setShowCake] = useState(true);
  const [showWishDialog, setShowWishDialog] = useState(false);
  const [showInputForm, setShowInputForm] = useState(false);
  const [finalMessage, setFinalMessage] = useState("");
  const [isSending, setIsSending] = useState(false);

  const inputRef = useRef(null);
  const audioContextRef = useRef(null);
  const audioStreamRef = useRef(null);
  const musicRef = useRef(null);

  // === HÀM KHỞI ĐỘNG ===
  const handleStartExperience = async () => {
    try {
      if (typeof DeviceMotionEvent !== "undefined" && typeof DeviceMotionEvent.requestPermission === "function") {
        try {
          const permissionState = await DeviceMotionEvent.requestPermission();
          if (permissionState !== 'granted') {
            alert("Bạn cần cho phép quyền truy cập Chuyển động (Motion) để lắc ảnh!");
            return;
          }
        } catch (e) {
          console.error("Lỗi xin quyền Motion:", e);
        }
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        audioStreamRef.current = stream;
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        audioContextRef.current = new AudioContext();
        if (audioContextRef.current.state === 'suspended') {
          await audioContextRef.current.resume();
        }
      } catch (err) {
        console.error("Lỗi Micro:", err);
        alert("Không thể truy cập Micro. Hãy kiểm tra cài đặt quyền riêng tư và tải lại trang.");
        return; 
      }

      setHasStarted(true);

      try {
        const audio = new Audio(BIRTHDAY_SONG_URL);
        audio.loop = true; // Nhạc sẽ lặp mãi mãi
        audio.volume = 0.5;
        musicRef.current = audio;
        await audio.play(); 
      } catch (musicErr) {
        console.warn("Lỗi nhạc:", musicErr);
      }

    } catch (err) {
      console.error("Lỗi:", err);
      alert("Đã xảy ra lỗi khởi động. Hãy thử tải lại trang nhé!");
    }
  };

  // ĐÃ XÓA HÀM fadeOutMusic() ĐỂ NHẠC KHÔNG BỊ TẮT

  const { isListening } = useBlowDetection(
    () => {
      // KHI NẾN TẮT:
      setIsCandleLit(false);
      
      // KHÔNG GỌI fadeOutMusic() NỮA -> Nhạc vẫn chạy tiếp

      // Chuyển cảnh sau 2s
      setTimeout(() => {
        setShowCake(false); 
        setTimeout(() => setShowWishDialog(true), 500); 
      }, 2000);
    },
    readyToBlow,
    audioContextRef.current,
    audioStreamRef.current
  );

  const handleStackFinish = () => {
    setIsStackGone(true);
    setTimeout(() => setReadyToBlow(true), 1000);
  };

  const handleNo = () => {
    setShowWishDialog(false);
    setFinalMessage("Đã mở khoá easter-egg: có thì tớ cũng k đọc đc =))");
  };

  const handleYes = () => {
    setShowWishDialog(false);
    setShowInputForm(true);
  };

  // === GỬI MAIL THẬT VỚI EMAILJS ===
  const handleSendEmail = (e) => {
    e.preventDefault();
    const message = inputRef.current.value;
    if(!message) return;

    setIsSending(true);

    const templateParams = {
        message: message, 
        to_email: 'vquochoang7@gmail.com' 
    };

    // Nhớ thay mã của bạn vào đây nhé
    emailjs.send(
        'service_v94ymvk', 
        'template_qhl36no', 
        templateParams, 
        'V9-0iXILtVPnvgHMT'
    )
    .then((response) => {
       console.log('SUCCESS!', response.status, response.text);
       setIsSending(false);
       setShowInputForm(false);
       setFinalMessage("Đã nhận được rồi nhé! Cảm ơn cậu 🥰");
    }, (err) => {
       console.log('FAILED...', err);
       setIsSending(false);
       alert("Lỗi gửi mail rồi :( Thử lại sau nha.");
    });
  };

  if (!hasStarted) {
    return (
      <div className="start-screen">
        <h1 className="title">Woaa, hình như có người +1 tuổi</h1>
        <p className="subtitle">Let's have a look at your 20th</p>
        <button className="btn-start" onClick={handleStartExperience}>BẮT ĐẦU</button>
      </div>
    );
  }

  return (
    <div className="app-container">
      
      <div 
        className={`layer background-layer ${showCake ? '' : 'fade-out'}`}
        style={{ pointerEvents: showCake ? 'auto' : 'none' }}
      >
        <Cake isLit={isCandleLit} />
        
        {!isCandleLit && showCake && <h1 className="hbd-text">HAPPY BIRTHDAY! 🎉</h1>}
        
        {readyToBlow && isCandleLit && (
           <p className="instruction">🌬️ Thổi nến đii</p>
        )}
      </div>

      {!showCake && (
        <div className="layer message-layer">
            {showWishDialog && (
                <div className="dialog-box pop-in">
                    <h2>Chúc bạn tớ sang tuổi mới vẫn cute như này, đừng có ghét tớ🥲. Không bỏ chồng, chung thuỷ với HLE để tớ còn trêu:))</h2>
                    <p>Cậu có muốn nhắn nhủ gì với tớ không?</p>
                    <div className="btn-group">
                        <button className="btn-yes" onClick={handleYes}>Có nè</button>
                        <button className="btn-no" onClick={handleNo}>Không đâu</button>
                    </div>
                </div>
            )}

            {showInputForm && (
                <form className="dialog-box pop-in" onSubmit={handleSendEmail}>
                    <h2>Gửi lời nhắn</h2>
                    <textarea 
                        ref={inputRef} 
                        placeholder="nói..." 
                        rows="4"
                    ></textarea>
                    <button type="submit" className="btn-send" disabled={isSending}>
                        {isSending ? "Đang gửi..." : "Gửi đi 💌"}
                    </button>
                </form>
            )}

            {finalMessage && (
                <div className="final-message pop-in">
                    <h1>{finalMessage}</h1>
                </div>
            )}
        </div>
      )}

      <div className={`layer foreground-layer ${isStackGone ? "pass-through" : ""}`}>
        <ImageStack onFinish={handleStackFinish} />
      </div>

    </div>
  );
}

export default App;