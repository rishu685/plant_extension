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
      renderGarden();
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

// Main render function
async function renderGarden() {
  try {
    const result = await chrome.storage.local.get(['garden']);
    const garden = result.garden || {};
    
    const gardenContainer = document.getElementById('garden-container');
    const emptyGarden = document.getElementById('empty-garden');
    
    // Clear existing plants
    gardenContainer.innerHTML = '';
    
    const plants = Object.values(garden);
    
    if (plants.length === 0) {
      // Show empty garden state
      gardenContainer.style.display = 'none';
      emptyGarden.style.display = 'flex';
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
      });
    }
    
    // Update statistics
    updateGardenStats(garden);
    
    console.log('Garden rendered with', plants.length, 'plants');
  } catch (error) {
    console.error('Error rendering garden:', error);
  }
}

// Listen for storage changes to auto-update the display
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'local' && changes.garden) {
    console.log('Garden data changed, re-rendering...');
    renderGarden();
  }
});

// Refresh garden periodically to update time stamps
setInterval(() => {
  const plants = document.querySelectorAll('.plant');
  if (plants.length > 0) {
    renderGarden();
  }
}, 30000); // Update every 30 seconds

// Initialize garden when page loads
document.addEventListener('DOMContentLoaded', () => {
  console.log('Tab Garden page loaded');
  renderGarden();
});

// Also render on window load as backup
window.addEventListener('load', () => {
  renderGarden();
});

// Handle visibility change (when user comes back to the tab)
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) {
    renderGarden();
  }
});

// Add keyboard shortcuts
document.addEventListener('keydown', (event) => {
  // Press 'R' to refresh garden
  if (event.key === 'r' || event.key === 'R') {
    event.preventDefault();
    renderGarden();
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