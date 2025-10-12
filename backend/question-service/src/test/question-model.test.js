const Question = require('../models/question-model');

/**
 * Question Model Unit Tests
 * Tests model methods and validation
 */

describe('Question Model Tests', () => {

    const sampleQuestionData = {
        title: "Test Question",
        description: "This is a test question description",
        difficulty: "Easy",
        topics: ["Testing"],
        tags: ["test"],
        testCases: [
            {
                input: "test input",
                expectedOutput: "test output",
                explanation: "test explanation",
                type: "Sample"
            }
        ],
        constraints: ["Test constraint"]
    };

    describe('createQuestion', () => {

        it('should create a question with valid data', async () => {
            const question = await Question.createQuestion(sampleQuestionData);

            expect(question._id).toBeDefined();
            expect(question.title).toBe(sampleQuestionData.title);
            expect(question.difficulty).toBe(sampleQuestionData.difficulty);
            expect(question.createdAt).toBeDefined();
            expect(question.updatedAt).toBeDefined();
        });

        it('should fail without required title', async () => {
            const invalidData = { ...sampleQuestionData };
            delete invalidData.title;

            await expect(Question.createQuestion(invalidData)).rejects.toThrow();
        });

        it('should fail without required description', async () => {
            const invalidData = { ...sampleQuestionData };
            delete invalidData.description;

            await expect(Question.createQuestion(invalidData)).rejects.toThrow();
        });

        it('should fail with invalid difficulty', async () => {
            const invalidData = {
                ...sampleQuestionData,
                difficulty: "SuperEasy"
            };

            await expect(Question.createQuestion(invalidData)).rejects.toThrow();
        });

        it('should fail without topics', async () => {
            const invalidData = { ...sampleQuestionData };
            delete invalidData.topics;

            await expect(Question.createQuestion(invalidData)).rejects.toThrow();
        });

        it('should fail with empty topics array', async () => {
            const invalidData = {
                ...sampleQuestionData,
                topics: []
            };

            await expect(Question.createQuestion(invalidData)).rejects.toThrow();
        });

        it('should fail without test cases', async () => {
            const invalidData = { ...sampleQuestionData };
            delete invalidData.testCases;

            await expect(Question.createQuestion(invalidData)).rejects.toThrow();
        });
    });

    describe('getAll', () => {

        it('should return empty array when no questions exist', async () => {
            const questions = await Question.getAll();
            expect(questions).toEqual([]);
        });

        it('should return all questions', async () => {
            await Question.createQuestion(sampleQuestionData);
            await Question.createQuestion({
                ...sampleQuestionData,
                title: "Another Question"
            });

            const questions = await Question.getAll();
            expect(questions.length).toBe(2);
        });
    });

    describe('getById', () => {

        it('should return question by valid ID', async () => {
            const created = await Question.createQuestion(sampleQuestionData);
            const found = await Question.getById(created._id);

            expect(found).toBeDefined();
            expect(found.title).toBe(sampleQuestionData.title);
        });

        it('should return null for non-existent ID', async () => {
            const fakeId = '507f1f77bcf86cd799439011';
            const found = await Question.getById(fakeId);

            expect(found).toBeNull();
        });
    });

    describe('updateQuestion', () => {

        it('should update question fields', async () => {
            const created = await Question.createQuestion(sampleQuestionData);

            const updates = {
                title: "Updated Title",
                difficulty: "Medium"
            };

            const updated = await Question.updateQuestion(created._id, updates);

            expect(updated.title).toBe(updates.title);
            expect(updated.difficulty).toBe(updates.difficulty);
            expect(updated.updatedAt).not.toBe(created.updatedAt);
        });

        it('should return null when updating non-existent question', async () => {
            const fakeId = '507f1f77bcf86cd799439011';
            const updated = await Question.updateQuestion(fakeId, { title: "Updated" });

            expect(updated).toBeNull();
        });
    });

    describe('deleteQuestion', () => {

        it('should delete existing question', async () => {
            const created = await Question.createQuestion(sampleQuestionData);
            const deleted = await Question.deleteQuestion(created._id);

            expect(deleted).toBe(true);

            const found = await Question.getById(created._id);
            expect(found).toBeNull();
        });

        it('should return false when deleting non-existent question', async () => {
            const fakeId = '507f1f77bcf86cd799439011';
            const deleted = await Question.deleteQuestion(fakeId);

            expect(deleted).toBe(false);
        });
    });

    describe('getByDifficulty', () => {

        beforeEach(async () => {
            await Question.createQuestion({ ...sampleQuestionData, difficulty: "Easy" });
            await Question.createQuestion({ ...sampleQuestionData, title: "Medium Question", difficulty: "Medium" });
            await Question.createQuestion({ ...sampleQuestionData, title: "Hard Question", difficulty: "Hard" });
        });

        it('should return Easy questions', async () => {
            const questions = await Question.getByDifficulty("Easy");
            expect(questions.length).toBe(1);
            expect(questions[0].difficulty).toBe("Easy");
        });

        it('should return Medium questions', async () => {
            const questions = await Question.getByDifficulty("Medium");
            expect(questions.length).toBe(1);
        });

        it('should return Hard questions', async () => {
            const questions = await Question.getByDifficulty("Hard");
            expect(questions.length).toBe(1);
        });
    });

    describe('getByTopic', () => {

        beforeEach(async () => {
            await Question.createQuestion({ ...sampleQuestionData, topics: ["Arrays"] });
            await Question.createQuestion({ ...sampleQuestionData, title: "String Question", topics: ["Strings"] });
        });

        it('should return questions with specific topic', async () => {
            const questions = await Question.getByTopic("Arrays");
            expect(questions.length).toBe(1);
            expect(questions[0].topics).toContain("Arrays");
        });

        it('should return empty array for non-existent topic', async () => {
            const questions = await Question.getByTopic("NonExistent");
            expect(questions).toEqual([]);
        });
    });

    describe('getRandomByDifficulty', () => {

        beforeEach(async () => {
            await Question.createQuestion({ ...sampleQuestionData, difficulty: "Easy" });
            await Question.createQuestion({ ...sampleQuestionData, title: "Another Easy Question", difficulty: "Easy" });
        });

        it('should return a random Easy question', async () => {
            const question = await Question.getRandomByDifficulty("Easy");

            expect(question).toBeDefined();
            expect(question.difficulty).toBe("Easy");
        });

        it('should return null when no questions match difficulty', async () => {
            const question = await Question.getRandomByDifficulty("Hard");
            expect(question).toBeNull();
        });
    });

    describe('getRandomByTopicAndDifficulty', () => {

        beforeEach(async () => {
            await Question.createQuestion({
                ...sampleQuestionData,
                difficulty: "Easy",
                topics: ["Arrays"]
            });
        });

        it('should return random question matching topic and difficulty', async () => {
            const question = await Question.getRandomByTopicAndDifficulty("Arrays", "Easy");

            expect(question).toBeDefined();
            expect(question.difficulty).toBe("Easy");
            expect(question.topics).toContain("Arrays");
        });

        it('should return null when no questions match criteria', async () => {
            const question = await Question.getRandomByTopicAndDifficulty("NonExistent", "Hard");
            expect(question).toBeNull();
        });
    });
});

