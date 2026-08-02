import { useEffect, useRef } from "react";

export default function HeroInteractiveBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    let animationFrameId;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);

    // Mouse coordinates
    const mouse = {
      x: width / 2,
      y: height / 2,
      targetX: width / 2,
      targetY: height / 2,
      radius: 240,
    };

    const handleMouseMove = (e) => {
      mouse.targetX = e.clientX;
      mouse.targetY = e.clientY;
    };
    window.addEventListener("mousemove", handleMouseMove);

    // RAG Document & Culinary Nodes
    const labels = [
      "📄 Pizza_Menu.pdf",
      "🍕 Spice_Garden.txt",
      "📋 Safety_SOP.pdf",
      "📊 Directory.csv",
      "⚡ Cache <15ms",
      "🛡️ 94.2% RRF",
      "🔍 Dense Vector 384d",
      "📜 FSSAI Guide",
      "🌿 Vegan Tagged",
      "💰 Price Metric",
    ];

    const nodes = [];
    const nodeCount = 45;

    for (let i = 0; i < nodeCount; i++) {
      nodes.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.8,
        vy: (Math.random() - 0.5) * 0.8,
        radius: Math.random() * 3.5 + 2,
        label: labels[i % labels.length],
        isLabeled: i < 12,
        color: i % 3 === 0 ? "#10B981" : i % 3 === 1 ? "#F59E0B" : "#A1A1AA",
      });
    }

    const render = () => {
      // Smooth mouse spring interpolation
      mouse.x += (mouse.targetX - mouse.x) * 0.12;
      mouse.y += (mouse.targetY - mouse.y) * 0.12;

      ctx.clearRect(0, 0, width, height);

      // 1. Draw Mouse Spotlight Radial Glow
      const spotlight = ctx.createRadialGradient(
        mouse.x,
        mouse.y,
        0,
        mouse.x,
        mouse.y,
        mouse.radius * 1.6
      );
      spotlight.addColorStop(0, "rgba(16, 185, 129, 0.22)");
      spotlight.addColorStop(0.4, "rgba(245, 158, 11, 0.08)");
      spotlight.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = spotlight;
      ctx.fillRect(0, 0, width, height);

      // 2. Render Nodes and Connections
      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        node.x += node.vx;
        node.y += node.vy;

        // Bounce off canvas edges
        if (node.x < 0 || node.x > width) node.vx *= -1;
        if (node.y < 0 || node.y > height) node.vy *= -1;

        // Calculate distance to cursor
        const dx = mouse.x - node.x;
        const dy = mouse.y - node.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // Draw dynamic laser beam from cursor to nearby nodes
        if (dist < mouse.radius) {
          ctx.beginPath();
          ctx.moveTo(node.x, node.y);
          ctx.lineTo(mouse.x, mouse.y);
          const lineAlpha = (1 - dist / mouse.radius) * 0.6;
          ctx.strokeStyle = `rgba(16, 185, 129, ${lineAlpha})`;
          ctx.lineWidth = 1.2;
          ctx.stroke();
        }

        // Draw connections between neighboring nodes
        for (let j = i + 1; j < nodes.length; j++) {
          const other = nodes[j];
          const ndx = other.x - node.x;
          const ndy = other.y - node.y;
          const ndist = Math.sqrt(ndx * ndx + ndy * ndy);

          if (ndist < 140) {
            ctx.beginPath();
            ctx.moveTo(node.x, node.y);
            ctx.lineTo(other.x, other.y);
            ctx.strokeStyle = `rgba(161, 161, 170, ${0.2 * (1 - ndist / 140)})`;
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        }

        // Draw node dot
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
        ctx.fillStyle = dist < mouse.radius ? "#10B981" : node.color;
        ctx.fill();

        // Draw glowing halo on hovered nodes
        if (dist < mouse.radius) {
          ctx.beginPath();
          ctx.arc(node.x, node.y, node.radius * 2.2, 0, Math.PI * 2);
          ctx.fillStyle = "rgba(16, 185, 129, 0.25)";
          ctx.fill();
        }

        // Draw text label on nodes near cursor
        if (node.isLabeled && dist < mouse.radius * 1.5) {
          const labelAlpha = Math.max(0.3, 1 - dist / (mouse.radius * 1.5));
          ctx.font = "bold 11px system-ui, sans-serif";
          ctx.fillStyle = `rgba(245, 245, 244, ${labelAlpha})`;
          ctx.fillText(node.label, node.x + 8, node.y + 4);
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-vw h-vh pointer-events-none z-0"
    />
  );
}
