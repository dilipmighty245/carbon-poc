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

func (r *RedisRepository) CachePassport(ctx context.Context, passportID string, data interface{}, ttl time.Duration) error {
	payload, err := json.Marshal(data)
	if err != nil {
		return fmt.Errorf("failed to marshal passport payload for redis: %w", err)
	}

	key := fmt.Sprintf("passport:%s", passportID)
	err = r.client.Set(ctx, key, payload, ttl).Err()
	if err != nil {
		return fmt.Errorf("failed to set passport key in redis: %w", err)
	}
	return nil
}

func (r *RedisRepository) GetPassport(ctx context.Context, passportID string) ([]byte, error) {
	key := fmt.Sprintf("passport:%s", passportID)
	val, err := r.client.Get(ctx, key).Bytes()
	if err != nil {
		return nil, fmt.Errorf("failed to retrieve passport key from redis: %w", err)
	}
	return val, nil
}
