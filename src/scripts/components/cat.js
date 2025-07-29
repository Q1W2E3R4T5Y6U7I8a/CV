// cat-eyes.js - non-module version
document.addEventListener('DOMContentLoaded', () => {
  const cat = document.querySelector('.cat');
  if (cat) {
    const pupils = document.querySelectorAll('.pupil');
    
    function calculateEyeCenters() {
      const catRect = cat.getBoundingClientRect();
      const catCenterX = catRect.left + catRect.width / 2;
      const catCenterY = catRect.top + catRect.height / 2;
      
      return [
        { x: catCenterX - 35, y: catCenterY - 60 },  // Left eye
        { x: catCenterX + 35, y: catCenterY - 60 }   // Right eye
      ];
    }

    const MAX_MOVEMENT = 0.9;

    document.addEventListener('mousemove', (e) => {
      const eyeCenters = calculateEyeCenters();
      
      pupils.forEach((pupil, index) => {
        if (!eyeCenters[index]) return;
        
        const eyeCenter = eyeCenters[index];
        const dx = e.clientX - eyeCenter.x;
        const dy = e.clientY - eyeCenter.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const limitedDistance = Math.min(distance, MAX_MOVEMENT);
        const ratio = limitedDistance / distance;
        
        pupil.style.transform = `translate(calc(-50% + ${dx * ratio}px), calc(-50% + ${dy * ratio}px))`;
      });
    });

    // Reset pupils when mouse leaves window
    document.addEventListener('mouseleave', () => {
      pupils.forEach(pupil => {
        pupil.style.transform = 'translate(-50%, -50%)';
      });
    });

    window.addEventListener('resize', () => {
      pupils.forEach(pupil => {
        pupil.style.transform = 'translate(-50%, -50%)';
      });
    });
  }
});