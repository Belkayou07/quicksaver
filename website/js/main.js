document.addEventListener('DOMContentLoaded', function() {
  // Smooth scrolling for navigation links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      
      const targetId = this.getAttribute('href');
      const targetElement = document.querySelector(targetId);
      
      if (targetElement) {
        window.scrollTo({
          top: targetElement.offsetTop - 80, // Adjust for header height
          behavior: 'smooth'
        });
      }
    });
  });
  
  // Update download links based on browser detection
  const updateDownloadLinks = () => {
    const browserOptionsLinks = document.querySelectorAll('.browser-option');
    const browserName = detectBrowser();
    
    browserOptionsLinks.forEach(link => {
      // Highlight current browser option
      if (link.querySelector('span').textContent.toLowerCase() === browserName) {
        link.classList.add('current-browser');
      }
    });
  };
  
  // Simple browser detection
  const detectBrowser = () => {
    const userAgent = navigator.userAgent.toLowerCase();
    
    if (userAgent.indexOf('edge') > -1 || userAgent.indexOf('edg') > -1) {
      return 'edge';
    } else if (userAgent.indexOf('chrome') > -1 && userAgent.indexOf('opr') === -1) {
      return 'chrome';
    } else if (userAgent.indexOf('firefox') > -1) {
      return 'firefox';
    } else {
      return 'chrome'; // Default to Chrome
    }
  };
  
  // Add year to copyright text
  const updateCopyright = () => {
    const copyrightElement = document.querySelector('.copyright p');
    if (copyrightElement) {
      const currentYear = new Date().getFullYear();
      copyrightElement.textContent = copyrightElement.textContent.replace('2023', currentYear);
    }
  };
  
  // Add mobile menu functionality
  const setupMobileMenu = () => {
    const navLinks = document.querySelector('.nav-links');
    const mobileMenuButton = document.createElement('button');
    mobileMenuButton.classList.add('mobile-menu-toggle');
    mobileMenuButton.innerHTML = '<span></span><span></span><span></span>';
    
    // Only add mobile menu button if screen is small enough
    if (window.innerWidth <= 768) {
      document.querySelector('nav').prepend(mobileMenuButton);
      navLinks.classList.add('hidden');
      
      mobileMenuButton.addEventListener('click', () => {
        navLinks.classList.toggle('hidden');
        mobileMenuButton.classList.toggle('active');
      });
      
      // Close mobile menu when a link is clicked
      navLinks.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
          navLinks.classList.add('hidden');
          mobileMenuButton.classList.remove('active');
        });
      });
    }
  };
  
  // Initialize functions
  updateDownloadLinks();
  updateCopyright();
  
  // Initialize mobile menu only if needed
  if (window.innerWidth <= 768) {
    setupMobileMenu();
  }
  
  // Add mobile menu CSS dynamically
  if (window.innerWidth <= 768) {
    const style = document.createElement('style');
    style.textContent = `
      .mobile-menu-toggle {
        display: block;
        background: none;
        border: none;
        cursor: pointer;
        padding: 10px;
      }
      
      .mobile-menu-toggle span {
        display: block;
        width: 25px;
        height: 3px;
        background-color: white;
        margin: 5px 0;
        transition: var(--transition);
      }
      
      .mobile-menu-toggle.active span:nth-child(1) {
        transform: rotate(45deg) translate(5px, 6px);
      }
      
      .mobile-menu-toggle.active span:nth-child(2) {
        opacity: 0;
      }
      
      .mobile-menu-toggle.active span:nth-child(3) {
        transform: rotate(-45deg) translate(5px, -6px);
      }
      
      .nav-links.hidden {
        display: none;
      }
      
      .current-browser {
        border: 2px solid var(--primary-color);
      }
    `;
    document.head.appendChild(style);
  }
}); 