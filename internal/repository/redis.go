package repository

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/redis/go-redis/v9"
)

type RedisRepository struct {
	client *redis.Client
}

func NewRedisRepository(client *redis.Client) *RedisRepository {
	return &RedisRepository{client: client}
}

// CachePassport stores passport data in Redis under the given cacheKey.
// Callers must supply a key in the form "tenant_id:passport_id" to enforce
// tenant isolation and prevent cross-tenant data leaks.
func (r *RedisRepository) CachePassport(ctx context.Context, cacheKey string, data interface{}, ttl time.Duration) error {
	payload, err := json.Marshal(data)
	if err != nil {
		return fmt.Errorf("failed to marshal passport payload for redis: %w", err)
	}

	err = r.client.Set(ctx, cacheKey, payload, ttl).Err()
	if err != nil {
		return fmt.Errorf("failed to set passport key in redis: %w", err)
	}
	return nil
}

// GetPassport retrieves passport data from Redis by the given cacheKey.
// Callers must supply a key in the form "tenant_id:passport_id" to enforce
// tenant isolation and prevent cross-tenant data leaks.
func (r *RedisRepository) GetPassport(ctx context.Context, cacheKey string) ([]byte, error) {
	val, err := r.client.Get(ctx, cacheKey).Bytes()
	if err != nil {
		return nil, fmt.Errorf("failed to retrieve passport key from redis: %w", err)
	}
	return val, nil
}

// DeletePassport removes passport data from Redis by the given cacheKey.
func (r *RedisRepository) DeletePassport(ctx context.Context, cacheKey string) error {
	err := r.client.Del(ctx, cacheKey).Err()
	if err != nil {
		return fmt.Errorf("failed to delete passport key from redis: %w", err)
	}
	return nil
}
