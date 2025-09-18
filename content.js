// Content script for Tab Garden - Shows tiny plant overlay on tabs

(function() {
  'use strict';
  
  let plantOverlay = null;
  let currentTabId = null;
  let growthLevel = 1;
  let plantType = 'sapling';
  
  // Plant emoji mapping
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
  
  // Growth stage modifiers
  const GROWTH_STAGES = {
    1: { size: '12px', opacity: 0.6, filter: 'none' },
    2: { size: '14px', opacity: 0.7, filter: 'brightness(1.1)' },
    3: { size: '16px', opacity: 0.8, filter: 'brightness(1.2) saturate(1.1)' },
    4: { size: '18px', opacity: 0.9, filter: 'brightness(1.3) saturate(1.2)' },
    5: { size: '20px', opacity: 1.0, filter: 'brightness(1.4) saturate(1.3) drop-shadow(0 0 3px rgba(255,215,0,0.5))' }
  };
  
  // Create plant overlay element
  function createPlantOverlay() {
    if (plantOverlay) return;
    
    plantOverlay = document.createElement('div');
    plantOverlay.id = 'tab-garden-overlay';
    plantOverlay.style.cssText = `
      position: fixed;
      top: 10px;
      right: 10px;
      z-index: 999999;
      pointer-events: none;
      font-size: 12px;
      background: rgba(255, 255, 255, 0.9);
      border-radius: 50%;
      width: 30px;
      height: 30px;
      display: flex;
      align-items: center;
      justify-content: center;
      backdrop-filter: blur(5px);
      border: 1px solid rgba(255, 255, 255, 0.3);
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      transition: all 0.3s ease;
      animation: gentle-pulse 3s ease-in-out infinite;
    `;
    
    // Add CSS animation
    const style = document.createElement('style');
    style.textContent = `
      @keyframes gentle-pulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.05); }
      }
      
      @keyframes plant-grow {
        0% { transform: scale(0.8) rotate(-5deg); }
        50% { transform: scale(1.1) rotate(2deg); }
        100% { transform: scale(1) rotate(0deg); }
      }
      
      #tab-garden-overlay.growing {
        animation: plant-grow 0.5s ease-out;
      }
    `;
    document.head.appendChild(style);
    
    document.body.appendChild(plantOverlay);
  }
  
  // Update plant overlay appearance
  function updatePlantOverlay(level, type, timeSpent) {
    if (!plantOverlay) return;
    
    const emoji = PLANT_EMOJIS[type] || PLANT_EMOJIS['sapling'];
    const stage = GROWTH_STAGES[level] || GROWTH_STAGES[1];
    
    plantOverlay.innerHTML = emoji;
    plantOverlay.style.fontSize = stage.size;
    plantOverlay.style.opacity = stage.opacity;
    plantOverlay.style.filter = stage.filter;
    
    // Add growth animation if level increased
    if (level > growthLevel) {
      plantOverlay.classList.add('growing');
      setTimeout(() => {
        plantOverlay.classList.remove('growing');
      }, 500);
    }
    
    growthLevel = level;
    plantType = type;
    
    // Update tooltip
    const minutes = Math.round(timeSpent / (1000 * 60));
    plantOverlay.title = `Tab Garden Plant (Level ${level})\nTime spent: ${minutes} minutes\nType: ${type}`;
  }
  
  // Get current tab info and update overlay
  async function updateFromStorage() {
    try {
      const result = await chrome.storage.local.get(['garden']);
      const garden = result.garden || {};
      
      // Get current tab ID from Chrome API
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tabs.length > 0) {
        currentTabId = tabs[0].id;
        
        const plant = garden[currentTabId];
        if (plant) {
          updatePlantOverlay(plant.growthLevel || 1, plant.plantType || 'sapling', plant.timeSpent || 0);
        }
      }
    } catch (error) {
      console.log('Tab Garden overlay: Could not access storage');
    }
  }
  
  // Initialize overlay when page loads
  function initOverlay() {
    // Only show on regular web pages, not chrome:// pages
    if (window.location.protocol === 'chrome:' || window.location.protocol === 'chrome-extension:') {
      return;
    }
    
    createPlantOverlay();
    updateFromStorage();
    
    // Update overlay periodically
    setInterval(updateFromStorage, 5000); // Every 5 seconds
  }
  
  // Listen for storage changes
  if (typeof chrome !== 'undefined' && chrome.storage) {
    chrome.storage.onChanged.addListener((changes, namespace) => {
      if (namespace === 'local' && changes.garden) {
        updateFromStorage();
      }
    });
  }
  
  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initOverlay);
  } else {
    initOverlay();
  }
  
  // Handle page visibility changes
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && plantOverlay) {
      updateFromStorage();
    }
  });
  
})();