const mongoose = require('mongoose');

/**
 * Question Schema - MongoDB/Mongoose Implementation
 * Supports all Functional Requirements:
 * - Store questions with metadata (title, description, difficulty, topics, tags)
 * - Store test cases (params array, expected output, explanation)
 * - Store constraints
 * - Retrieve by difficulty and topic
 * - Support random question selection
 * 
 * Test Case Format:
 * - params: Array of parameters to pass to the solution function
 * - expected: Expected output (any type: number, string, array, object, boolean)
 * - explanation: Human-readable explanation
 * - type: 'Sample' or 'Hidden'
 */

const questionSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Question title is required'],
      trim: true,
      minlength: [5, 'Title must be at least 5 characters long'],
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      required: [true, 'Question description is required'],
      trim: true,
      minlength: [10, 'Description must be at least 10 characters long'],
    },
    difficulty: {
      type: String,
      required: [true, 'Difficulty level is required'],
      enum: {
        values: ['Easy', 'Medium', 'Hard'],
        message: '{VALUE} is not a valid difficulty level',
      },
    },
    topics: {
      type: [String],
      required: [true, 'At least one topic is required'],
      validate: {
        validator: function (topics) {
          return topics && topics.length > 0;
        },
        message: 'Question must have at least one topic',
      },
    },
    tags: {
      type: [String],
      default: [],
    },
    testCases: {
      type: [
        {
          params: {
            type: [mongoose.Schema.Types.Mixed],
            required: [true, 'Test case params array is required'],
          },
          expected: {
            type: mongoose.Schema.Types.Mixed,
            required: [true, 'Test case expected output is required'],
          },
          explanation: {
            type: String,
            default: '',
          },
          type: {
            type: String,
            enum: ['Sample', 'Hidden'],
            default: 'Sample',
          },
        },
      ],
      validate: {
        validator: function (testCases) {
          return testCases && testCases.length > 0;
        },
        message: 'Question must have at least one test case',
      },
    },
    constraints: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt
  },
);

// Indexes for efficient querying
questionSchema.index({ difficulty: 1 });
questionSchema.index({ topics: 1 });
questionSchema.index({ difficulty: 1, topics: 1 });

/**
 * Static Methods - For querying the database
 */

// Get all questions
questionSchema.statics.getAll = async function () {
  return await this.find();
};

//Get the 10 most recent edited questions
questionSchema.statics.getFirstTen = async function () {
  return await this.find().sort({ updatedAt: -1, createdAt: -1 }).limit(10);
};

// Get question by ID
questionSchema.statics.getById = async function (id) {
  return await this.findById(id);
};

// Create a new question
questionSchema.statics.createQuestion = async function (questionData) {
  const question = new this(questionData);
  return await question.save();
};

// Update a question
questionSchema.statics.updateQuestion = async function (id, questionData) {
  return await this.findByIdAndUpdate(id, questionData, { new: true, runValidators: true });
};

// Delete a question
questionSchema.statics.deleteQuestion = async function (id) {
  const result = await this.findByIdAndDelete(id);
  return result !== null;
};

// Get questions by difficulty
questionSchema.statics.getByDifficulty = async function (difficulty) {
  return await this.find({ difficulty });
};

// Get questions by topic
questionSchema.statics.getByTopic = async function (topic) {
  return await this.find({ topics: topic });
};

// Search questions with filters
questionSchema.statics.searchQuestions = async function ({
  searchText,
  difficulties,
  topics,
  tags,
}) {
  const filters = [];

  if (searchText) {
    const escaped = searchText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escaped, 'i');
    filters.push({
      $or: [{ title: regex }, { description: regex }],
    });
  }

  if (Array.isArray(difficulties) && difficulties.length > 0) {
    filters.push({ difficulty: { $in: difficulties } });
  }

  if (Array.isArray(topics) && topics.length > 0) {
    filters.push({ topics: { $in: topics } });
  }

  if (Array.isArray(tags) && tags.length > 0) {
    filters.push({ tags: { $all: tags } });
  }

  const query = filters.length > 0 ? { $and: filters } : {};

  return await this.find(query).sort({ updatedAt: -1, createdAt: -1 });
};

// Get random question by difficulty
questionSchema.statics.getRandomByDifficulty = async function (difficulty) {
  const questions = await this.aggregate([{ $match: { difficulty } }, { $sample: { size: 1 } }]);
  return questions.length > 0 ? questions[0] : null;
};

// Get random question by topic and difficulty (for matching)
questionSchema.statics.getRandomByTopicAndDifficulty = async function (topic, difficulty) {
  const questions = await this.aggregate([
    { $match: { topics: topic, difficulty } },
    { $sample: { size: 1 } },
  ]);
  return questions.length > 0 ? questions[0] : null;
};

// Get random question by multiple topics and difficulty (for matching)
questionSchema.statics.getRandomByTopicsAndDifficulty = async function (topics, difficulty) {
  const questions = await this.aggregate([
    { 
      $match: { 
        topics: { $in: topics },  // Match any of the provided topics
        difficulty 
      } 
    },
    { $sample: { size: 1 } },
  ]);
  return questions.length > 0 ? questions[0] : null;
};

// Get all unique categories/topics
questionSchema.statics.getAllCategories = async function () {
  const categories = await this.distinct('topics');
  return categories.sort();
};

// Get all difficulty levels
questionSchema.statics.getAllDifficulties = async function () {
  const difficulties = await this.distinct('difficulty');
  return difficulties.sort();
};

const Question = mongoose.model('Question', questionSchema);

module.exports = Question;
