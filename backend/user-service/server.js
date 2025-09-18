import http from "http";
import index from "./index.js";
import "dotenv/config";
import { connectToDB } from "./model/user-repository.js";
import { redisService } from "./services/redis-service.js";

const port = process.env.PORT || 3001;

const server = http.createServer(index);

// Initialize database and Redis connections
Promise.all([connectToDB(), redisService.connect()])
  .then(() => {
    console.log("MongoDB Connected!");
    console.log("Redis Service initialized!");

    server.listen(port);
    console.log("User service server listening on http://localhost:" + port);
  })
  .catch(err => {
    console.error("Failed to connect to services");
    console.error(err);

    // Start server anyway for graceful degradation
    server.listen(port);
    console.log(
      "User service server listening on http://localhost:" +
        port +
        " (Redis may not be available)"
    );
  });
