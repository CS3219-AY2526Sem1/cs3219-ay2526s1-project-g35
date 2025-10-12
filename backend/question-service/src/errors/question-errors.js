const { NotFoundError, BadRequestError } = require('./base-errors');

/**
 * Question-Specific Error Classes
 */

class QuestionNotFoundError extends NotFoundError {
    constructor(questionId) {
        super(`Question with id ${questionId} not found`, 'QUESTION_NOT_FOUND');
        this.questionId = questionId;
    }
}

class InvalidQuestionDataError extends BadRequestError {
    constructor(message, details = null) {
        super(message, 'INVALID_QUESTION_DATA');
        this.details = details;
    }
}

class DuplicateQuestionError extends BadRequestError {
    constructor(title) {
        super(`Question with title "${title}" already exists`, 'DUPLICATE_QUESTION');
        this.title = title;
    }
}

class InvalidDifficultyError extends BadRequestError {
    constructor(difficulty) {
        super(`Invalid difficulty level: ${difficulty}. Must be Easy, Medium, or Hard`, 'INVALID_DIFFICULTY');
        this.difficulty = difficulty;
    }
}

class NoQuestionsFoundError extends NotFoundError {
    constructor(criteria) {
        super(`No questions found matching criteria: ${JSON.stringify(criteria)}`, 'NO_QUESTIONS_FOUND');
        this.criteria = criteria;
    }
}

module.exports = {
    QuestionNotFoundError,
    InvalidQuestionDataError,
    DuplicateQuestionError,
    InvalidDifficultyError,
    NoQuestionsFoundError
};

