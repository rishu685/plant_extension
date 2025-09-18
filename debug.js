// Debug script for Tab Garden - Run this in the new tab page console

console.log("🌱 Tab Garden Debug Script");

// Function to check current garden state
async function checkGarden() {
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
}

// Function to create a test plant
async function createTestPlant() {
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
    if (typeof renderGarden === 'function') {
      renderGarden();
    }
    
    return true;
  } catch (error) {
    console.error("❌ Error creating test plant:", error);
    return false;
  }
}

// Function to clear garden
async function clearGarden() {
  try {
    await chrome.storage.local.set({ garden: {} });
    console.log("✅ Garden cleared");
    
    if (typeof renderGarden === 'function') {
      renderGarden();
    }
  } catch (error) {
    console.error("❌ Error clearing garden:", error);
  }
}

// Function to check if animations are working
function testAnimations() {
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
}

// Auto-run diagnostics
console.log("🔍 Running diagnostics...");
checkGarden();
testAnimations();

console.log(`
🛠️ Available debug functions:
- checkGarden() - Check current garden state
- createTestPlant() - Create a test plant
- clearGarden() - Clear all plants
- testAnimations() - Test if animations work

Try running: createTestPlant()
`);