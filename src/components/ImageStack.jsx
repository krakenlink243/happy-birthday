import { useEffect, useRef, useState } from "react";
import Matter from "matter-js";
import "./ImageStack.css";

export default function ImageStack({ onFinish }) {
  const cardRefs = useRef({}); 
  const engineRef = useRef(null);
  const runnerRef = useRef(null);
  const bodiesRef = useRef({}); 
  
  const lastAccRef = useRef(null);
  const isReadyRef = useRef(false);

  const [items, setItems] = useState([
    { id: "img1", src: "/i1.png" },
    { id: "img2", src: "/i2.png" },
    { id: "img3", src: "/i3.png" },
  ]);

  const [motionEnabled, setMotionEnabled] = useState(false);

  const width = window.innerWidth;
  const height = window.innerHeight;
  // Card to bằng 60% chiều rộng màn hình
  const cardWidth = Math.min(width, height) * 0.6;
  const cardHeight = cardWidth * (4/3); 

  const requestMotionPermission = async () => {
    if (typeof DeviceMotionEvent !== "undefined" && typeof DeviceMotionEvent.requestPermission === "function") {
      try {
        const res = await DeviceMotionEvent.requestPermission();
        setMotionEnabled(res === "granted");
      } catch (e) { setMotionEnabled(true); }
    } else { setMotionEnabled(true); }
  };

  useEffect(() => {
    if (!motionEnabled) return;

    const engine = Matter.Engine.create();
    const runner = Matter.Runner.create();
    
    engineRef.current = engine;
    runnerRef.current = runner;

    engine.world.gravity.y = 0;
    engine.world.gravity.x = 0;

    const newBodies = {};
    items.forEach(item => {
        const paddingX = cardWidth / 2 + 20;
        const paddingY = cardHeight / 2 + 20;
        const safeX = Math.random() * (width - 2 * paddingX) + paddingX;
        const safeY = Math.random() * (height - 2 * paddingY) + paddingY;

        const body = Matter.Bodies.rectangle(safeX, safeY, cardWidth, cardHeight, {
            inertia: Infinity, 
            angle: (Math.random() - 0.5) * 0.4, 
            frictionAir: 0.1, // Khóa cứng lúc đầu
            restitution: 0.5,
            density: 0.002,
            collisionFilter: { group: -1 }, 
            label: item.id
        });
        
        newBodies[item.id] = body;
    });

    Matter.World.add(engine.world, Object.values(newBodies));
    bodiesRef.current = newBodies;

    Matter.Events.on(engine, 'afterUpdate', () => {
        const bodies = bodiesRef.current;
        const domEls = cardRefs.current;

        Object.keys(bodies).forEach(id => {
            const body = bodies[id];
            const domEl = domEls[id];

            if (body && domEl) {
                const { x, y } = body.position;
                const angle = body.angle;
                domEl.style.transform = `translate3d(${x - cardWidth/2}px, ${y - cardHeight/2}px, 0) rotate(${angle}rad)`;

                const buffer = 200;
                if (
                    x < -buffer || x > width + buffer ||
                    y < -buffer || y > height + buffer
                ) {
                    Matter.World.remove(engine.world, body);
                    delete bodiesRef.current[id];
                    setItems(prev => prev.filter(i => i.id !== id));
                    
                    if (Object.keys(bodiesRef.current).length === 0) {
                        onFinish && onFinish();
                    }
                }
            }
        });
    });

    Matter.Runner.run(runner, engine);

    setTimeout(() => {
        isReadyRef.current = true;
        // === SIÊU TRƠN ===
        // Giảm ma sát xuống 0.005 (gần như trôi tự do trong không gian)
        Object.values(bodiesRef.current).forEach(b => b.frictionAir = 0.005);
    }, 1000);

    const handleShake = (e) => {
        if (!isReadyRef.current) return;
        const acc = e.accelerationIncludingGravity;
        if (!acc) return;

        if (lastAccRef.current === null) {
            lastAccRef.current = { x: acc.x, y: acc.y, z: acc.z };
            return;
        }

        const deltaX = acc.x - lastAccRef.current.x;
        const deltaY = acc.y - lastAccRef.current.y;
        const deltaZ = acc.z - lastAccRef.current.z;
        lastAccRef.current = { x: acc.x, y: acc.y, z: acc.z };

        const shakeForce = Math.abs(deltaX) + Math.abs(deltaY) + Math.abs(deltaZ);

        // === ĐỘ NHẠY CỰC CAO ===
        // Ngưỡng 0.8: Chỉ cần tay hơi rung nhẹ là nhận
        if (shakeForce < 0.8) return; 

        // === TĂNG SỨC MẠNH ===
        // Hệ số 0.03 (x3 lần bản cũ)
        // Số mũ 1.1 (Giảm xuống gần tuyến tính để lắc nhẹ cũng ra lực mạnh)
        const powerMultiplier = 0.03 * Math.pow(shakeForce, 1.1);

        Object.values(bodiesRef.current).forEach(body => {
            const spread = shakeForce * 0.01;
            const forceX = (deltaX * powerMultiplier) + (Math.random() - 0.5) * spread;
            const forceY = -(deltaY * powerMultiplier) + (Math.random() - 0.5) * spread;

            Matter.Body.applyForce(body, body.position, { x: forceX, y: forceY });
        });
    };

    window.addEventListener("devicemotion", handleShake);

    return () => {
        window.removeEventListener("devicemotion", handleShake);
        if (runnerRef.current) Matter.Runner.stop(runnerRef.current);
        if (engineRef.current) Matter.Engine.clear(engineRef.current);
        bodiesRef.current = {};
        isReadyRef.current = false;
    };
  }, [motionEnabled]);

  return (
    <div className="stack-container">
      {!motionEnabled && (
        <div className="permission-overlay">
          <button className="start-btn" onClick={requestMotionPermission}>
            Lắc để xem
          </button>
        </div>
      )}

      {items.map((item) => (
        <div
          key={item.id}
          ref={el => cardRefs.current[item.id] = el}
          className="physics-card"
          style={{
            width: cardWidth,
            height: cardHeight,
            position: 'absolute',
            top: 0, 
            left: 0,
            willChange: 'transform', 
            transform: 'translate3d(-9999px, -9999px, 0)' 
          }}
        >
          <img src={item.src} alt="" />
        </div>
      ))}
    </div>
  );
}