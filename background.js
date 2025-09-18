// Background service worker for Tab Garden extension

// Helper function to determine plant type based on URL domain
function getPlantTypeForUrl(url) {
  try {
    const domain = new URL(url).hostname.toLowerCase();
    
    // Map domains to plant types
    if (domain.includes('youtube.com')) return 'fern';
    if (domain.includes('github.com')) return 'bonsai';
    if (domain.includes('twitter.com') || domain.includes('x.com')) return 'flower';
    if (domain.includes('news') || domain.includes('cnn.com') || domain.includes('bbc.com')) return 'cactus';
    if (domain.includes('google.com')) return 'sunflower';
    if (domain.includes('stackoverflow.com')) return 'tree';
    if (domain.includes('reddit.com')) return 'bamboo';
    
    // Default plant type
    return 'sapling';
  } catch (error) {
    return 'sapling';
  }
}

// Initialize garden storage and set up alarms
chrome.runtime.onInstalled.addListener(async () => {
  console.log('Tab Garden extension installed');
  
  // Initialize empty garden object in storage
  await chrome.storage.local.set({ garden: {} });
  
  // Create alarm for updating wilting state every hour
  chrome.alarms.create('updateWiltingState', { 
    delayInMinutes: 60, 
    periodInMinutes: 60 
  });
  
  // Create alarm for updating time tracking every minute
  chrome.alarms.create('updateTimeTracking', {
    delayInMinutes: 1,
    periodInMinutes: 1
  });
});

// Handle new tab creation and URL updates
chrome.tabs.onCreated.addListener(async (tab) => {
  console.log('Tab created:', tab.id, tab.url);
  // Don't create plants here as URL might not be set yet
});

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  // Only proceed if URL changed and is a valid web URL
  if (changeInfo.url && changeInfo.url.startsWith('http')) {
    console.log('Tab URL updated:', tabId, changeInfo.url);
    
    const result = await chrome.storage.local.get(['garden']);
    const garden = result.garden || {};
    
    if (garden[tabId]) {
      // Update existing plant
      garden[tabId].url = changeInfo.url;
      garden[tabId].plantType = getPlantTypeForUrl(changeInfo.url);
      garden[tabId].lastAccessed = Date.now();
      garden[tabId].state = 'healthy';
      garden[tabId].sessionStartTime = Date.now();
      console.log('Plant updated for URL change:', tabId);
    } else {
      // Create new plant
      garden[tabId] = {
        id: tabId,
        url: changeInfo.url,
        plantType: getPlantTypeForUrl(changeInfo.url),
        addedOn: Date.now(),
        lastAccessed: Date.now(),
        state: 'healthy',
        timeSpent: 0,
        growthLevel: 1,
        sessionStartTime: Date.now(),
        totalVisits: 1
      };
      console.log('New plant created for tab:', tabId, garden[tabId]);
    }
    
    await chrome.storage.local.set({ garden });
  }
});

// Handle tab activation (when user switches to a tab)
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  const result = await chrome.storage.local.get(['garden']);
  const garden = result.garden || {};
  
  if (garden[activeInfo.tabId]) {
    const now = Date.now();
    const plant = garden[activeInfo.tabId];
    
    // If there was a previous session, add that time to total
    if (plant.sessionStartTime) {
      const sessionTime = now - plant.sessionStartTime;
      plant.timeSpent += sessionTime;
    }
    
    // Start new session
    plant.sessionStartTime = now;
    plant.lastAccessed = now;
    plant.state = 'healthy';
    plant.totalVisits += 1;
    
    // Calculate growth level based on time spent (every 5 minutes = 1 growth level)
    const minutesSpent = plant.timeSpent / (1000 * 60);
    plant.growthLevel = Math.min(5, Math.floor(minutesSpent / 5) + 1);
    
    await chrome.storage.local.set({ garden });
    console.log('Tab accessed, plant refreshed:', activeInfo.tabId, 'Growth level:', plant.growthLevel);
  }
});

// Handle tab removal
chrome.tabs.onRemoved.addListener(async (tabId) => {
  const result = await chrome.storage.local.get(['garden']);
  const garden = result.garden || {};
  
  if (garden[tabId]) {
    const plant = garden[tabId];
    
    // Add any remaining session time before removing
    if (plant.sessionStartTime) {
      const sessionTime = Date.now() - plant.sessionStartTime;
      plant.timeSpent += sessionTime;
      plant.sessionStartTime = null;
    }
    
    // Save final time before deletion (for potential statistics)
    console.log(`Plant removed - Total time spent: ${Math.round(plant.timeSpent / (1000 * 60))} minutes, Growth level: ${plant.growthLevel}`);
    
    delete garden[tabId];
    await chrome.storage.local.set({ garden });
    console.log('Plant removed from garden:', tabId);
  }
});

// Handle wilting state and time tracking alarms
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'updateWiltingState') {
    const result = await chrome.storage.local.get(['garden']);
    const garden = result.garden || {};
    
    const now = Date.now();
    const twentyFourHours = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
    
    let plantsUpdated = 0;
    
    // Check each plant for wilting
    for (const tabId in garden) {
      const plant = garden[tabId];
      const timeSinceAccess = now - plant.lastAccessed;
      
      if (timeSinceAccess > twentyFourHours && plant.state === 'healthy') {
        plant.state = 'wilting';
        plantsUpdated++;
      }
    }
    
    if (plantsUpdated > 0) {
      await chrome.storage.local.set({ garden });
      console.log(`${plantsUpdated} plants started wilting`);
    }
  }
  
  if (alarm.name === 'updateTimeTracking') {
    // Update time tracking for currently active tabs
    const result = await chrome.storage.local.get(['garden']);
    const garden = result.garden || {};
    
    // Get active tab in each window
    const windows = await chrome.windows.getAll();
    let updated = false;
    
    for (const window of windows) {
      const tabs = await chrome.tabs.query({ active: true, windowId: window.id });
      
      for (const tab of tabs) {
        if (garden[tab.id] && garden[tab.id].sessionStartTime) {
          const now = Date.now();
          const sessionTime = now - garden[tab.id].sessionStartTime;
          garden[tab.id].timeSpent += sessionTime;
          garden[tab.id].sessionStartTime = now; // Reset session start time
          
          // Update growth level
          const minutesSpent = garden[tab.id].timeSpent / (1000 * 60);
          const newGrowthLevel = Math.min(5, Math.floor(minutesSpent / 5) + 1);
          
          if (newGrowthLevel !== garden[tab.id].growthLevel) {
            garden[tab.id].growthLevel = newGrowthLevel;
            console.log(`Plant ${tab.id} grew to level ${newGrowthLevel}!`);
          }
          
          updated = true;
        }
      }
    }
    
    if (updated) {
      await chrome.storage.local.set({ garden });
    }
  }
});

// Clean up garden on startup by removing plants for closed tabs
chrome.runtime.onStartup.addListener(async () => {
  const result = await chrome.storage.local.get(['garden']);
  const garden = result.garden || {};
  
  // Get all current tabs
  const tabs = await chrome.tabs.query({});
  const currentTabIds = new Set(tabs.map(tab => tab.id.toString()));
  
  // Remove plants for tabs that no longer exist
  let cleaned = false;
  for (const tabId in garden) {
    if (!currentTabIds.has(tabId)) {
      delete garden[tabId];
      cleaned = true;
    }
  }
  
  if (cleaned) {
    await chrome.storage.local.set({ garden });
    console.log('Garden cleaned up on startup');
  }
});