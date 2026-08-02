import { useEffect, useRef } from "react";

export default function HeroInteractiveBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    let animationFrameId;
    let width = (canvas.width = canvas.parentElement.offsetWidth);
    let height = (canvas.height = canvas.parentElement.offsetHeight);

    const handleResize = () => {
      if (!canvas || !canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.offsetWidth;
      height = canvas.height = canvas.parentElement.offsetHeight;
    };
    window.addEventListener("resize", handleResize);

    // Mouse coordinates
    const mouse = {
      x: width / 2,
      y: height / 2,
      targetX: width / 2,
      targetY: height / 2,
      radius: 180,
    };

    const handleMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      mouse.targetX = e.clientX - rect.left;
      mouse.targetY = e.clientY - rect.top;
    };
    window.addEventListener("mousemove", handleMouseMove);

    // Node items representing RAG Document Chunks & Culinary Data
    const labels = [
      "📄 Pizza_Menu.pdf",
      "🍕 Spice_Garden_Menu.txt",
      "📋 Safety_SOP.pdf",
      "📊 Restaurant_Directory.csv",
      "⚡ Semantic Cache <15ms",
      "🛡️ 94.2% RRF Grounded",
      "🔍 Dense Vector 384d",
      "📜 FSSAI Compliance",
    ];

    const nodes = [];
    const nodeCount = 18;

    for (let i = 0; i < nodeCount; i++) {
      nodes.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.6,
        vy: (Math.random() - 0.5) * 0.6,
        radius: Math.random() * 3 + 2,
        label: labels[i % labels.length],
        isLabeled: i < 7,
        alpha: Math.random() * 0.5 + 0.3,
      });
    }

    const render = () => {
      // Smooth mouse spring interpolation
      mouse.x += (mouse.targetX - mouse.x) * 0.1;
      mouse.y += (mouse.targetY - mouse.y) * 0.1;

      ctx.clearRect(0, 0, width, height);

      // Draw mouse spotlight glow
      const gradient = ctx.createRadialGradient(
        mouse.x,
        mouse.y,
        0,
        mouse.x,
        mouse.y,
        mouse.radius * 1.8
      );
      gradient.addColorStop(0, "rgba(16, 185, 129, 0.18)");
      gradient.addColorStop(0.5, "rgba(16, 185, 129, 0.05)");
      gradient.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      // Update and draw nodes
      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        node.x += node.vx;
        node.y += node.vy;

        // Bounce off canvas boundaries
        if (node.x < 0 || node.x > width) node.vx *= -1;
        if (node.y < 0 || node.y > height) node.vy *= -1;

        // Calculate distance to mouse cursor
        const dx = mouse.x - node.x;
        const dy = mouse.y - node.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // Draw node connection beam to mouse if within radius
        if (dist < mouse.radius) {
          ctx.beginPath();
          ctx.moveTo(node.x, node.y);
          ctx.lineTo(mouse.x, mouse.y);
          const lineAlpha = (1 - dist / mouse.radius) * 0.5;
          ctx.strokeStyle = `rgba(16, 185, 129, ${lineAlpha})`;
          ctx.lineWidth = 1;
          ctx.stroke();
        }

        // Draw connections between neighboring nodes
        for (let j = i + 1; j < nodes.length; j++) {
          const other = nodes[j];
          const ndx = other.x - node.x;
          const ndy = other.y - node.y;
          const ndist = Math.sqrt(ndx * ndx + ndy * ndy);

          if (ndist < 130) {
            ctx.beginPath();
            ctx.moveTo(node.x, node.y);
            ctx.lineTo(other.x, other.y);
            ctx.strokeStyle = `rgba(161, 161, 170, ${0.15 * (1 - ndist / 130)})`;
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        }

        // Draw node dot
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
        ctx.fillStyle = dist < mouse.radius ? "#10B981" : "rgba(161, 161, 170, 0.4)";
        ctx.fill();

        // Draw node label pill if labeled
        if (node.isLabeled && dist < mouse.radius * 1.4) {
          const labelAlpha = Math.max(0.2, 1 - dist / (mouse.radius * 1.4));
          ctx.font = "11px system-ui, sans-serif";
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
      className="absolute inset-0 w-full h-full pointer-events-none -z-10"
    />
  );
}
