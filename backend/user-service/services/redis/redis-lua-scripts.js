export const TOKEN_CHECK_AND_REUSE_SCRIPT = `
  local key = KEYS[1]
  local newValue = ARGV[1]
  local expiryInSeconds = tonumber(ARGV[2])
  local minRemainingTime = tonumber(ARGV[3])
  
  local existingValue = redis.call('GET', key)
  local ttl = redis.call('TTL', key)
  
  -- If no value exists or TTL is low, store new value
  if not existingValue or ttl < minRemainingTime then
    redis.call('SETEX', key, expiryInSeconds, newValue)
    return {newValue, 'stored', ttl}
  end
  
  -- Return existing value if it has enough time left
  return {existingValue, 'reused', ttl}
`;

