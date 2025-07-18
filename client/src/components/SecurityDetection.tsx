import { useEffect } from 'react';

interface SecurityDetectionProps {
  onIncognitoDetected?: () => void;
  onVPNDetected?: () => void;
}

export default function SecurityDetection({ 
  onIncognitoDetected, 
  onVPNDetected 
}: SecurityDetectionProps) {
  
  useEffect(() => {
    // Incognito/Private browsing detection
    function detectIncognito() {
      // Method 1: Storage quota test
      if ('storage' in navigator && 'estimate' in navigator.storage) {
        navigator.storage.estimate().then((estimate) => {
          // Private browsing typically has very limited quota
          if (estimate.quota && estimate.quota < 120000000) { // Less than ~120MB
            reportIncognito();
          }
        }).catch(() => {
          // Storage API failed, might be incognito
          reportIncognito();
        });
      }

      // Method 2: IndexedDB test
      try {
        const idbRequest = indexedDB.open('test');
        idbRequest.onerror = () => reportIncognito();
        idbRequest.onsuccess = () => {
          // Clean up test database
          const db = idbRequest.result;
          db.close();
          indexedDB.deleteDatabase('test');
        };
      } catch (e) {
        reportIncognito();
      }

      // Method 3: WebRTC test
      if ('RTCPeerConnection' in window) {
        try {
          const rtc = new RTCPeerConnection({
            iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
          });
          
          rtc.createDataChannel('test');
          
          rtc.createOffer().then(() => {
            // WebRTC works normally
          }).catch(() => {
            // WebRTC might be blocked in private mode
            reportIncognito();
          });
          
          rtc.close();
        } catch (e) {
          reportIncognito();
        }
      }

      // Method 4: RequestFileSystem (deprecated but still works in some browsers)
      const requestFileSystem = (window as any).RequestFileSystem || 
                               (window as any).webkitRequestFileSystem;
      if (requestFileSystem) {
        requestFileSystem(window.TEMPORARY, 100, 
          () => {}, // Success - not incognito
          () => reportIncognito() // Fail - likely incognito
        );
      }
    }

    function reportIncognito() {
      console.warn('Private/Incognito browsing detected');
      
      fetch('/api/security/incognito-detected', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          detected: true,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent
        })
      }).catch(console.error);
      
      if (onIncognitoDetected) {
        onIncognitoDetected();
      }
    }

    // Browser fingerprinting for device tracking
    function generateFingerprint() {
      const components = [
        navigator.userAgent,
        navigator.language,
        screen.width + 'x' + screen.height,
        screen.colorDepth,
        new Date().getTimezoneOffset(),
        navigator.platform,
        navigator.cookieEnabled,
        typeof(Worker) !== 'undefined'
      ];

      // Canvas fingerprinting
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.textBaseline = 'top';
          ctx.font = '14px Arial';
          ctx.fillText('Security fingerprint test', 2, 2);
          components.push(canvas.toDataURL());
        }
      } catch (e) {
        // Canvas might be blocked
      }

      // WebGL fingerprinting
      try {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        if (gl) {
          const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
          if (debugInfo) {
            components.push(gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL));
            components.push(gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL));
          }
        }
      } catch (e) {
        // WebGL might be blocked
      }

      return btoa(components.join('|'));
    }

    // VPN/Proxy detection (basic client-side checks)
    function detectVPN() {
      // Check for common VPN browser extensions
      const vpnExtensions = [
        'chrome-extension://fgddmllnllkalaagkghckoinaemmogpe', // Hola VPN
        'chrome-extension://bihmplhobchoageeokmgbdihknkjbknd', // ExpressVPN
        'chrome-extension://ffrehjgmimdkgccbjmplmpkooelfifji'  // NordVPN
      ];

      vpnExtensions.forEach(ext => {
        const img = new Image();
        img.onload = () => {
          console.warn('VPN extension detected');
          if (onVPNDetected) onVPNDetected();
        };
        img.src = ext + '/icon.png';
      });

      // Check for unusual timezone/language combinations
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const language = navigator.language;
      
      // Basic heuristic - more sophisticated checks would use a service
      if (timezone && language) {
        const suspicious = (
          (timezone.includes('America') && !language.startsWith('en') && !language.startsWith('es')) ||
          (timezone.includes('Europe') && language.startsWith('zh')) ||
          (timezone.includes('Asia') && language.startsWith('es'))
        );
        
        if (suspicious) {
          console.warn('Suspicious timezone/language combination detected');
        }
      }
    }

    // Run security checks
    detectIncognito();
    detectVPN();
    
    // Register device fingerprint
    const fingerprint = generateFingerprint();
    fetch('/api/security/register-device', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fingerprint })
    }).catch(console.error);

  }, [onIncognitoDetected, onVPNDetected]);

  return null; // This component doesn't render anything
}