document.addEventListener('DOMContentLoaded', () => {
  console.log('[Simple Tracker] Initializing...');

  // Configuration
  const config = {
    endpoint: 'https://script.google.com/macros/s/AKfycbynd-0HUXbrNO_aV8n0kKtFWcPxlGw1ggJQOM8D72MhO46GndVYpvViyq2tiTAlCdNNTA/exec',
    sessionTimeout: 1800000, // 30 minutes of inactivity ends session
    debug: true // Set to false in production
  };

  // State management
  const state = {
    sessionStart: Date.now(),
    lastActivity: Date.now(),
    sessionEnded: false,
    clickCount: 0,
    maxScrollDepth: 0
  };

  if (config.debug) {
    console.log('[Simple Tracker] Session started at:', new Date(state.sessionStart).toISOString());
  }

  state.ip = 'unknown';

  fetch('https://api.ipify.org?format=json')
    .then(res => res.json())
    .then(json => {
      state.ip = json.ip;
      if (config.debug) console.log('[Simple Tracker] IP fetched:', state.ip);
    })
    .catch(() => {
      if (config.debug) console.warn('[Simple Tracker] Failed to fetch IP');
    });


  // Collect essential data
  const getSessionData = () => {
    const data = {
      timestamp: new Date().toISOString(),
      pageUrl: window.location.href,
      screen: `${window.screen.width}x${window.screen.height}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      duration: Math.round((Date.now() - state.sessionStart) / 1000),
      userAgent: navigator.userAgent,
      clickCount: state.clickCount,
      scrollDepth: Math.round(state.maxScrollDepth),
       ip: state.ip
    };
    
    if (config.debug) {
      console.log('[Simple Tracker] Collected data:', data);
    }
    
    return data;
  };

  // Activity tracking
  const updateActivity = () => {
    state.lastActivity = Date.now();
  };

  // Click counter
document.addEventListener('click', () => {
  state.clickCount++;
  console.log(`[Simple Tracker] Click detected, total: ${state.clickCount}`);
});

  // Scroll depth tracker
  const trackScrollDepth = () => {
    const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
    const scrolled = window.scrollY;
    const percentage = (scrolled / scrollHeight) * 100;
    
    if (percentage > state.maxScrollDepth) {
      state.maxScrollDepth = percentage;
      if (config.debug) {
        console.log(`[Simple Tracker] New max scroll depth: ${Math.round(percentage)}%`);
      }
    }
  };

  // Setup activity listeners
  ['mousemove', 'keydown', 'scroll', 'click'].forEach(event => {
    window.addEventListener(event, updateActivity, { passive: true });
  });

  // Add scroll listener
  window.addEventListener('scroll', trackScrollDepth, { passive: true });

  if (config.debug) {
    console.log('[Simple Tracker] Activity listeners registered');
  }

  // End session handler
const endSession = () => {
  if (state.sessionEnded) return;
  state.sessionEnded = true;

  const data = getSessionData();

  try {
    navigator.sendBeacon(config.endpoint, JSON.stringify(data));
    if (config.debug) console.log('[Simple Tracker] Data sent with sendBeacon');
  } catch (e) {
    if (config.debug) console.warn('sendBeacon failed:', e);
  }
};


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

      // Try JSONP first
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
        mode: 'no-cors'
      });
      
      console.log('POST request attempted');
      
    } catch (e) {
      console.error('All data sending methods failed:', e);
    }
  };

  window.sendSessionData = sendSessionData;


  // Check session periodically
  const checkInterval = setInterval(checkSession, 60000);
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
});