import React, { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Minimize2, Maximize2, Move } from "lucide-react";

export const QuickNav: React.FC = () => {
  // Safe hook usage with error handling
  let navigate: any = null;
  let location: any = { pathname: "/" };

  try {
    navigate = useNavigate();
    location = useLocation();
  } catch (error) {
    // Router hooks not ready, component will be disabled
    return null;
  }

  if (!import.meta.env.DEV || !navigate) {
    return null;
  }

  const [isMinimized, setIsMinimized] = useState(false);
  const [position, setPosition] = useState({ x: 16, y: 16 }); // bottom-4 right-4 in pixels
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const cardRef = useRef<HTMLDivElement>(null);

  // Handle dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;

    const newX = e.clientX - dragStart.x;
    const newY = e.clientY - dragStart.y;

    // Keep within viewport bounds
    const maxX = window.innerWidth - (cardRef.current?.offsetWidth || 200);
    const maxY = window.innerHeight - (cardRef.current?.offsetHeight || 300);

    setPosition({
      x: Math.max(0, Math.min(newX, maxX)),
      y: Math.max(0, Math.min(newY, maxY)),
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isDragging, dragStart]);

  const links = [
    { path: "/", label: "🏠 Landing Page" },
    { path: "/dashboard", label: "📊 Company Dashboard" },
    { path: "/coaching/new", label: "➕ Create New Program" },
    { path: "/mentorship/new", label: "📝 Create Program (Legacy)" },
    { path: "/coach/dashboard", label: "👨‍🏫 Coach Dashboard" },
    { path: "/platform-admin", label: "⚙️ Platform Admin" },
    { path: "/admin/matching", label: "🎯 Matching Settings" },
    { path: "/admin/email", label: "📧 Email Settings" },
    { path: "/pricing", label: "💰 Pricing" },
    { path: "/coaches", label: "👥 Coach Directory" },
    { path: "/login", label: "🔐 Login" },
    { path: "/signup", label: "✍️ Sign Up" },
    { path: "/validation", label: "🧪 Validation Dashboard" },
    {
      path: "/session-validation",
      label: "📅 Session Modification Validation",
    },
    { path: "/test-coach", label: "👨‍🏫 Test Coach" },
  ];

  return (
    <div
      ref={cardRef}
      className="fixed bg-white border-2 border-blue-500 rounded-lg p-3 shadow-lg z-50 max-w-xs"
      style={{
        right: `${position.x}px`,
        bottom: `${position.y}px`,
        cursor: isDragging ? "grabbing" : "default",
      }}
    >
      {/* Header with controls */}
      <div className="flex items-center justify-between mb-2">
        <div className="text-xs font-bold text-blue-600">🚀 DEV NAVIGATION</div>
        <div className="flex items-center gap-1">
          <button
            onMouseDown={handleMouseDown}
            className="p-1 text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing"
            title="Drag to move"
          >
            <Move className="h-3 w-3" />
          </button>
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-1 text-gray-400 hover:text-gray-600"
            title={isMinimized ? "Expand" : "Minimize"}
          >
            {isMinimized ? (
              <Maximize2 className="h-3 w-3" />
            ) : (
              <Minimize2 className="h-3 w-3" />
            )}
          </button>
        </div>
      </div>

      {/* Navigation links (shown when not minimized) */}
      {!isMinimized && (
        <>
          <div className="space-y-1 max-h-60 overflow-y-auto">
            {links.map((link) => (
              <button
                key={link.path}
                onClick={() => navigate(link.path)}
                className={`block w-full text-left px-2 py-1 text-xs rounded transition-colors ${
                  location.pathname === link.path
                    ? "bg-blue-100 text-blue-800 font-medium"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                {link.label}
                {link.label.includes("NEW") && (
                  <span className="ml-1 text-red-500">●</span>
                )}
              </button>
            ))}
          </div>
          <div className="text-xs text-gray-500 mt-2 pt-2 border-t">
            Current: {location.pathname}
          </div>
        </>
      )}

      {/* Minimized state */}
      {isMinimized && (
        <div className="text-xs text-gray-500">
          {links
            .find((link) => link.path === location.pathname)
            ?.label.split(" ")[0] || "📍"}
        </div>
      )}
    </div>
  );
};
