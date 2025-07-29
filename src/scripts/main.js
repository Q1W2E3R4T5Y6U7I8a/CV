document.addEventListener('DOMContentLoaded', function() {
    // Initialize carousels
    const projects = document.querySelectorAll('.project-card');
    
    projects.forEach(project => {
        const slides = project.querySelectorAll('.carousel-slide');
        const dots = project.querySelectorAll('.nav-dot');
        let currentSlide = 0;
        let intervalId;
        
        // Initialize first slide
        showSlide(currentSlide);
        
        // Add click events to dots
        dots.forEach((dot, index) => {
            dot.addEventListener('click', () => {
                currentSlide = index;
                showSlide(currentSlide);
                resetInterval();
            });
        });
        
        // Start auto rotation
        startInterval();
        
        // Pause on hover
        project.addEventListener('mouseenter', () => {
            clearInterval(intervalId);
        });
        
        // Resume on mouse leave
        project.addEventListener('mouseleave', () => {
            startInterval();
        });
        
        function showSlide(n) {
            // Hide all slides
            slides.forEach(slide => {
                slide.classList.remove('active');
            });
            
            // Remove active class from dots
            dots.forEach(dot => {
                dot.classList.remove('active');
            });
            
            // Show current slide
            slides[n].classList.add('active');
            dots[n].classList.add('active');
            
            // Reset progress bar animation
            const progressBar = slides[n].querySelector('.progress-bar');
            if (progressBar) {
                progressBar.style.width = '0';
                setTimeout(() => {
                    progressBar.style.width = '100%';
                }, 10);
            }
        }
        
        function nextSlide() {
            currentSlide = (currentSlide + 1) % slides.length;
            showSlide(currentSlide);
        }
        
        function startInterval() {
            intervalId = setInterval(nextSlide, 5000);
        }
        
        function resetInterval() {
            clearInterval(intervalId);
            startInterval();
        }
    });
    
    // Add 3D tilt effect to project cards
    const projectCards = document.querySelectorAll('.project-card');
    
    projectCards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            
            const rotateY = (x - centerX) / 25;
            const rotateX = (centerY - y) / 25;
            
            card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(20px)`;
        });
        
        card.addEventListener('mouseleave', () => {
            card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) translateZ(0)';
            setTimeout(() => {
                card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) translateZ(0) translateY(-10px)';
            }, 100);
        });
    });
});