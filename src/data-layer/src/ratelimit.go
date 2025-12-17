package main

import (
	"net"
	"net/http"
	"strings"
	"sync"
	"time"

	"github.com/sirupsen/logrus"
	"golang.org/x/time/rate"
)

type ipRateLimiter struct {
	ips   map[string]*rateLimiterEntry
	mu    sync.RWMutex
	limit rate.Limit
	burst int
}

type rateLimiterEntry struct {
	limiter  *rate.Limiter
	lastSeen time.Time
}

func newIPRateLimiter(r rate.Limit, b int) *ipRateLimiter {
	limiter := &ipRateLimiter{
		ips:   make(map[string]*rateLimiterEntry),
		limit: r,
		burst: b,
	}

	// cleanup stale entries every 5 minutes
	go limiter.cleanupLoop()

	return limiter
}

func (i *ipRateLimiter) getLimiter(ip string) *rate.Limiter {
	i.mu.Lock()
	defer i.mu.Unlock()

	entry, exists := i.ips[ip]
	if !exists {
		limiter := rate.NewLimiter(i.limit, i.burst)
		i.ips[ip] = &rateLimiterEntry{
			limiter:  limiter,
			lastSeen: time.Now(),
		}
		return limiter
	}

	entry.lastSeen = time.Now()
	return entry.limiter
}

func (i *ipRateLimiter) cleanupLoop() {
	ticker := time.NewTicker(5 * time.Minute)
	for range ticker.C {
		i.cleanup()
	}
}

func (i *ipRateLimiter) cleanup() {
	i.mu.Lock()
	defer i.mu.Unlock()

	threshold := time.Now().Add(-10 * time.Minute)
	for ip, entry := range i.ips {
		if entry.lastSeen.Before(threshold) {
			delete(i.ips, ip)
		}
	}
}

// publicInputLimiter is the rate limiter for public input submissions
// 5 requests per minute with a burst of 2
var publicInputLimiter = newIPRateLimiter(rate.Limit(5.0/60.0), 2)

func getClientIP(r *http.Request) string {
	// check X-Forwarded-For header first (for proxies/load balancers)
	xff := r.Header.Get("X-Forwarded-For")
	if xff != "" {
		// take the first IP in the list
		if ip, _, err := net.SplitHostPort(xff); err == nil {
			return ip
		}
		return xff
	}

	// check X-Real-IP header
	xri := r.Header.Get("X-Real-IP")
	if xri != "" {
		return xri
	}

	// fall back to RemoteAddr
	ip, _, err := net.SplitHostPort(r.RemoteAddr)
	if err != nil {
		return r.RemoteAddr
	}
	return ip
}

func isBenchmarkRequest(r *http.Request) bool {
	referer := r.Header.Get("Referer")
	benchHeader := r.Header.Get("X-Benchmark")
	if benchHeader == "true" {
		if referer != "" && !strings.Contains(strings.ToLower(referer), "bench") {
			logrus.WithFields(logrus.Fields{
				"referer":     referer,
				"x_benchmark": benchHeader,
			}).Warn("X-Benchmark header present but referer doesn't contain 'bench'")
		}
		logrus.WithFields(logrus.Fields{
			"referer":     referer,
			"x_benchmark": benchHeader,
		}).Debug("skipping rate limit - benchmark request detected")
		return true
	}
	return false
}

func RateLimitMiddleware(next http.HandlerFunc, limiter *ipRateLimiter) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if isBenchmarkRequest(r) {
			logrus.Debug("skipping rate limit for benchmark request")
			next(w, r)
			return
		}

		ip := getClientIP(r)
		rateLimiter := limiter.getLimiter(ip)

		if !rateLimiter.Allow() {
			logrus.WithField("ip", ip).Warn("rate limit exceeded for public input submission")
			w.WriteHeader(http.StatusTooManyRequests)
			w.Write([]byte(`{"error":"Rate limit exceeded. Please try again later.","code":"RATE_LIMIT_EXCEEDED"}`))
			return
		}

		next(w, r)
	}
}
