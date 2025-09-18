// Debug script for Tab Garden - Run this in the new tab page console

console.log("🌱 Tab Garden Debug Script Loaded");

// Simple test function to verify the script is loaded
window.debugTest = function() {
  console.log("✅ Debug script is working!");
  return "Debug script loaded successfully";
};

// Function to check current garden state - Make it globally accessible
window.checkGarden = async function checkGarden() {
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

// Function to create a test plant - Make it globally accessible
window.createTestPlant = async function createTestPlant() {
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
    } else {
      console.warn('renderGarden not available - reload the new tab page');
    }
    
    return true;
  } catch (error) {
    console.error("❌ Error creating test plant:", error);
    return false;
  }
};

// Function to clear garden - Make it globally accessible
window.clearGarden = async function clearGarden() {
  try {
    await chrome.storage.local.set({ garden: {} });
    console.log("✅ Garden cleared");
    
    if (typeof window.renderGarden === 'function') {
      window.renderGarden();
    } else {
      console.warn('renderGarden not available - reload the new tab page');
    }
  } catch (error) {
    console.error("❌ Error clearing garden:", error);
  }
};

// Function to check if animations are working - Make it globally accessible
window.testAnimations = function testAnimations() {
  console.log("🎭 Testing animations...");
  
  // Check if CSS animations are loaded
  const testElement = document.createElement('div');
  testElement.style.animation = 'plant-appear 0.6s ease-out';
  document.body.appendChild(testElement);
  
  const computedStyle = window.getComputedStyle(testElement);
  const animation = computedStyle.animation || computedStyle.webkitAnimation;
  
  document.body.removeChild(testElement);
  
  if (animation && animation !== 'none') {
    console.log("✅ CSS animations are working");
  } else {
    console.log("❌ CSS animations not working");
  }
  
  // Test particle system
  const particles = document.querySelector('.floating-particles');
  if (particles) {
    console.log("✅ Particle system element found");
  } else {
    console.log("❌ Particle system element missing");
  }
};

// Auto-run diagnostics
console.log("🔍 Running diagnostics...");
window.checkGarden();
window.testAnimations();

console.log(`
🛠️ Available debug functions:
- debugTest() - Test if debug script is loaded
- checkGarden() - Check current garden state
- createTestPlant() - Create a test plant
- clearGarden() - Clear all plants
- testAnimations() - Test if animations work
- runFullTest() - Run complete functionality test

Try running: debugTest() first, then createTestPlant()
`);

// Comprehensive test function
window.runFullTest = async function() {
  console.log("🧪 Running full Tab Garden test...");
  
  try {
    // Test 1: Check if extension APIs are available
    if (typeof chrome !== 'undefined' && chrome.storage) {
      console.log("✅ Chrome extension APIs available");
    } else {
      console.log("❌ Chrome extension APIs not available");
      return;
    }
    
    // Test 2: Check storage access
    await window.checkGarden();
    
    // Test 3: Create test plant
    await window.createTestPlant();
    
    // Test 4: Test animations
    window.testAnimations();
    
    // Test 5: Check if renderGarden works
    if (typeof window.renderGarden === 'function') {
      console.log("✅ renderGarden function available");
      window.renderGarden();
    } else {
      console.log("❌ renderGarden function not available");
    }
    
    console.log("🎉 Full test completed!");
    
  } catch (error) {
    console.error("❌ Test failed:", error);
  }
};