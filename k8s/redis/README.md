# Redis Configuration

This directory contains separate Redis instances for each microservice, configured for scalability and isolation.

## Architecture

Each service now has its own dedicated Redis instance running on different ports:

- **user-service**: Port 6379 (default Redis port)
- **question-service**: Port 6380
- **matching-service**: Port 6381
- **collaboration-service**: Port 6382

## Deployment

To deploy all Redis instances in Kubernetes:

```bash
# Deploy all Redis instances
kubectl apply -f k8s/redis/user-service-redis.yaml
kubectl apply -f k8s/redis/question-service-redis.yaml
kubectl apply -f k8s/redis/matching-service-redis.yaml
kubectl apply -f k8s/redis/collaboration-service-redis.yaml
```

## Benefits

1. **Isolation**: Each service's data is completely isolated from others
2. **Scalability**: Can scale each Redis instance independently based on service load
3. **Performance**: Reduces contention and improves performance by eliminating shared resource bottlenecks
4. **Reliability**: Failure in one Redis instance doesn't affect other services
5. **Resource Management**: Can allocate different resource limits per service needs

## Local Development

For local development using Docker Compose, separate Redis instances are configured in `docker-compose.yml`:

- Each Redis instance uses a separate volume for data persistence
- Ports are mapped to avoid conflicts
- Each service connects to its dedicated Redis instance via environment variables

## Configuration

Each service connects to its Redis instance via the `REDIS_URL` environment variable defined in their respective ConfigMaps:

- `user-service`: `redis://user-service-redis-service:6379`
- `question-service`: `redis://question-service-redis-service:6380`
- `matching-service`: `redis://matching-service-redis-service:6381`
- `collaboration-service`: `redis://collaboration-service-redis-service:6382`

## Monitoring

To check the status of Redis instances:

```bash
# Check Redis pods
kubectl get pods -n peerprep | grep redis

# Check Redis services
kubectl get svc -n peerprep | grep redis

# Check logs for a specific Redis instance
kubectl logs -n peerprep <redis-pod-name>
```

## Scaling

Each Redis StatefulSet can be scaled independently:

```bash
# Scale user-service Redis to 3 replicas
kubectl scale statefulset user-service-redis -n peerprep --replicas=3

# Scale collaboration-service Redis to 2 replicas
kubectl scale statefulset collaboration-service-redis -n peerprep --replicas=2
```

## Note

Redis supports custom ports through the `--port` flag, which allows us to run multiple Redis instances on the same cluster without conflicts. Each service connects to its dedicated Redis instance using the appropriate port.

