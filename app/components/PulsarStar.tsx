"use client";

export default function PulsarStar({ size = 500, opacity = 1 }: { size?: number; opacity?: number }) {
  return (
    <div style={{ position: "relative", width: size, height: size, display: "flex", alignItems: "center", justifyContent: "center", opacity }}>

      {/* Rings roxos */}
      {[0, 1, 2, 3, 4, 5].map(i => (
        <div key={i} style={{
          position: "absolute",
          width: size * 0.16,
          height: size * 0.16,
          borderRadius: "50%",
          border: `1px solid rgba(124,58,237,${0.7 - i * 0.1})`,
          animation: `pulsar-ring ${2.2 + i * 0.55}s ease-out ${i * 0.45}s infinite`,
        }} />
      ))}

      {/* Rings ciano */}
      {[0, 1, 2, 3, 4].map(i => (
        <div key={`c${i}`} style={{
          position: "absolute",
          width: size * 0.16,
          height: size * 0.16,
          borderRadius: "50%",
          border: `1px solid rgba(6,182,212,${0.5 - i * 0.08})`,
          animation: `pulsar-ring ${2.8 + i * 0.65}s ease-out ${i * 0.55 + 0.25}s infinite`,
        }} />
      ))}

      {/* Jet superior */}
      <div style={{
        position: "absolute",
        width: size * 0.003,
        height: size * 0.48,
        background: "linear-gradient(to top, transparent 0%, rgba(124,58,237,0.4) 30%, rgba(6,182,212,0.9) 70%, rgba(255,255,255,0.8) 100%)",
        borderRadius: 4,
        top: "2%", left: "50%",
        transform: "translateX(-50%)",
        filter: "blur(0.8px)",
      }} />

      {/* Jet inferior */}
      <div style={{
        position: "absolute",
        width: size * 0.003,
        height: size * 0.48,
        background: "linear-gradient(to bottom, transparent 0%, rgba(124,58,237,0.4) 30%, rgba(6,182,212,0.9) 70%, rgba(255,255,255,0.8) 100%)",
        borderRadius: 4,
        bottom: "2%", left: "50%",
        transform: "translateX(-50%)",
        filter: "blur(0.8px)",
      }} />

      {/* Disco de acreção */}
      <div style={{
        position: "absolute",
        width: size * 0.55,
        height: size * 0.07,
        borderRadius: "50%",
        background: "radial-gradient(ellipse, rgba(124,58,237,0.35) 0%, rgba(6,182,212,0.2) 45%, transparent 75%)",
        filter: "blur(3px)",
        animation: "pulsar-rotate 14s linear infinite",
      }} />

      {/* Glow externo */}
      <div style={{
        position: "absolute",
        width: size * 0.26,
        height: size * 0.26,
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(124,58,237,0.3) 0%, rgba(6,182,212,0.15) 50%, transparent 75%)",
        filter: "blur(10px)",
        animation: "pulsar-core 2s ease-in-out infinite",
      }} />

      {/* Núcleo */}
      <div style={{
        position: "relative",
        width: size * 0.09,
        height: size * 0.09,
        borderRadius: "50%",
        background: "radial-gradient(circle, #ffffff 0%, #c4b5fd 25%, #7c3aed 55%, #06b6d4 80%, transparent 100%)",
        boxShadow: `0 0 ${size*0.035}px rgba(196,181,253,1), 0 0 ${size*0.07}px rgba(124,58,237,0.8), 0 0 ${size*0.13}px rgba(6,182,212,0.4), 0 0 ${size*0.2}px rgba(124,58,237,0.2)`,
        animation: "pulsar-core 2s ease-in-out infinite",
        zIndex: 2,
      }} />

      {/* Partículas orbitais */}
      {[0, 72, 144, 216, 288].map((deg, i) => (
        <div key={`p${i}`} style={{
          position: "absolute",
          width: size * 0.011,
          height: size * 0.011,
          borderRadius: "50%",
          background: i % 2 === 0 ? "#a78bfa" : "#06b6d4",
          opacity: 0.8,
          transform: `rotate(${deg}deg) translateX(${size * 0.2}px)`,
          animation: `pulsar-rotate ${9 + i * 1.2}s linear infinite`,
          boxShadow: `0 0 5px ${i % 2 === 0 ? "#a78bfa" : "#06b6d4"}`,
        }} />
      ))}
    </div>
  );
}
