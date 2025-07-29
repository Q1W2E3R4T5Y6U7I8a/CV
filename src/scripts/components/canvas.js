document.addEventListener('DOMContentLoaded', function() {
  const canvas = document.getElementById('interactive-lines');
  const ctx = canvas.getContext('2d');
  
  // Set canvas to full window size
  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  
  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();
  
  // Configuration
  const config = {
    nodeCount: 150,
    maxDistance: 200,
    lineWidth: 0.5,
    nodeRadius: 2,
    baseSpeed: 0.2,
    repulsionDistance: 100,
    mouseInfluence: 5,
    mouseRadius: 150,
    lineColor: 'rgba(100, 100, 100, 0.2)',
    nodeColor: 'rgba(100, 100, 100, 0.5)'
  };
  
  // Nodes array
  const nodes = [];
  
  // Mouse position
  const mouse = { x: null, y: null, isActive: false };
  
  // Track mouse movement
  window.addEventListener('mousemove', (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
    mouse.isActive = true;
  });
  
  window.addEventListener('mouseout', () => {
    mouse.isActive = false;
  });
  
  // Node class
  class Node {
    constructor() {
      this.x = Math.random() * canvas.width;
      this.y = Math.random() * canvas.height;
      this.vx = (Math.random() - 0.5) * config.baseSpeed;
      this.vy = (Math.random() - 0.5) * config.baseSpeed;
      this.radius = config.nodeRadius;
    }
    
    update() {
      // Bounce off edges
      if (this.x <= 0 || this.x >= canvas.width) this.vx *= -1;
      if (this.y <= 0 || this.y >= canvas.height) this.vy *= -1;
      
      // Mouse interaction
      if (mouse.isActive) {
        const dx = mouse.x - this.x;
        const dy = mouse.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < config.mouseRadius) {
          // Repel from mouse
          const angle = Math.atan2(dy, dx);
          const force = config.mouseInfluence / distance;
          
          this.vx -= Math.cos(angle) * force;
          this.vy -= Math.sin(angle) * force;
        }
      }
      
      // Update position
      this.x += this.vx;
      this.y += this.vy;
    }
    
    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fillStyle = config.nodeColor;
      ctx.fill();
    }
  }
  
  // Initialize nodes
  for (let i = 0; i < config.nodeCount; i++) {
    nodes.push(new Node());
  }
  
  // Draw connecting lines
  function drawConnections() {
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const nodeA = nodes[i];
        const nodeB = nodes[j];
        
        const dx = nodeB.x - nodeA.x;
        const dy = nodeB.y - nodeA.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < config.maxDistance) {
          const opacity = 1 - (distance / config.maxDistance);
          ctx.beginPath();
          ctx.moveTo(nodeA.x, nodeA.y);
          ctx.lineTo(nodeB.x, nodeB.y);
          ctx.strokeStyle = `rgba(100, 100, 100, ${opacity * 0.2})`;
          ctx.lineWidth = config.lineWidth;
          ctx.stroke();
        }
      }
    }
  }
  
  // Animation loop
  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Update and draw nodes
    nodes.forEach(node => {
      node.update();
      node.draw();
    });
    
    // Draw connections
    drawConnections();
    
    requestAnimationFrame(animate);
  }
  
  // Start animation
  animate();
});