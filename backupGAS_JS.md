document.addEventListener('DOMContentLoaded', () => {
  console.log('[Simple Tracker] Initializing...');

  // Configuration
  const config = {
    endpoint: 'https://script.google.com/macros/s/AKfycbzd5Uwxp7CuWGY9-7JBvETl4aRMyEFofffTy1oGV1ckWC_iEW1pGQQ97IyQYel4e6HWUw/exec',
    sessionTimeout: 1800000, // 30 minutes of inactivity ends session
    debug: true // Set to false in production
  };

  // State management
  const state = {
    sessionStart: Date.now(),
    lastActivity: Date.now(),
    sessionEnded: false
  };

  if (config.debug) {
    console.log('[Simple Tracker] Session started at:', new Date(state.sessionStart).toISOString());
  }

  // Collect essential data
  const getSessionData = () => {
    const data = {
      timestamp: new Date().toISOString(),
      pageUrl: window.location.href,
      screen: `${window.screen.width}x${window.screen.height}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      duration: Math.round((Date.now() - state.sessionStart) / 1000),
      userAgent: navigator.userAgent
    };
    
    if (config.debug) {
      console.log('[Simple Tracker] Collected data:', data);
    }
    
    return data;
  };

  // Activity tracking
  const updateActivity = () => {
    const now = Date.now();
    if (config.debug && (now - state.lastActivity) > 10000) { // Log every 10s of inactivity
      console.log('[Simple Tracker] User activity detected after', (now - state.lastActivity)/1000, 'seconds');
    }
    state.lastActivity = now;
  };

  // Setup activity listeners
  ['mousemove', 'keydown', 'scroll', 'click'].forEach(event => {
    window.addEventListener(event, updateActivity, { passive: true });
  });

  if (config.debug) {
    console.log('[Simple Tracker] Activity listeners registered');
  }

  // Check for session timeout
  const checkSession = () => {
    const inactiveTime = Date.now() - state.lastActivity;
    if (config.debug) {
      console.log('[Simple Tracker] Checking session - inactive for', Math.round(inactiveTime/1000), 'seconds');
    }
    
    if (inactiveTime > config.sessionTimeout && !state.sessionEnded) {
      if (config.debug) {
        console.log('[Simple Tracker] Session timeout reached - ending session');
      }
      endSession();
    }
  };
  
const sendSessionData = async () => {
  const data = getSessionData();
  
  try {
    // Get IP address
    try {
      const ipResponse = await fetch('https://api.ipify.org?format=json');
      data.ip = (await ipResponse.json()).ip;
    } catch (e) {
      data.ip = 'unknown';
    }

    // Try JSONP first (works best with Google Apps Script)
    try {
      await new Promise((resolve, reject) => {
        const callbackName = `jsonp_${Math.random().toString(36).substr(2, 9)}`;
        const script = document.createElement('script');
        
        window[callbackName] = (response) => {
          delete window[callbackName];
          document.body.removeChild(script);
          if (response.status === 'success') {
            resolve();
          } else {
            reject(new Error(response.message || 'JSONP failed'));
          }
        };

        const params = new URLSearchParams();
        params.append('data', JSON.stringify(data));
        params.append('callback', callbackName);
        
        script.src = `${config.endpoint}?${params.toString()}`;
        script.onerror = () => {
          delete window[callbackName];
          document.body.removeChild(script);
          reject(new Error('JSONP request failed'));
        };
        
        document.body.appendChild(script);
      });
      console.log('Data sent successfully via JSONP');
      return;
    } catch (jsonpError) {
      console.log('JSONP failed, trying regular POST');
    }

    // Fallback to regular POST
    const response = await fetch(config.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      mode: 'no-cors' // Important for localhost testing
    });
    
    console.log('POST request attempted (may show CORS error but still work)');
    
  } catch (e) {
    console.error('All data sending methods failed:', e);
  }
};

  // Check session periodically
  const checkInterval = setInterval(checkSession, 60000); // Check every minute
  if (config.debug) {
    console.log('[Simple Tracker] Session check interval started');
  }

  // Handle page exit
  const handlePageExit = () => {
    if (config.debug) {
      console.log('[Simple Tracker] Page exit detected');
    }
    clearInterval(checkInterval);
    endSession();
  };

  window.addEventListener('beforeunload', handlePageExit);
  window.addEventListener('pagehide', handlePageExit);

  if (config.debug) {
    console.log('[Simple Tracker] Exit handlers registered');
  }

  // Start session timeout check
  setTimeout(() => {
    if (config.debug) {
      console.log('[Simple Tracker] Initial session timeout check');
    }
    checkSession();
  }, config.sessionTimeout);

  if (config.debug) {
    console.log('[Simple Tracker] Initialization complete');
  }
window.sendSessionData = sendSessionData;
sendSessionData ()
});

/////////////
/
//////////////
////////

function doGet(e) {
  return handleRequest(e);
}

function doPost(e) {
  return handleRequest(e);
}

function handleRequest(e) {
  // Process the request
  let data = {};
  try {
    if (e.postData) {
      data = JSON.parse(e.postData.contents);
    } else if (e.parameter.data) {
      data = JSON.parse(e.parameter.data);
    }
    
    // Process data to sheet
    const sheet = SpreadsheetApp.openById("1qwpau1mpVfc1T-tzBRe1WdwcLYXZRYyDgfEsrRRHnJM")
      .getSheets()[0];
      
    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        "Timestamp", "IP Address", "Page URL", "Screen Size", 
        "Timezone", "Duration (sec)", "User Agent"
      ]);
    }
    
    sheet.appendRow([
      data.timestamp || new Date().toISOString(),
      data.ip || '',
      data.pageUrl || '',
      data.screen || '',
      data.timezone || '',
      data.duration || 0,
      data.userAgent || ''
    ]);
    
    // Return success - this is CRITICAL for JSONP
    const response = { status: 'success' };
    
    // Handle JSONP callback if present
    if (e.parameter.callback) {
      const jsonpResponse = `${e.parameter.callback}(${JSON.stringify(response)})`;
      return ContentService.createTextOutput(jsonpResponse)
        .setMimeType(ContentService.MimeType.JAVASCRIPT);
    }
    
    // Regular JSON response
    return ContentService.createTextOutput(JSON.stringify(response))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    const response = { status: 'error', message: error.message };
    if (e.parameter.callback) {
      return ContentService.createTextOutput(`${e.parameter.callback}(${JSON.stringify(response)})`)
        .setMimeType(ContentService.MimeType.JAVASCRIPT);
    }
    return ContentService.createTextOutput(JSON.stringify(response))
      .setMimeType(ContentService.MimeType.JSON);
  }
}