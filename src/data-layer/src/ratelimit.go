package main

import (
	"fmt"
	"net"
	"net/http"
	"sync"
	"time"

	"github.com/google/uuid"
	"github.com/sirupsen/logrus"
	"golang.org/x/time/rate"
)

type rateLimiterEntry struct {
	limiter  *rate.Limiter
	lastSeen time.Time
}

type keyedRateLimiter struct {
	keys  map[string]*rateLimiterEntry
	mu    sync.RWMutex
	limit rate.Limit
	burst int
}

func newKeyedRateLimiter(r rate.Limit, b int) *keyedRateLimiter {
	limiter := &keyedRateLimiter{
		keys:  make(map[string]*rateLimiterEntry),
		limit: r,
		burst: b,
	}

	go limiter.cleanupLoop()

	return limiter
}

func (k *keyedRateLimiter) getLimiter(key string) *rate.Limiter {
	k.mu.Lock()
	defer k.mu.Unlock()

	entry, exists := k.keys[key]
	if !exists {
		limiter := rate.NewLimiter(k.limit, k.burst)
		k.keys[key] = &rateLimiterEntry{
			limiter:  limiter,
			lastSeen: time.Now(),
		}
		return limiter
	}

	entry.lastSeen = time.Now()
	return entry.limiter
}

func (k *keyedRateLimiter) cleanupLoop() {
	ticker := time.NewTicker(5 * time.Minute)
	for range ticker.C {
		k.cleanup()
	}
}

func (k *keyedRateLimiter) cleanup() {
	k.mu.Lock()
	defer k.mu.Unlock()

	threshold := time.Now().Add(-10 * time.Minute)
	for key, entry := range k.keys {
		if entry.lastSeen.Before(threshold) {
			delete(k.keys, key)
		}
	}
}

type ipRateLimiter struct {
	*keyedRateLimiter
}

func newIPRateLimiter(r rate.Limit, b int) *ipRateLimiter {
	return &ipRateLimiter{keyedRateLimiter: newKeyedRateLimiter(r, b)}
}

func (i *ipRateLimiter) getLimiter(ip string) *rate.Limiter {
	return i.keyedRateLimiter.getLimiter("ip:" + ip)
}

// publicInputLimiter: unauthenticated demo runs on the landing page
var publicInputLimiter = newIPRateLimiter(rate.Limit(5.0/60.0), 2)

// benchInputLimiter: unauthenticated bench route (same cost as public runs)
var benchInputLimiter = newIPRateLimiter(rate.Limit(5.0/60.0), 2)

// authEndpointLimiter: login/register brute-force protection
var authEndpointLimiter = newIPRateLimiter(rate.Limit(10.0/60.0), 5)

// authenticatedInputLimiter: per-user custom input runs
var authenticatedInputLimiter = newKeyedRateLimiter(rate.Limit(30.0/60.0), 10)

// submissionLimiter: per-user graded submissions
var submissionLimiter = newKeyedRateLimiter(rate.Limit(20.0/60.0), 5)

func getClientIP(r *http.Request) string {
	xff := r.Header.Get("X-Forwarded-For")
	if xff != "" {
		if ip, _, err := net.SplitHostPort(xff); err == nil {
			return ip
		}
		return xff
	}

	xri := r.Header.Get("X-Real-IP")
	if xri != "" {
		return xri
	}

	ip, _, err := net.SplitHostPort(r.RemoteAddr)
	if err != nil {
		return r.RemoteAddr
	}
	return ip
}

func rateLimitKeyFromRequest(r *http.Request) string {
	if claims, ok := claimsFromContext(r); ok && claims.Id != uuid.Nil {
		return "user:" + claims.Id.String()
	}

	return "ip:" + getClientIP(r)
}

func writeRateLimitResponse(w http.ResponseWriter, logMessage string, fields logrus.Fields) {
	logrus.WithFields(fields).Warn(logMessage)
	w.Header().Set("Retry-After", "60")
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusTooManyRequests)
	fmt.Fprint(w, `{"error":"Rate limit exceeded. Please try again later.","code":"RATE_LIMIT_EXCEEDED"}`)
}

func RateLimitMiddleware(next http.HandlerFunc, limiter *ipRateLimiter) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		ip := getClientIP(r)
		rateLimiter := limiter.getLimiter(ip)

		if !rateLimiter.Allow() {
			writeRateLimitResponse(w, "rate limit exceeded", logrus.Fields{"ip": ip})
			return
		}

		next(w, r)
	}
}

func AuthenticatedRateLimitMiddleware(limiter *keyedRateLimiter, next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		key := rateLimitKeyFromRequest(r)
		rateLimiter := limiter.getLimiter(key)

		if !rateLimiter.Allow() {
			writeRateLimitResponse(w, "authenticated rate limit exceeded", logrus.Fields{"key": key})
			return
		}

		next(w, r)
	}
}
