# Question Service

A RESTful microservice for managing coding interview questions with support for difficulty levels, topics, test cases, and constraints. Built with Node.js, Express, and MongoDB.

---

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
- [API Documentation](#api-documentation)
- [Testing](#testing)
- [Error Handling](#error-handling)
- [Environment Variables](#environment-variables)
- [Project Structure](#project-structure)

---

## 🎯 Overview

The Question Service is a microservice designed to store and manage a repository of coding interview questions. It supports retrieving questions by difficulty, topic, and provides functionality for random question selection - perfect for matching users in coding interview practice sessions.

### Key Capabilities

- Store coding questions with rich metadata (title, description, difficulty, topics, tags)
- Include test cases and constraints for each question
- Retrieve questions filtered by difficulty level (Easy, Medium, Hard)
- Retrieve questions filtered by topic (Arrays, Strings, Graphs, etc.)
- Get random questions based on difficulty and topic combinations
- Full CRUD operations with validation and error handling

---

## ✨ Features

### Core Features

- ✅ **Question Management**: Create, read, update, and delete coding questions
- ✅ **Rich Metadata**: Store title, description, difficulty, topics, tags, test cases, and constraints
- ✅ **Advanced Filtering**: Filter questions by difficulty level and topics
- ✅ **Random Selection**: Get random questions based on criteria (for matching sessions)
- ✅ **Test Cases**: Each question includes input/output test cases with explanations
- ✅ **Constraints**: Define problem constraints for each question
- ✅ **Validation**: Schema-level validation using Mongoose
- ✅ **Error Handling**: Structured error responses with custom error classes
- ✅ **Testing**: Comprehensive test suite with 47+ tests (71.5% coverage)

### Functional Requirements

1. **Store Question Repository**: Maintain a collection of coding questions with metadata
2. **Retrieve by Difficulty**: Get all questions or random question by difficulty level
3. **Retrieve by Topic**: Get all questions or random question by topic
4. **Session Support**: Provide random questions for matching sessions without duplicates
5. **Validation**: Ensure data integrity with schema validation
6. **Scalability**: Indexed queries for efficient retrieval

---

## 🛠 Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB
- **ODM**: Mongoose
- **Testing**: Jest + Supertest
- **Validation**: Mongoose Schema Validation
- **Security**: Helmet, CORS
- **Logging**: Morgan

---

## 🏗 Architecture

The service follows the **MVC (Model-View-Controller)** architecture pattern:

```
┌─────────────┐
│   Client    │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────┐
│         Express Routes              │
│  (question-routes.js)               │
└──────────┬──────────────────────────┘
           │
           ▼
┌─────────────────────────────────────┐
│       Controllers                   │
│  (question-controller.js)           │
│  - Request validation               │
│  - Business logic                   │
│  - Response formatting              │
└──────────┬──────────────────────────┘
           │
           ▼
┌─────────────────────────────────────┐
│         Models                      │
│  (question-model.js)                │
│  - Mongoose schema                  │
│  - Static methods for DB operations │
│  - Validation rules                 │
└──────────┬──────────────────────────┘
           │
           ▼
┌─────────────────────────────────────┐
│       MongoDB Database              │
└─────────────────────────────────────┘
```

### Error Handling Flow

```
Controller → Error → errorHandler Middleware → JSON Response
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or cloud instance)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   cd backend/question-service
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**

   Create a `.env` file in the root of `question-service`:
   ```env
   PORT=8000
   MONGODB_URI=mongodb://localhost:27017/questiondb
   NODE_ENV=development
   ```

   Or for MongoDB Atlas:
   ```env
   PORT=8000
   MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/questiondb?retryWrites=true&w=majority
   NODE_ENV=development
   ```

4. **Start the server**
   ```bash
   # Development mode (with auto-reload)
   npm run dev

   # Production mode
   npm start
   ```

5. **Seed the database** (optional)
   ```bash
   npm run seed
   ```

The service will be running at `http://localhost:8000`

---

## 📚 API Documentation

### Base URL
```
http://localhost:8000/api/questions
```

### Postman Collection

For easy API testing, you can import the Postman collection and environment files:

1. **Collection File**: `Question-Service-API.postman_collection.json`
2. **Environment File**: `Question-Service.postman_environment.json`

**How to Import:**
1. Open Postman
2. Click "Import" button (top left)
3. Drag and drop both JSON files or click "Upload Files"
4. Select "Question Service - Local" environment from the dropdown (top right)
5. You're ready to test all endpoints!

The collection includes:
- ✅ All 11 API endpoints organized in folders
- ✅ Pre-configured request bodies with examples
- ✅ Environment variables for easy configuration
- ✅ Descriptions for each endpoint

### Endpoints

#### 1. Create a Question
```http
POST /api/questions
```

**Request Body:**
```json
{
  "title": "Two Sum",
  "description": "Given an array of integers nums and an integer target, return indices of the two numbers that add up to target.",
  "difficulty": "Easy",
  "topics": ["Arrays", "Hash Table"],
  "tags": ["leetcode", "interview"],
  "testCases": [
    {
      "input": "nums = [2,7,11,15], target = 9",
      "expectedOutput": "[0,1]",
      "explanation": "Because nums[0] + nums[1] == 9, we return [0, 1].",
      "type": "Sample"
    },
    {
      "input": "nums = [3,2,4], target = 6",
      "expectedOutput": "[1,2]",
      "explanation": "",
      "type": "Hidden"
    }
  ],
  "constraints": [
    "2 <= nums.length <= 10^4",
    "-10^9 <= nums[i] <= 10^9",
    "Only one valid answer exists"
  ]
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Question created successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "title": "Two Sum",
    "difficulty": "Easy",
    "topics": ["Arrays", "Hash Table"],
    "tags": ["leetcode", "interview"],
    "testCases": [...],
    "constraints": [...],
    "createdAt": "2025-10-12T14:30:00.000Z",
    "updatedAt": "2025-10-12T14:30:00.000Z"
  }
}
```

---

#### 2. Get All Questions
```http
GET /api/questions
```

**Response (200 OK):**
```json
{
  "success": true,
  "count": 20,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "title": "Two Sum",
      "difficulty": "Easy",
      ...
    },
    ...
  ]
}
```

---

#### 3. Get Question by ID
```http
GET /api/questions/:id
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "title": "Two Sum",
    "description": "...",
    "difficulty": "Easy",
    "topics": ["Arrays", "Hash Table"],
    "testCases": [...],
    "constraints": [...]
  }
}
```

**Response (404 Not Found):**
```json
{
  "success": false,
  "error": "Question with id 507f1f77bcf86cd799439011 not found"
}
```

---

#### 4. Update Question
```http
PUT /api/questions/:id
```

**Request Body:** (partial update supported)
```json
{
  "difficulty": "Medium",
  "topics": ["Arrays", "Hash Table", "Dynamic Programming"]
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Question updated successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "title": "Two Sum",
    "difficulty": "Medium",
    ...
  }
}
```

---

#### 5. Delete Question
```http
DELETE /api/questions/:id
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Question deleted successfully"
}
```

---

#### 6. Get Questions by Difficulty
```http
GET /api/questions/difficulty/:difficulty
```

**Parameters:**
- `difficulty`: `Easy` | `Medium` | `Hard`

**Example:**
```http
GET /api/questions/difficulty/Easy
```

**Response (200 OK):**
```json
{
  "success": true,
  "difficulty": "Easy",
  "count": 7,
  "data": [...]
}
```

---

#### 7. Get Questions by Topic
```http
GET /api/questions/topic/:topic
```

**Example:**
```http
GET /api/questions/topic/Arrays
```

**Response (200 OK):**
```json
{
  "success": true,
  "topic": "Arrays",
  "count": 5,
  "data": [...]
}
```

---

#### 8. Get Random Question (for Matching)
```http
GET /api/questions/random?topic=Arrays&difficulty=Easy
```

**Query Parameters:**
- `topic` (required): The topic to filter by
- `difficulty` (required): The difficulty level
- `excludeQuestionId` (optional): Question ID to exclude (avoid duplicates in session)

**Example:**
```http
GET /api/questions/random?topic=Arrays&difficulty=Easy&excludeQuestionId=507f1f77bcf86cd799439011
```

**Response (200 OK):**
```json
{
  "success": true,
  "questionId": "507f191e810c19729de860ea"
}
```

**Response (404 Not Found):**
```json
{
  "success": false,
  "error": "No questions found with topic \"Arrays\" and difficulty \"Easy\""
}
```

---

#### 9. Get All Categories
```http
GET /api/questions/categories
```

**Response (200 OK):**
```json
{
  "success": true,
  "count": 10,
  "data": [
    "Arrays",
    "Binary Search",
    "Dynamic Programming",
    "Graphs",
    "Hash Table",
    "Linked Lists",
    "Sorting",
    "Strings",
    "Trees",
    "Two Pointers"
  ]
}
```

---

#### 10. Get All Difficulties
```http
GET /api/questions/difficulties
```

**Response (200 OK):**
```json
{
  "success": true,
  "count": 3,
  "data": [
    "Easy",
    "Hard",
    "Medium"
  ]
}
```

---

#### 11. Health Check
```http
GET /health
```

**Response (200 OK):**
```json
{
  "status": "OK",
  "service": "QuestionService",
  "timestamp": "2025-10-12T14:30:00.000Z"
}
```

---

## 🧪 Testing

### Run Tests
```bash
# Run all tests
npm test

# Run tests with coverage
npm test -- --coverage

# Run tests in watch mode
npm run test:watch
```

### Test Coverage
```
Test Suites: 2 passed, 2 total
Tests:       47 passed, 47 total
Coverage:    71.5% statements, 56.96% branches
```

### Test Structure
```
src/test/
├── setup.js              # Test configuration (in-memory MongoDB)
├── question-api.test.js  # API integration tests (23 tests)
└── question-model.test.js # Model unit tests (24 tests)
```

### What's Tested
- ✅ CRUD operations (create, read, update, delete)
- ✅ Validation (required fields, data types, enums)
- ✅ Filtering (by difficulty, topic)
- ✅ Random question selection
- ✅ Error handling (400, 404, 500 errors)
- ✅ Edge cases (invalid IDs, non-existent resources)

---

## 🛡 Error Handling

The service uses a structured error handling approach with custom error classes.

### Error Response Format
```json
{
  "success": false,
  "error": "ERROR_TYPE",
  "message": "Human-readable error message",
  "timestamp": "2025-10-12T14:30:00.000Z"
}
```

### Error Types

| Status Code | Error Type | Description |
|------------|------------|-------------|
| 400 | `BAD_REQUEST` | Invalid request data or parameters |
| 400 | `VALIDATION_ERROR` | Schema validation failed |
| 400 | `INVALID_ID` | Invalid MongoDB ObjectId format |
| 404 | `NOT_FOUND` | Question not found |
| 500 | `INTERNAL_SERVER_ERROR` | Unexpected server error |

### Custom Error Classes
- `BaseError` - Base error class for all custom errors
- `NotFoundError` - Resource not found (404)
- `BadRequestError` - Invalid request (400)
- `ValidationError` - Validation failure (400)
- `QuestionNotFoundError` - Question-specific not found error
- `InvalidQuestionDataError` - Invalid question data

---

## 🔐 Environment Variables

Create a `.env` file in the root directory:

```env
# Server Configuration
PORT=8000
NODE_ENV=development

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/questiondb

# Optional: For MongoDB Atlas
# MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/questiondb?retryWrites=true&w=majority
```

### Configuration Options

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PORT` | No | `8000` | Server port number |
| `NODE_ENV` | No | `development` | Environment mode (`development` or `production`) |
| `MONGODB_URI` | Yes | - | MongoDB connection string |

---

## 📁 Project Structure

```
question-service/
├── src/
│   ├── config/
│   │   └── database.js           # MongoDB connection setup
│   ├── controllers/
│   │   └── question-controller.js # Request handlers
│   ├── models/
│   │   └── question-model.js     # Mongoose schema & static methods
│   ├── routes/
│   │   └── question-routes.js    # API route definitions
│   ├── errors/
│   │   ├── base-errors.js        # Base error classes
│   │   ├── question-errors.js    # Question-specific errors
│   │   └── index.js              # Error exports
│   ├── middleware/
│   │   └── errorHandler.js       # Global error handler
│   ├── scripts/
│   │   └── seed-questions.js     # Database seeding script
│   ├── test/
│   │   ├── setup.js              # Test configuration
│   │   ├── question-api.test.js  # API integration tests
│   │   └── question-model.test.js # Model unit tests
│   ├── index.js                  # Express app configuration
│   └── server.js                 # Server entry point
├── Question-Service-API.postman_collection.json  # Postman collection
├── Question-Service.postman_environment.json     # Postman environment
├── .env                          # Environment variables (not in git)
├── .gitignore                    # Git ignore rules
├── package.json                  # Dependencies & scripts
├── jest.config.js                # Jest test configuration
├── Dockerfile                    # Docker configuration
└── README.md                     # This file
```

---

## 🔧 Scripts

```json
{
  "start": "node src/server.js",           // Start production server
  "dev": "nodemon src/server.js",          // Start development server with auto-reload
  "test": "jest",                          // Run tests
  "test:watch": "jest --watch",            // Run tests in watch mode
  "seed": "node src/scripts/seed-questions.js"  // Seed database with sample data
}
```

---

## 📊 Question Schema

### Question Model Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `title` | String | Yes | Question title (min 3 chars, unique) |
| `description` | String | Yes | Full question description (min 10 chars) |
| `difficulty` | String | Yes | `Easy`, `Medium`, or `Hard` |
| `topics` | Array[String] | Yes | Question topics (at least 1 required) |
| `tags` | Array[String] | No | Additional tags for categorization |
| `testCases` | Array[Object] | Yes | Test cases (at least 1 required) |
| `constraints` | Array[String] | No | Problem constraints |
| `createdAt` | Date | Auto | Timestamp of creation |
| `updatedAt` | Date | Auto | Timestamp of last update |

### Test Case Object

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `input` | String | Yes | Test case input |
| `expectedOutput` | String | Yes | Expected output |
| `explanation` | String | No | Explanation of test case |
| `type` | String | No | `Sample` or `Hidden` (default: `Sample`) |

---

## 🎯 Use Cases

### 1. Matching Session - Get Random Question
When two users are matched for a coding session:

```javascript
// Get random question based on user preferences
GET /api/questions/random?topic=Arrays&difficulty=Medium
// Returns: { "success": true, "questionId": "507f191e810c19729de860ea" }

// Then fetch the full question details using the returned ID
GET /api/questions/507f191e810c19729de860ea

// For subsequent questions in same session (avoid duplicates)
GET /api/questions/random?topic=Arrays&difficulty=Medium&excludeQuestionId=507f1f77bcf86cd799439011
```

### 2. Question Bank - Browse by Difficulty
List all questions of a specific difficulty:

```javascript
GET /api/questions/difficulty/Hard
```

### 3. Topic-based Practice
Get all questions for a specific topic:

```javascript
GET /api/questions/topic/DynamicProgramming
```

### 4. Get Available Categories
Retrieve all available categories/topics for filtering:

```javascript
GET /api/questions/categories
// Returns: ["Arrays", "Binary Search", "Dynamic Programming", ...]
```

### 5. Get Available Difficulty Levels
Retrieve all difficulty levels:

```javascript
GET /api/questions/difficulties
// Returns: ["Easy", "Hard", "Medium"]
```

---

## 🤝 Integration with Other Services

### User Service Integration
The Question Service can be integrated with the User Service for:
- Authentication/Authorization (protect admin routes)
- User preferences (difficulty, topics)
- User progress tracking

### Matching Service Integration
The Question Service provides questions for matched users:
- Random question selection based on user preferences
- Exclude previously answered questions in a session

---

## 📈 Future Enhancements

- [ ] Add Joi validation middleware for request validation
- [ ] Add authentication/authorization (JWT)
- [ ] Add pagination for large result sets
- [ ] Add search functionality (full-text search)
- [ ] Add question categories/collections
- [ ] Add difficulty rating based on user performance
- [ ] Add question statistics (solve rate, avg time)
- [ ] Add versioning for question updates
- [ ] Add admin routes with role-based access
- [ ] Add rate limiting
- [ ] Add caching layer (Redis)

---

## 🐛 Troubleshooting

### MongoDB Connection Issues
```
Error: MongoDB Connection Error
```
**Solution:** Check your `MONGODB_URI` in `.env` and ensure MongoDB is running.

### Port Already in Use
```
Error: Port 8000 is already in use
```
**Solution:** Change the `PORT` in `.env` or kill the process using port 8000.

### Validation Errors
```
ValidationError: Question validation failed: title: Title must be at least 3 characters long
```
**Solution:** Ensure your request data meets the schema requirements.

---

## 📝 License

This project is part of CS3219 coursework (AY2526S1).

---

## 👥 Contributors

Project G35 - CS3219 AY2526S1

---

## 📞 Support

For issues or questions, please contact the development team or refer to the project documentation.

---

**Happy Coding! 🚀**

