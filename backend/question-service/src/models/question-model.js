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
    functionSignature: {
      type: {
        name: {
          type: String,
          default: 'solution',
        },
        parameters: [
          {
            name: {
              type: String,
              required: true,
            },
            type: {
              type: String,
              enum: [
                'number',
                'string',
                'boolean',
                'array',
                'object',
                'ListNode',
                'TreeNode',
                'Graph',
              ],
              required: true,
            },
            constructFrom: {
              type: String,
              enum: ['array', 'object', 'adjacencyList'],
              required: false,
            },
          },
        ],
        returnType: {
          type: String,
          enum: ['number', 'string', 'boolean', 'array', 'object', 'ListNode', 'TreeNode', 'void'],
          default: 'number',
        },
      },
      required: false, // Optional for backward compatibility
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
        topics: { $in: topics }, // Match any of the provided topics
        difficulty,
      },
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

/**
 * Generate starter code template based on function signature
 * @param {Object} functionSignature - Function signature metadata
 * @param {string} language - Programming language (python, javascript, java, cpp)
 * @returns {string} - Starter code template
 */
questionSchema.statics.generateStarterCode = function (functionSignature, language) {
  if (!functionSignature || !functionSignature.parameters) {
    // No signature - return basic template
    return this.getBasicTemplate(language);
  }

  const funcName = functionSignature.name || 'solution';
  const params = functionSignature.parameters || [];
  const returnType = functionSignature.returnType || 'void';

  switch (language.toLowerCase()) {
    case 'python':
      return this.generatePythonTemplate(funcName, params, returnType);
    case 'javascript':
    case 'js':
      return this.generateJavaScriptTemplate(funcName, params, returnType);
    case 'java':
      return this.generateJavaTemplate(funcName, params, returnType);
    case 'cpp':
    case 'c++':
      return this.generateCppTemplate(funcName, params, returnType);
    default:
      return this.getBasicTemplate(language);
  }
};

// Python template generator
questionSchema.statics.generatePythonTemplate = function (funcName, params, returnType) {
  const paramList = params.map((p) => p.name).join(', ');
  const paramDocs = params
    .map((p) => `    :param ${p.name}: ${this.getPythonTypeHint(p.type)}`)
    .join('\n');

  return `def ${funcName}(${paramList}):
    """
    Write your solution here
${paramDocs}
    :return: ${this.getPythonTypeHint(returnType)}
    """
    # Your code here
    pass
`;
};

// JavaScript template generator
questionSchema.statics.generateJavaScriptTemplate = function (funcName, params, returnType) {
  const paramList = params.map((p) => p.name).join(', ');
  const paramDocs = params
    .map((p) => `     * @param {${this.getJSTypeHint(p.type)}} ${p.name}`)
    .join('\n');

  return `function ${funcName}(${paramList}) {
    /**
     * Write your solution here
${paramDocs}
     * @return {${this.getJSTypeHint(returnType)}}
     */
    // Your code here
    
}
`;
};

// Java template generator
questionSchema.statics.generateJavaTemplate = function (funcName, params, returnType) {
  const paramList = params.map((p) => `${this.getJavaType(p.type)} ${p.name}`).join(', ');

  return `class Solution {
    /**
     * Write your solution here
     */
    public ${this.getJavaType(returnType)} ${funcName}(${paramList}) {
        // Your code here
        ${this.getJavaReturnDefault(returnType)}
    }
}
`;
};

// C++ template generator
questionSchema.statics.generateCppTemplate = function (funcName, params, returnType) {
  const paramList = params.map((p) => `${this.getCppType(p.type)} ${p.name}`).join(', ');

  return `class Solution {
public:
    /**
     * Write your solution here
     */
    ${this.getCppType(returnType)} ${funcName}(${paramList}) {
        // Your code here
        ${this.getCppReturnDefault(returnType)}
    }
};
`;
};

// Type hint helpers
questionSchema.statics.getPythonTypeHint = function (type) {
  const typeMap = {
    number: 'int',
    string: 'str',
    boolean: 'bool',
    array: 'List',
    object: 'Dict',
    ListNode: 'ListNode',
    TreeNode: 'TreeNode',
    Graph: 'Graph',
    void: 'None',
  };
  return typeMap[type] || 'Any';
};

questionSchema.statics.getJSTypeHint = function (type) {
  const typeMap = {
    number: 'number',
    string: 'string',
    boolean: 'boolean',
    array: 'Array',
    object: 'Object',
    ListNode: 'ListNode',
    TreeNode: 'TreeNode',
    Graph: 'Graph',
    void: 'void',
  };
  return typeMap[type] || 'any';
};

questionSchema.statics.getJavaType = function (type) {
  const typeMap = {
    number: 'int',
    string: 'String',
    boolean: 'boolean',
    array: 'int[]',
    object: 'Object',
    ListNode: 'ListNode',
    TreeNode: 'TreeNode',
    Graph: 'Graph',
    void: 'void',
  };
  return typeMap[type] || 'Object';
};

questionSchema.statics.getCppType = function (type) {
  const typeMap = {
    number: 'int',
    string: 'string',
    boolean: 'bool',
    array: 'vector<int>',
    object: 'map<string, int>',
    ListNode: 'ListNode*',
    TreeNode: 'TreeNode*',
    Graph: 'Graph',
    void: 'void',
  };
  return typeMap[type] || 'auto';
};

questionSchema.statics.getJavaReturnDefault = function (type) {
  const defaults = {
    number: 'return 0;',
    string: 'return "";',
    boolean: 'return false;',
    array: 'return new int[]{};',
    object: 'return null;',
    ListNode: 'return null;',
    TreeNode: 'return null;',
    Graph: 'return null;',
    void: '',
  };
  return defaults[type] || 'return null;';
};

questionSchema.statics.getCppReturnDefault = function (type) {
  const defaults = {
    number: 'return 0;',
    string: 'return "";',
    boolean: 'return false;',
    array: 'return {};',
    object: 'return {};',
    ListNode: 'return nullptr;',
    TreeNode: 'return nullptr;',
    Graph: 'return {};',
    void: '',
  };
  return defaults[type] || 'return {};';
};

// Basic template for questions without signature
questionSchema.statics.getBasicTemplate = function (language) {
  const templates = {
    python: 'def solution():\n    # Your code here\n    pass\n',
    javascript: 'function solution() {\n    // Your code here\n    \n}\n',
    java: 'class Solution {\n    public void solution() {\n        // Your code here\n    }\n}\n',
    cpp: 'class Solution {\npublic:\n    void solution() {\n        // Your code here\n    }\n};\n',
  };
  return templates[language.toLowerCase()] || '// Write your solution here\n';
};

const Question = mongoose.model('Question', questionSchema);

module.exports = Question;
