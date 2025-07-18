import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

// Security configuration
const SECURITY_CONFIG = {
  maxRequestsPerHour: 100,
  maxRequestsPerDay: 1000,
  blockedCountries: ['CN', 'RU', 'KP'], // Add countries to block
  suspiciousUserAgents: [
    'bot', 'crawler', 'spider', 'scraper', 'headless', 'phantom', 'selenium',
    'curl', 'wget', 'postman', 'insomnia', 'python-requests', 'java', 'go-http'
  ],
  trustedProxies: ['cloudflare', 'akamai'], // Known CDN/proxy services
  maxDevicesPerUser: 5,
  adminEmails: ['ottmar.francisca1969@gmail.com'], // Admin emails bypass security
  whitelistedIPs: ['112.198.166.106', '127.0.0.1', 'localhost'], // Admin IPs that bypass security
  sessionTimeout: 24 * 60 * 60 * 1000, // 24 hours
};

// Rate limiting storage (in production, use Redis)
const rateLimitStore = new Map<string, { count: number; resetTime: number; requests: number[] }>();
const ipBlacklist = new Set<string>();
const suspiciousIPs = new Map<string, { score: number; lastSeen: number; violations: string[] }>();

// Device fingerprinting storage
const deviceFingerprints = new Map<string, { 
  userId?: string; 
  firstSeen: number; 
  lastSeen: number; 
  suspicious: boolean;
  metadata: any;
}>();

// VPN/Proxy detection ranges (basic implementation)
const KNOWN_VPN_RANGES = [
  '103.216.220.0/24', '185.220.100.0/24', '185.220.101.0/24',
  '199.87.154.0/24', '162.247.72.0/24', '185.65.134.0/24'
];

// Browser fingerprinting utilities
export function generateFingerprint(req: Request): string {
  const components = [
    req.headers['user-agent'] || '',
    req.headers['accept-language'] || '',
    req.headers['accept-encoding'] || '',
    req.headers['accept'] || '',
    req.connection.remoteAddress || '',
    req.headers['x-forwarded-for'] || '',
  ];
  
  return crypto.createHash('sha256').update(components.join('|')).digest('hex');
}

// IP geolocation and intelligence (mock implementation - integrate with real service)
export async function getIPIntelligence(ip: string): Promise<{
  country: string;
  isVPN: boolean;
  isProxy: boolean;
  isHosting: boolean;
  isTor: boolean;
  riskScore: number;
  organization?: string;
}> {
  // Mock implementation - integrate with IPQualityScore, MaxMind, or similar
  const isPrivateIP = /^(10\.|172\.(1[6-9]|2[0-9]|3[0-1])\.|192\.168\.|127\.)/.test(ip);
  
  if (isPrivateIP) {
    return {
      country: 'US',
      isVPN: false,
      isProxy: false,
      isHosting: false,
      isTor: false,
      riskScore: 0
    };
  }

  // Basic VPN detection
  const isVPN = KNOWN_VPN_RANGES.some(range => isIPInRange(ip, range));
  
  return {
    country: 'US', // Would come from real service
    isVPN,
    isProxy: isVPN,
    isHosting: false,
    isTor: false,
    riskScore: isVPN ? 80 : 20,
    organization: isVPN ? 'VPN Provider' : 'ISP'
  };
}

function isIPInRange(ip: string, range: string): boolean {
  // Simplified CIDR check - use proper library in production
  const [rangeIP, bits] = range.split('/');
  const mask = ~(2 ** (32 - parseInt(bits)) - 1);
  
  const ipInt = ipToInt(ip);
  const rangeInt = ipToInt(rangeIP);
  
  return (ipInt & mask) === (rangeInt & mask);
}

function ipToInt(ip: string): number {
  return ip.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet), 0) >>> 0;
}

// Rate limiting middleware
export function rateLimitMiddleware(req: Request, res: Response, next: NextFunction) {
  const clientIP = getClientIP(req);
  
  // Check if IP is whitelisted (admin bypass)
  if (SECURITY_CONFIG.whitelistedIPs.includes(clientIP)) {
    return next();
  }
  
  const now = Date.now();
  const hourlyKey = `${clientIP}:${Math.floor(now / (60 * 60 * 1000))}`;
  const dailyKey = `${clientIP}:${Math.floor(now / (24 * 60 * 60 * 1000))}`;

  // Check if IP is blacklisted
  if (ipBlacklist.has(clientIP)) {
    return res.status(403).json({ 
      error: 'Access denied',
      message: 'Your IP address has been blocked due to suspicious activity'
    });
  }

  // Hourly rate limit
  const hourlyLimit = rateLimitStore.get(hourlyKey) || { count: 0, resetTime: now + 60 * 60 * 1000, requests: [] };
  if (hourlyLimit.count >= SECURITY_CONFIG.maxRequestsPerHour) {
    addSuspiciousActivity(clientIP, 'rate_limit_exceeded');
    return res.status(429).json({ 
      error: 'Rate limit exceeded',
      message: 'Too many requests. Please try again later.',
      resetTime: hourlyLimit.resetTime
    });
  }

  // Update counters
  hourlyLimit.count++;
  hourlyLimit.requests.push(now);
  rateLimitStore.set(hourlyKey, hourlyLimit);

  next();
}

// Security analysis middleware
export async function securityAnalysisMiddleware(req: Request, res: Response, next: NextFunction) {
  const clientIP = getClientIP(req);
  
  // Check if IP is whitelisted (admin bypass)
  if (SECURITY_CONFIG.whitelistedIPs.includes(clientIP)) {
    return next();
  }
  
  const userAgent = req.headers['user-agent'] || '';
  const fingerprint = generateFingerprint(req);

  try {
    // IP intelligence check
    const ipIntel = await getIPIntelligence(clientIP);
    
    // Block high-risk countries
    if (SECURITY_CONFIG.blockedCountries.includes(ipIntel.country)) {
      addSuspiciousActivity(clientIP, 'blocked_country');
      return res.status(403).json({ 
        error: 'Access denied',
        message: 'Access from your location is restricted'
      });
    }

    // VPN/Proxy detection
    if (ipIntel.isVPN || ipIntel.isProxy) {
      addSuspiciousActivity(clientIP, 'vpn_proxy_detected');
      return res.status(403).json({ 
        error: 'VPN/Proxy detected',
        message: 'Please disable VPN/Proxy and try again'
      });
    }

    // Hosting provider detection
    if (ipIntel.isHosting) {
      addSuspiciousActivity(clientIP, 'hosting_provider');
      return res.status(403).json({ 
        error: 'Hosting provider detected',
        message: 'Access from hosting providers is not allowed'
      });
    }

    // Tor detection
    if (ipIntel.isTor) {
      addSuspiciousActivity(clientIP, 'tor_detected');
      return res.status(403).json({ 
        error: 'Tor detected',
        message: 'Access via Tor network is not permitted'
      });
    }

    // Suspicious user agent detection - only block obvious automation tools
    const isSuspiciousUA = SECURITY_CONFIG.suspiciousUserAgents.some(pattern => 
      userAgent.toLowerCase().includes(pattern)
    );
    
    // Only block if it's clearly a bot AND has minimal user agent string
    if (isSuspiciousUA && userAgent.length < 30) {
      addSuspiciousActivity(clientIP, 'suspicious_user_agent');
      return res.status(403).json({ 
        error: 'Suspicious user agent',
        message: 'Automated requests are not allowed'
      });
    }

    // Device fingerprint analysis
    const deviceInfo = deviceFingerprints.get(fingerprint);
    if (deviceInfo?.suspicious) {
      return res.status(403).json({ 
        error: 'Device flagged',
        message: 'This device has been flagged for suspicious activity'
      });
    }

    // Store security metadata in request
    (req as any).security = {
      clientIP,
      fingerprint,
      ipIntel,
      userAgent,
      riskScore: calculateRiskScore(req, ipIntel)
    };

    next();
  } catch (error) {
    console.error('Security analysis error:', error);
    next(); // Continue on error, but log it
  }
}

// Device registration and tracking
export function trackDevice(req: Request, userId?: string) {
  const fingerprint = generateFingerprint(req);
  const now = Date.now();
  
  const existing = deviceFingerprints.get(fingerprint);
  if (existing) {
    existing.lastSeen = now;
    if (userId) existing.userId = userId;
  } else {
    deviceFingerprints.set(fingerprint, {
      userId,
      firstSeen: now,
      lastSeen: now,
      suspicious: false,
      metadata: {
        userAgent: req.headers['user-agent'],
        ip: getClientIP(req),
        firstIP: getClientIP(req)
      }
    });
  }
}

// Incognito/Private browsing detection (client-side helper)
export function getIncognitoDetectionScript(): string {
  return `
    <script>
    (function detectIncognito() {
      function isIncognito(callback) {
        var fs = window.RequestFileSystem || window.webkitRequestFileSystem;
        if (!fs) {
          callback('unknown');
          return;
        }
        
        fs(window.TEMPORARY, 100, function(fs) {
          callback(false); // Not incognito
        }, function() {
          callback(true); // Likely incognito
        });
      }
      
      function detectPrivateBrowsing() {
        // Multiple detection methods
        var tests = [];
        
        // Test 1: Storage quota
        if ('storage' in navigator && 'estimate' in navigator.storage) {
          navigator.storage.estimate().then(function(estimate) {
            tests.push(estimate.quota < 120000000); // Less than ~120MB suggests incognito
          });
        }
        
        // Test 2: IndexedDB behavior
        try {
          var idbResult = !!window.indexedDB;
          if (idbResult) {
            var db = indexedDB.open('test');
            db.onerror = function() { tests.push(true); };
            db.onsuccess = function() { tests.push(false); };
          }
        } catch(e) {
          tests.push(true);
        }
        
        // Test 3: WebRTC
        if ('RTCPeerConnection' in window) {
          var rtc = new RTCPeerConnection();
          try {
            rtc.createDataChannel('test');
            tests.push(false);
          } catch(e) {
            tests.push(true);
          }
        }
        
        return tests.some(Boolean);
      }
      
      var isPrivate = detectPrivateBrowsing();
      
      if (isPrivate) {
        fetch('/api/security/incognito-detected', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ detected: true })
        });
      }
    })();
    </script>
  `;
}

// Utility functions
function getClientIP(req: Request): string {
  return (req.headers['x-forwarded-for'] as string)?.split(',')[0] ||
         req.headers['x-real-ip'] as string ||
         req.connection.remoteAddress ||
         '127.0.0.1';
}

function addSuspiciousActivity(ip: string, violation: string) {
  const existing = suspiciousIPs.get(ip) || { score: 0, lastSeen: 0, violations: [] };
  existing.score += 10;
  existing.lastSeen = Date.now();
  existing.violations.push(violation);
  
  suspiciousIPs.set(ip, existing);
  
  // Auto-blacklist high-risk IPs
  if (existing.score >= 50) {
    ipBlacklist.add(ip);
    console.log(`IP ${ip} blacklisted for suspicious activity:`, existing.violations);
  }
}

function calculateRiskScore(req: Request, ipIntel: any): number {
  let score = ipIntel.riskScore || 0;
  
  // Add risk factors
  if (ipIntel.isVPN) score += 30;
  if (ipIntel.isProxy) score += 25;
  if (ipIntel.isHosting) score += 40;
  if (ipIntel.isTor) score += 50;
  
  // User agent analysis
  const ua = req.headers['user-agent'] || '';
  if (!ua) score += 20;
  if (ua.length < 50) score += 15;
  
  return Math.min(score, 100);
}

// Admin functions for IP management
export function addToWhitelist(ip: string) {
  if (!SECURITY_CONFIG.whitelistedIPs.includes(ip)) {
    SECURITY_CONFIG.whitelistedIPs.push(ip);
    // Remove from blacklist if it was there
    ipBlacklist.delete(ip);
    suspiciousIPs.delete(ip);
    console.log(`IP ${ip} added to whitelist`);
  }
}

export function removeFromWhitelist(ip: string) {
  const index = SECURITY_CONFIG.whitelistedIPs.indexOf(ip);
  if (index > -1) {
    SECURITY_CONFIG.whitelistedIPs.splice(index, 1);
    console.log(`IP ${ip} removed from whitelist`);
  }
}

export function addToBlacklist(ip: string) {
  ipBlacklist.add(ip);
  // Remove from whitelist if it was there
  removeFromWhitelist(ip);
  console.log(`IP ${ip} added to blacklist`);
}

export function removeFromBlacklist(ip: string) {
  ipBlacklist.delete(ip);
  suspiciousIPs.delete(ip);
  console.log(`IP ${ip} removed from blacklist`);
}

export function clearAllBlacklist() {
  const count = ipBlacklist.size;
  ipBlacklist.clear();
  suspiciousIPs.clear();
  console.log(`Cleared ${count} IPs from blacklist`);
}

// Auto-whitelist admin IP on startup
if (SECURITY_CONFIG.whitelistedIPs.includes('112.198.166.106')) {
  ipBlacklist.delete('112.198.166.106');
  suspiciousIPs.delete('112.198.166.106');
  console.log('Admin IP 112.198.166.106 auto-whitelisted on startup');
}

// Admin functions for monitoring
export function getSecurityStats() {
  return {
    blacklistedIPs: Array.from(ipBlacklist),
    whitelistedIPs: SECURITY_CONFIG.whitelistedIPs,
    suspiciousIPs: Array.from(suspiciousIPs.entries()),
    deviceCount: deviceFingerprints.size,
    rateLimitedRequests: rateLimitStore.size
  };
}

export function unblockIP(ip: string) {
  ipBlacklist.delete(ip);
  suspiciousIPs.delete(ip);
  // Clear rate limit entries for this IP
  for (const [key] of rateLimitStore) {
    if (key.startsWith(ip)) {
      rateLimitStore.delete(key);
    }
  }
}