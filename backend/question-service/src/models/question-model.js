const mongoose = require('mongoose');

/**
 * Question Schema - MongoDB/Mongoose Implementation
 * Supports all Functional Requirements:
 * - Store questions with metadata (title, description, difficulty, topics, tags)
 * - Store test cases (input, output, explanation)
 * - Store constraints
 * - Retrieve by difficulty and topic
 * - Support random question selection
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
          input: {
            type: String,
            required: [true, 'Test case input is required'],
          },
          expectedOutput: {
            type: String,
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
  // Remove undefined fields to avoid overwriting with undefined
  const cleanData = {};
  Object.keys(questionData).forEach((key) => {
    if (questionData[key] !== undefined) {
      cleanData[key] = questionData[key];
    }
  });
  return await this.findByIdAndUpdate(id, cleanData, { new: true, runValidators: true });
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
