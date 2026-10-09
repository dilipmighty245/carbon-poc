package api

import (
	"crypto/hmac"
	"crypto/rand"
	"crypto/sha256"
	"crypto/subtle"
	"encoding/base64"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"os"
	"strings"
	"time"

	"saurient-platform/internal/nexus"
)

var (
	ErrInvalidToken = errors.New("invalid or expired token")
)

func getJWTSecret() []byte {
	secret := os.Getenv("JWT_SECRET")
	if secret == "" {
		secret = "saurient-nexus-platform-secret-key-2026-authz"
	}
	return []byte(secret)
}

// GenerateSalt generates 16 cryptographically random bytes encoded as hex.
func GenerateSalt() string {
	b := make([]byte, 16)
	_, _ = rand.Read(b)
	return hex.EncodeToString(b)
}

// HashPassword creates a salted SHA-256 hash.
func HashPassword(password, salt string) string {
	h := sha256.New()
	h.Write([]byte(salt + ":" + password))
	return hex.EncodeToString(h.Sum(nil))
}

// VerifyPassword performs a constant-time comparison of the password against the stored hash.
func VerifyPassword(password, salt, expectedHash string) bool {
	if expectedHash == "" {
		return false
	}
	computed := HashPassword(password, salt)
	return subtle.ConstantTimeCompare([]byte(computed), []byte(expectedHash)) == 1
}

// JWTClaims represents standard and custom JWT claims.
type JWTClaims struct {
	UserID    string `json:"sub"`
	Email     string `json:"email"`
	Role      string `json:"role"`
	TenantID  string `json:"tenant_id"`
	Name      string `json:"name"`
	IssuedAt  int64  `json:"iat"`
	ExpiresAt int64  `json:"exp"`
}

// GenerateToken creates a signed HS256 JWT string for an authenticated user.
func GenerateToken(user *nexus.OrganisationUserModel) (string, error) {
	if user == nil {
		return "", errors.New("user is nil")
	}

	header := map[string]string{
		"alg": "HS256",
		"typ": "JWT",
	}
	headerBytes, _ := json.Marshal(header)
	headerB64 := base64.RawURLEncoding.EncodeToString(headerBytes)

	now := time.Now().UTC()
	claims := JWTClaims{
		UserID:    user.ID,
		Email:     user.Email,
		Role:      user.Role,
		TenantID:  user.TenantID,
		Name:      user.Name,
		IssuedAt:  now.Unix(),
		ExpiresAt: now.Add(24 * time.Hour).Unix(),
	}
	claimsBytes, err := json.Marshal(claims)
	if err != nil {
		return "", fmt.Errorf("failed to marshal claims: %w", err)
	}
	claimsB64 := base64.RawURLEncoding.EncodeToString(claimsBytes)

	signingInput := headerB64 + "." + claimsB64
	mac := hmac.New(sha256.New, getJWTSecret())
	mac.Write([]byte(signingInput))
	sigB64 := base64.RawURLEncoding.EncodeToString(mac.Sum(nil))

	return signingInput + "." + sigB64, nil
}

// ValidateToken verifies the signature and expiration of an HS256 JWT string.
func ValidateToken(tokenStr string) (*JWTClaims, error) {
	parts := strings.Split(tokenStr, ".")
	if len(parts) != 3 {
		return nil, ErrInvalidToken
	}

	signingInput := parts[0] + "." + parts[1]
	mac := hmac.New(sha256.New, getJWTSecret())
	mac.Write([]byte(signingInput))
	expectedSig := mac.Sum(nil)

	sigBytes, err := base64.RawURLEncoding.DecodeString(parts[2])
	if err != nil || subtle.ConstantTimeCompare(sigBytes, expectedSig) != 1 {
		return nil, ErrInvalidToken
	}

	claimsBytes, err := base64.RawURLEncoding.DecodeString(parts[1])
	if err != nil {
		return nil, ErrInvalidToken
	}

	var claims JWTClaims
	if err := json.Unmarshal(claimsBytes, &claims); err != nil {
		return nil, ErrInvalidToken
	}

	if claims.ExpiresAt < time.Now().UTC().Unix() {
		return nil, errors.New("token expired")
	}

	return &claims, nil
}
