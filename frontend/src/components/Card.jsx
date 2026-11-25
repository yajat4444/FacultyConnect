import React from "react";

export default function Card({ children, className = "" }) {
  return (
    <div className={`bg-paper-raised border border-rule rounded-lg p-5 shadow-sm ${className}`}>
      {children}
    </div>
  );
}
