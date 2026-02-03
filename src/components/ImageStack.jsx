import { useEffect, useRef, useState } from "react";
import Matter from "matter-js";
import "./ImageStack.css";

// --- KHÔNG CẦN IMPORT NỮA ---
// Vì ảnh nằm trong thư mục public, ta dùng đường dẫn tuyệt đối
const IMAGE_LIST = [
  "/i1.jpg",
  "/i2.png",
  "/i3.png",
  "/i4.png",
  "/i5.png",
  "/i6.png"
];

export default function ImageStack({ onFinish }) {
  const cardRefs = useRef({}); 
  const engineRef = useRef(null);
  const runnerRef = useRef(null);
  const bodiesRef = useRef({}); 
  const lastAccRef = useRef(null);
  const isReadyRef = useRef(false);
  
  const draggingIdRef = useRef(null);
  const dragOffsetRef = useRef({ x: 0, y: 0 });
  const lastDragPosRef = useRef({ x: 0, y: 0, time: 0 });

  const [showHint, setShowHint] = useState(false);

  const [items, setItems] = useState(() => {
    return IMAGE_LIST.map((imgSrc, index) => ({
      id: `img-${index}`,
      src: imgSrc, // Đường dẫn trực tiếp từ public
      styleVars: {
        '--rnd-x': `${(Math.random() - 0.5) * 500}px`,
        '--rnd-y': `${(Math.random() - 0.5) * 500}px`,
        '--rnd-rot': `${(Math.random() - 0.5) * 45}deg`,
        '--delay': `${index * 0.15}s`
      }
    }));
  });

  const width = window.innerWidth;
  const height = window.innerHeight;
  const cardWidth = Math.min(width, height) * 0.7; 
  const cardHeight = cardWidth * (4/3); 

  useEffect(() => {
    const engine = Matter.Engine.create();
    const runner = Matter.Runner.create();
    
    engineRef.current = engine;
    runnerRef.current = runner;
    engine.world.gravity.y = 0;
    engine.world.gravity.x = 0;

    const newBodies = {};
    items.forEach(item => {
        const paddingX = cardWidth / 2 + 10;
        const paddingY = cardHeight / 2 + 10;
        const safeX = Math.max(paddingX, Math.min(width - paddingX, Math.random() * width));
        const safeY = Math.max(paddingY, Math.min(height - paddingY, Math.random() * height));
        const randomDensity = 0.001 + Math.random() * 0.001;

        const body = Matter.Bodies.rectangle(safeX, safeY, cardWidth, cardHeight, {
            inertia: Infinity, 
            angle: (Math.random() - 0.5) * 0.5,
            frictionAir: 0.1, 
            restitution: 0.6, 
            density: randomDensity,
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

                const buffer = 500;
                if (x < -buffer || x > width + buffer || y < -buffer || y > height + buffer) {
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
        Object.values(bodiesRef.current).forEach(b => {
             b.frictionAir = 0.001 + Math.random() * 0.002;
        });
        
        setTimeout(() => {
            if (Object.keys(bodiesRef.current).length > 0) {
                setShowHint(true);
                setTimeout(() => setShowHint(false), 3000);
            }
        }, 1500);

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

        if (shakeForce < 0.8) return; 

        const DIR_X = -1; const DIR_Y = 1;  
        const powerMultiplier = 0.002 * Math.pow(shakeForce, 1.4);

        Object.values(bodiesRef.current).forEach(body => {
            if (body.label === draggingIdRef.current) return;
            const individualSensitivity = 0.5 + Math.random();
            const spread = shakeForce * 0.02; 
            const randomDirX = (Math.random() - 0.5) * spread;
            const randomDirY = (Math.random() - 0.5) * spread;
            const forceX = (deltaX * powerMultiplier * individualSensitivity * DIR_X) + randomDirX;
            const forceY = (deltaY * powerMultiplier * individualSensitivity * DIR_Y) + randomDirY;
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
  }, []);

  const handleTouchStart = (e, id) => {
    const body = bodiesRef.current[id];
    if (!body) return;
    const touch = e.touches[0];
    draggingIdRef.current = id;
    dragOffsetRef.current = { x: touch.clientX - body.position.x, y: touch.clientY - body.position.y };
    lastDragPosRef.current = { x: touch.clientX, y: touch.clientY, time: Date.now() };
    Matter.Body.setStatic(body, true);
  };
  const handleGlobalTouchMove = (e) => {
      if(!draggingIdRef.current) return;
      const touch = e.touches[0];
      const now = Date.now();
      const vx = touch.clientX - lastDragPosRef.current.x;
      const vy = touch.clientY - lastDragPosRef.current.y;
      const body = bodiesRef.current[draggingIdRef.current];
      if(body) {
          Matter.Body.setPosition(body, { 
              x: touch.clientX - dragOffsetRef.current.x, 
              y: touch.clientY - dragOffsetRef.current.y 
          });
          body.customVelocity = { x: vx, y: vy };
      }
      lastDragPosRef.current = { x: touch.clientX, y: touch.clientY, time: now };
  };
  const handleGlobalTouchEnd = () => {
      if(!draggingIdRef.current) return;
      const body = bodiesRef.current[draggingIdRef.current];
      if(body) {
          Matter.Body.setStatic(body, false);
          if (body.customVelocity) {
              const throwForce = 0.05; 
              Matter.Body.applyForce(body, body.position, { 
                  x: body.customVelocity.x * throwForce, 
                  y: body.customVelocity.y * throwForce 
              });
              body.customVelocity = null; 
          }
      }
      draggingIdRef.current = null;
  };

  return (
    <div className="stack-container" onTouchMove={handleGlobalTouchMove} onTouchEnd={handleGlobalTouchEnd}>
      
      <div className={`hint-overlay ${showHint ? 'visible' : ''}`}>
        <p>💡 Nếu thấy vướng quá thì thử <b>hất điện thoại</b> xem...</p>
      </div>

      {items.map((item) => (
        <div 
          key={item.id} 
          ref={el => cardRefs.current[item.id] = el} 
          className="physics-card" 
          onTouchStart={(e) => handleTouchStart(e, item.id)}
          style={{
            width: cardWidth, height: cardHeight, 
            position: 'absolute', top: 0, left: 0,
          }}
        >
          <div 
            className="card-inner" 
            style={{
                ...item.styleVars, 
                animationDelay: item.styleVars['--delay'] 
            }}
          >
            <img src={item.src} alt="" loading="lazy" />
          </div>
        </div>
      ))}
    </div>
  );
}