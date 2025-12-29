-- Sliding Window Log Algorithm
-- KEYS[1]: The rate limiter key (e.g., "limiter:user:123")
-- ARGV[1]: Window size in milliseconds
-- ARGV[2]: Max requests allowed in the window
-- ARGV[3]: Current timestamp in milliseconds

local key = KEYS[1]
local window = tonumber(ARGV[1])
local limit = tonumber(ARGV[2])
local now = tonumber(ARGV[3])
local clearBefore = now - window

redis.call('ZREMRANGEBYSCORE', key, 0, clearBefore)

local count = redis.call('ZCARD', key)

if count < limit then
    redis.call('ZADD', key, now, now)
    redis.call('PEXPIRE', key, window)
    return {1, limit - (count + 1)}
else
    return {0, 0}
end
