import React from "react";
import "./Cake.css";

export default function Cake({ isLit }) {
  return (
    <div className="cake-wrapper">
      <div className="cake-body">
        {/* Đĩa bánh */}
        <div className="plate"></div>
        
        {/* --- MỚI: Viền kem chân bánh --- */}
        <div className="bottom-border"></div>

        {/* Các lớp cốt bánh */}
        <div className="layer layer-bottom"></div>
        <div className="layer layer-middle"></div>
        <div className="layer layer-top"></div>
        
        {/* Lớp Socola chảy */}
        <div className="chocolate-layer">
          <div className="icing-top">
            {/* Sprinkles (cốm) sẽ được tạo bằng CSS ::after của icing-top */}
          </div>
          <div className="drips">
            <div className="drip"></div>
            <div className="drip"></div>
            <div className="drip"></div>
            <div className="drip"></div>
            <div className="drip"></div>
          </div>
          
          {/* --- MỚI: Thêm Cherry topping --- */}
          <div className="toppings">
            <div className="cherry c1"></div>
            <div className="cherry c2"></div>
            <div className="cherry c3"></div>
          </div>
        </div>

        {/* Nến số 21 */}
        <div className="candles">
          {['2', '1'].map((num, i) => (
            <div key={i} className="candle">
              <div className={`flame ${isLit ? "lit" : "out"}`}></div>
              <div className="wick"></div>
              <div className="wax">{num}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}