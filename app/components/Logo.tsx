"use client";

export default function Logo({ size = 16 }: { size?: number }) {
  return (
    <span style={{
      fontFamily: "'Syne', sans-serif",
      fontSize: size,
      fontWeight: 800,
      letterSpacing: "-0.04em",
      color: "#f0f0f8",
    }}>
      Pulsar<span style={{ color: "#8b5cf6" }}>.</span>
    </span>
  );
}
