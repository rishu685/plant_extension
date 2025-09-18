// Tab Garden - New Tab Page JavaScript

// Plant type to emoji mapping
const PLANT_EMOJIS = {
  'fern': '🌿',
  'bonsai': '🌳',
  'flower': '🌸',
  'cactus': '🌵',
  'sunflower': '🌻',
  'tree': '🌲',
  'bamboo': '🎋',
  'sapling': '🌱'
};

// Get domain name from URL
function getDomainFromUrl(url) {
  try {
    const domain = new URL(url).hostname;
    return domain.replace('www.', '');
  } catch (error) {
    return 'Unknown';
  }
}

// Format time ago string
function getTimeAgo(timestamp) {
  const now = Date.now();
  const diff = now - timestamp;
  
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return 'Just now';
}

// Format time spent string
function formatTimeSpent(milliseconds) {
  const minutes = Math.floor(milliseconds / (1000 * 60));
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) return `${days}d ${hours % 24}h`;
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  return `${minutes}m`;
}

// Get growth stage name
function getGrowthStageName(level) {
  const stages = {
    1: 'Seedling',
    2: 'Sprout', 
    3: 'Young',
    4: 'Mature',
    5: 'Ancient'
  };
  return stages[level] || 'Seedling';
}

// Create plant element
function createPlantElement(plant) {
  const plantElement = document.createElement('div');
  plantElement.className = `plant ${plant.state} growth-${plant.growthLevel || 1}`;
  plantElement.dataset.tabId = plant.id;
  plantElement.dataset.previousGrowth = plant.growthLevel || 1;
  
  const emoji = PLANT_EMOJIS[plant.plantType] || PLANT_EMOJIS['sapling'];
  const domain = getDomainFromUrl(plant.url);
  const timeAgo = getTimeAgo(plant.lastAccessed);
  const timeSpent = formatTimeSpent(plant.timeSpent || 0);
  const growthStage = getGrowthStageName(plant.growthLevel || 1);
  
  plantElement.innerHTML = `
    <div class="plant-icon">${emoji}</div>
    <div class="plant-info">
      <div class="plant-domain" title="${domain}">${domain}</div>
      <div class="plant-age">${timeAgo}</div>
      <div class="plant-growth level-${plant.growthLevel || 1}">Level ${plant.growthLevel || 1} ${growthStage}</div>
      <div class="plant-time">⏱️ ${timeSpent}</div>
      <div class="plant-state ${plant.state}">${plant.state}</div>
    </div>
  `;
  
  // Add click handler to switch to tab
  plantElement.addEventListener('click', async () => {
    try {
      await chrome.tabs.update(parseInt(plant.id), { active: true });
      window.close(); // Close new tab after switching
    } catch (error) {
      console.log('Could not switch to tab:', error);
      // Tab might have been closed, trigger a refresh
      window.renderGarden();
    }
  });
  
  return plantElement;
}

// Update garden statistics
function updateGardenStats(garden) {
  const plants = Object.values(garden);
  const healthyCount = plants.filter(p => p.state === 'healthy').length;
  const wiltingCount = plants.filter(p => p.state === 'wilting').length;
  
  // Calculate total time and average growth
  const totalTime = plants.reduce((sum, p) => sum + (p.timeSpent || 0), 0);
  const avgGrowthLevel = plants.length > 0 
    ? (plants.reduce((sum, p) => sum + (p.growthLevel || 1), 0) / plants.length).toFixed(1)
    : 1;
  
  document.getElementById('plant-count').textContent = 
    `${plants.length} plant${plants.length !== 1 ? 's' : ''} growing`;
  document.getElementById('healthy-count').textContent = `${healthyCount} healthy`;
  document.getElementById('wilting-count').textContent = `${wiltingCount} wilting`;
  
  // Add growth statistics
  const statsContainer = document.querySelector('.garden-stats');
  let growthStats = document.getElementById('growth-stats');
  
  if (!growthStats) {
    growthStats = document.createElement('span');
    growthStats.id = 'growth-stats';
    statsContainer.appendChild(document.createElement('span')).className = 'separator';
    statsContainer.appendChild(growthStats);
  }
  
  const totalHours = Math.round(totalTime / (1000 * 60 * 60) * 10) / 10;
  growthStats.textContent = `${totalHours}h total • Avg Level ${avgGrowthLevel}`;
}

// Main render function - Make it globally accessible
window.renderGarden = async function renderGarden() {
  try {
    console.log('🌱 Rendering garden...');
    const result = await chrome.storage.local.get(['garden']);
    const garden = result.garden || {};
    
    console.log('Garden data:', garden);
    
    const gardenContainer = document.getElementById('garden-container');
    const emptyGarden = document.getElementById('empty-garden');
    const loadingElement = document.getElementById('garden-loading');
    
    if (!gardenContainer || !emptyGarden) {
      console.error('❌ Garden container elements not found');
      return;
    }
    
    // Show loading briefly
    if (loadingElement) {
      loadingElement.style.display = 'flex';
      gardenContainer.style.display = 'none';
      emptyGarden.style.display = 'none';
    }
    
    setTimeout(() => {
      // Clear existing plants
      gardenContainer.innerHTML = '';
      
      const plants = Object.values(garden);
      console.log('Found', plants.length, 'plants to render');
      
      if (plants.length === 0) {
        // Show empty garden state
        gardenContainer.style.display = 'none';
        emptyGarden.style.display = 'flex';
        console.log('Showing empty garden state');
      } else {
        // Show garden with plants
        gardenContainer.style.display = 'grid';
        emptyGarden.style.display = 'none';
        
        // Sort plants by growth level first, then by last accessed time
        plants.sort((a, b) => {
          // Primary sort: Growth level (highest first)
          if (b.growthLevel !== a.growthLevel) {
            return (b.growthLevel || 1) - (a.growthLevel || 1);
          }
          // Secondary sort: Most recently accessed
          return b.lastAccessed - a.lastAccessed;
        });
        
        // Create and append plant elements with growth animations
        plants.forEach((plant, index) => {
          const plantElement = createPlantElement(plant);
          
          // Check if plant has grown since last render
          const existingPlant = document.querySelector(`[data-tab-id="${plant.id}"]`);
          if (existingPlant) {
            const previousGrowth = parseInt(existingPlant.dataset.previousGrowth) || 1;
            if ((plant.growthLevel || 1) > previousGrowth) {
              plantElement.classList.add('growing');
              setTimeout(() => {
                plantElement.classList.remove('growing');
              }, 800);
            }
          }
          
          // Stagger the appearance of plants for a nice effect
          plantElement.style.animationDelay = `${index * 0.1}s`;
          gardenContainer.appendChild(plantElement);
          console.log('Added plant to garden:', plant.plantType, plant.url);
        });
        
        console.log('✅ Garden rendered with', plants.length, 'plants');
      }
      
      // Hide loading
      if (loadingElement) {
        loadingElement.style.display = 'none';
      }
      
      // Update statistics
      updateGardenStats(garden);
    }, 300); // Short delay to show loading animation
    
  } catch (error) {
    console.error('❌ Error rendering garden:', error);
    
    // Hide loading on error
    const loadingElement = document.getElementById('garden-loading');
    if (loadingElement) {
      loadingElement.style.display = 'none';
    }
  }
};

// Listen for storage changes to auto-update the display
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'local' && changes.garden) {
    console.log('Garden data changed, re-rendering...');
    window.renderGarden();
  }
});

// Refresh garden periodically to update time stamps
setInterval(() => {
  const plants = document.querySelectorAll('.plant');
  if (plants.length > 0) {
    window.renderGarden();
  }
}, 30000); // Update every 30 seconds

// Initialize garden when page loads with enhanced animations
document.addEventListener('DOMContentLoaded', () => {
  console.log('Tab Garden page loaded');
  
  // Add entrance animation to page elements
  addEntranceAnimations();
  
  // Start background particle animation
  initializeParticleSystem();
  
  // Render garden
  window.renderGarden();
  
  // Add interactive mouse effects
  addMouseInteractions();
});

// Add entrance animations
function addEntranceAnimations() {
  // Animate header elements
  const header = document.querySelector('.garden-header');
  if (header) {
    header.style.opacity = '0';
    header.style.transform = 'translateY(-30px)';
    
    setTimeout(() => {
      header.style.transition = 'all 1s ease-out';
      header.style.opacity = '1';
      header.style.transform = 'translateY(0)';
    }, 100);
  }
}

// Initialize enhanced particle system
function initializeParticleSystem() {
  const particleContainer = document.querySelector('.floating-particles');
  if (!particleContainer) return;
  
  // Add more dynamic particles
  setInterval(() => {
    if (Math.random() < 0.3) { // 30% chance every interval
      createFloatingParticle();
    }
  }, 2000);
}

// Create floating particle
function createFloatingParticle() {
  const particleContainer = document.querySelector('.floating-particles');
  if (!particleContainer) return;
  
  const particle = document.createElement('div');
  particle.className = 'particle dynamic';
  
  // Random properties
  const size = Math.random() * 4 + 2;
  const colors = [
    'rgba(120, 200, 80, 0.7)',
    'rgba(100, 180, 255, 0.6)',
    'rgba(255, 200, 100, 0.8)',
    'rgba(200, 100, 255, 0.5)',
    'rgba(255, 180, 120, 0.7)'
  ];
  
  particle.style.width = size + 'px';
  particle.style.height = size + 'px';
  particle.style.background = colors[Math.floor(Math.random() * colors.length)];
  particle.style.left = Math.random() * 100 + '%';
  particle.style.animationDuration = (Math.random() * 10 + 15) + 's';
  particle.style.animationDelay = '0s';
  
  particleContainer.appendChild(particle);
  
  // Remove particle after animation
  setTimeout(() => {
    if (particle.parentNode) {
      particle.parentNode.removeChild(particle);
    }
  }, 25000);
}

// Add mouse interaction effects
function addMouseInteractions() {
  document.addEventListener('mousemove', (e) => {
    const mouseX = e.clientX / window.innerWidth;
    const mouseY = e.clientY / window.innerHeight;
    
    // Create subtle background shift based on mouse position
    const background = document.body;
    const shiftX = (mouseX - 0.5) * 20;
    const shiftY = (mouseY - 0.5) * 20;
    
    background.style.backgroundPosition = `${shiftX}px ${shiftY}px`;
  });
  
  // Add click ripple effect
  document.addEventListener('click', (e) => {
    createRippleEffect(e.clientX, e.clientY);
  });
}

// Create ripple effect on click
function createRippleEffect(x, y) {
  const ripple = document.createElement('div');
  ripple.style.cssText = `
    position: fixed;
    top: ${y}px;
    left: ${x}px;
    width: 0;
    height: 0;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(255,255,255,0.3) 0%, transparent 70%);
    pointer-events: none;
    z-index: 1000;
    animation: ripple-expand 0.6s ease-out;
  `;
  
  document.body.appendChild(ripple);
  
  // Add ripple animation
  const style = document.createElement('style');
  if (!document.querySelector('#ripple-style')) {
    style.id = 'ripple-style';
    style.textContent = `
      @keyframes ripple-expand {
        0% { 
          width: 0; 
          height: 0; 
          opacity: 0.8; 
          transform: translate(-50%, -50%); 
        }
        100% { 
          width: 100px; 
          height: 100px; 
          opacity: 0; 
          transform: translate(-50%, -50%); 
        }
      }
    `;
    document.head.appendChild(style);
  }
  
  setTimeout(() => {
    if (ripple.parentNode) {
      ripple.parentNode.removeChild(ripple);
    }
  }, 600);
}

// Also render on window load as backup
window.addEventListener('load', () => {
  window.renderGarden();
});

// Handle visibility change (when user comes back to the tab)
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) {
    window.renderGarden();
  }
});

// Add keyboard shortcuts
document.addEventListener('keydown', (event) => {
  // Press 'R' to refresh garden
  if (event.key === 'r' || event.key === 'R') {
    event.preventDefault();
    window.renderGarden();
  }
  
  // Press 'Escape' to close new tab
  if (event.key === 'Escape') {
    window.close();
  }
});

// Add context menu for plants (right-click actions)
document.addEventListener('contextmenu', (event) => {
  const plant = event.target.closest('.plant');
  if (plant) {
    event.preventDefault();
    
    // Create simple context menu
    const contextMenu = document.createElement('div');
    contextMenu.style.cssText = `
      position: fixed;
      top: ${event.clientY}px;
      left: ${event.clientX}px;
      background: rgba(255, 255, 255, 0.95);
      border-radius: 8px;
      padding: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      z-index: 1000;
      font-size: 14px;
      min-width: 120px;
    `;
    
    contextMenu.innerHTML = `
      <div style="padding: 8px; cursor: pointer; border-radius: 4px;" 
           onmouseover="this.style.background='rgba(0,0,0,0.1)'" 
           onmouseout="this.style.background='transparent'"
           onclick="chrome.tabs.remove(parseInt('${plant.dataset.tabId}')); this.parentElement.remove();">
        Close Tab
      </div>
    `;
    
    document.body.appendChild(contextMenu);
    
    // Remove context menu when clicking elsewhere
    setTimeout(() => {
      document.addEventListener('click', () => {
        if (contextMenu.parentElement) {
          contextMenu.remove();
        }
      }, { once: true });
    }, 100);
  }
});

// Debug functions - added directly to ensure they're always available
console.log("🌱 Adding debug functions to Tab Garden...");

window.debugTest = function() {
    console.log("✅ Debug functions are working!");
    return "Debug functions loaded successfully";
};

window.checkGarden = async function() {
    try {
        const result = await chrome.storage.local.get(['garden']);
        console.log("Current garden state:", result.garden);
        
        if (!result.garden || Object.keys(result.garden).length === 0) {
            console.log("❌ Garden is empty - no plants found");
            return false;
        } else {
            console.log("✅ Garden has", Object.keys(result.garden).length, "plants");
            return true;
        }
    } catch (error) {
        console.error("❌ Error accessing storage:", error);
        return false;
    }
};

window.createTestPlant = async function() {
    try {
        const result = await chrome.storage.local.get(['garden']);
        const garden = result.garden || {};
        
        // Create a test plant for YouTube
        garden['test-youtube'] = {
            id: 'test-youtube',
            url: 'https://youtube.com',
            plantType: 'fern',
            addedOn: Date.now(),
            lastAccessed: Date.now(),
            state: 'healthy',
            timeSpent: 300000, // 5 minutes
            growthLevel: 2,
            sessionStartTime: null,
            totalVisits: 3
        };
        
        await chrome.storage.local.set({ garden });
        console.log("✅ Test plant created!");
        
        // Force re-render
        if (typeof window.renderGarden === 'function') {
            window.renderGarden();
        }
        
        return true;
    } catch (error) {
        console.error("❌ Error creating test plant:", error);
        return false;
    }
};

window.runFullTest = async function() {
    console.log("🧪 Running full Tab Garden test...");
    
    try {
        console.log("✅ Chrome extension APIs available");
        await window.checkGarden();
        await window.createTestPlant();
        console.log("🎉 Full test completed!");
    } catch (error) {
        console.error("❌ Test failed:", error);
    }
};

console.log("✅ Debug functions added to Tab Garden!");
console.log("Try: debugTest() or createTestPlant()");