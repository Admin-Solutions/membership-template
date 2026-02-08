import { useState, useRef } from "react";

export default function Wallet() {
  const [showModal, setShowModal] = useState(false);
  const [dragY, setDragY] = useState(0);

  const startY = useRef(0);
  const isDragging = useRef(false);

  const DRAG_CLOSE_THRESHOLD = 120;

  const onDragStart = (e: React.TouchEvent | React.MouseEvent) => {
    isDragging.current = true;
    startY.current = "touches" in e ? e.touches[0].clientY : e.clientY;
  };

  const onDragMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (!isDragging.current) return;

    const currentY = "touches" in e ? e.touches[0].clientY : e.clientY;
    const delta = currentY - startY.current;

    if (delta > 0) setDragY(delta);
  };

  const onDragEnd = () => {
    isDragging.current = false;

    if (dragY > DRAG_CLOSE_THRESHOLD) {
      setShowModal(false);
    }

    setDragY(0);
  };

  return (
    <>
      <section id="wallet" className="page-container">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="page-title">Wallet</h1>
          <p className="page-subtitle">Manage your funds and cards</p>
          <div className="grid-wrap">
            <div className="grid-item">
              <div
                className="box box-balance"
                onClick={() => setShowModal(true)}
              >
                <div className="title">Balance</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {showModal && (
        <>
          <div
            className="modal-backdrop-ios"
            onClick={() => setShowModal(false)}
          />

          <div
            className="events-modal"
            style={{ transform: `translateY(${dragY}px)` }}
            onTouchStart={onDragStart}
            onTouchMove={onDragMove}
            onTouchEnd={onDragEnd}
            onMouseDown={onDragStart}
            onMouseMove={onDragMove}
            onMouseUp={onDragEnd}
            onMouseLeave={onDragEnd}
          >
            <div className="max-w-md mx-auto px-4">
              <div className="pill-row pt-10 mb-4">
                <div className="pill">Transfer</div>
                <div className="pill">View card</div>
                <div className="pill">Find ATM</div>
              </div>

              <div className="wallet-card">
                <div className="card-top">VIRTUAL</div>
                <div className="card-center">
                  <img
                    src="https://theblackhole.com/cdn/shop/files/TBH_2025_FinalLogo_NoEyes.png?v=1758251480&width=500"
                    alt="Logo"
                    className="h-12"
                  />
                </div>
                <div className="card-bottom">
                  <span>•••• 1111</span>
                  <span>VISA</span>
                </div>
              </div>

              <div className="info-card">
                <div className="info-title">WALLET</div>
                <div className="info-value">$1,854.50</div>
              </div>

              <div className="info-card">
                <div className="info-title">CARD •••• 4522</div>
                <div className="info-value">$847.20</div>
              </div>

              <div className="info-card">
                <div className="info-title">TBH REWARDS</div>
                <div className="info-value">$366.95</div>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
