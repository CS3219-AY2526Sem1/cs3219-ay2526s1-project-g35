const mongoose = require('mongoose');
const Question = require('../models/question-model');
require('dotenv').config();

/**
 * Seed Script for Question Service
 * Populates the database with 20 sample LeetCode questions
 */

const sampleQuestions = [
    {
        title: "Reverse a String",
        description: "Write a function that reverses a string. The input string is given as an array of characters s. You must do this by modifying the input array in-place with O(1) extra memory.",
        difficulty: "Easy",
        topics: ["Strings", "Algorithms"],
        tags: ["leetcode", "two-pointers"],
        testCases: [
            {
                input: 's = ["h","e","l","l","o"]',
                expectedOutput: '["o","l","l","e","h"]',
                explanation: "Reverse the array of characters",
                type: "Sample"
            },
            {
                input: 's = ["H","a","n","n","a","h"]',
                expectedOutput: '["h","a","n","n","a","H"]',
                explanation: "Reverse the array of characters",
                type: "Sample"
            }
        ],
        constraints: [
            "1 <= s.length <= 10^5",
            "s[i] is a printable ascii character."
        ]
    },
    {
        title: "Linked List Cycle Detection",
        description: "Implement a function to detect if a linked list contains a cycle.",
        difficulty: "Easy",
        topics: ["Data Structures", "Algorithms"],
        tags: ["leetcode", "linked-list", "two-pointers"],
        testCases: [
            {
                input: "head = [3,2,0,-4], pos = 1",
                expectedOutput: "true",
                explanation: "There is a cycle in the linked list, where the tail connects to the 1st node (0-indexed).",
                type: "Sample"
            },
            {
                input: "head = [1,2], pos = 0",
                expectedOutput: "true",
                explanation: "There is a cycle in the linked list, where the tail connects to the 0th node.",
                type: "Sample"
            },
            {
                input: "head = [1], pos = -1",
                expectedOutput: "false",
                explanation: "There is no cycle in the linked list.",
                type: "Sample"
            }
        ],
        constraints: [
            "The number of nodes in the list is in the range [0, 10^4]",
            "-10^5 <= Node.val <= 10^5"
        ]
    },
    {
        title: "Roman to Integer",
        description: "Given a roman numeral, convert it to an integer.",
        difficulty: "Easy",
        topics: ["Algorithms"],
        tags: ["leetcode", "hash-table", "math"],
        testCases: [
            {
                input: 's = "III"',
                expectedOutput: "3",
                explanation: "III = 3.",
                type: "Sample"
            },
            {
                input: 's = "LVIII"',
                expectedOutput: "58",
                explanation: "L = 50, V= 5, III = 3.",
                type: "Sample"
            },
            {
                input: 's = "MCMXCIV"',
                expectedOutput: "1994",
                explanation: "M = 1000, CM = 900, XC = 90 and IV = 4.",
                type: "Sample"
            }
        ],
        constraints: [
            "1 <= s.length <= 15",
            "s contains only the characters ('I', 'V', 'X', 'L', 'C', 'D', 'M')."
        ]
    },
    {
        title: "Add Binary",
        description: "Given two binary strings a and b, return their sum as a binary string.",
        difficulty: "Easy",
        topics: ["Bit Manipulation", "Algorithms"],
        tags: ["leetcode", "math", "string"],
        testCases: [
            {
                input: 'a = "11", b = "1"',
                expectedOutput: '"100"',
                explanation: "",
                type: "Sample"
            },
            {
                input: 'a = "1010", b = "1011"',
                expectedOutput: '"10101"',
                explanation: "",
                type: "Sample"
            }
        ],
        constraints: [
            "1 <= a.length, b.length <= 10^4",
            "a and b consist only of '0' or '1' characters."
        ]
    },
    {
        title: "Fibonacci Number",
        description: "The Fibonacci numbers, commonly denoted F(n) form a sequence, called the Fibonacci sequence, such that each number is the sum of the two preceding ones, starting from 0 and 1. That is, F(0) = 0, F(1) = 1, F(n) = F(n - 1) + F(n - 2), for n > 1. Given n, calculate F(n).",
        difficulty: "Easy",
        topics: ["Recursion", "Algorithms"],
        tags: ["leetcode", "dynamic-programming", "math"],
        testCases: [
            {
                input: "n = 2",
                expectedOutput: "1",
                explanation: "F(2) = F(1) + F(0) = 1 + 0 = 1.",
                type: "Sample"
            },
            {
                input: "n = 3",
                expectedOutput: "2",
                explanation: "F(3) = F(2) + F(1) = 1 + 1 = 2.",
                type: "Sample"
            },
            {
                input: "n = 4",
                expectedOutput: "3",
                explanation: "F(4) = F(3) + F(2) = 2 + 1 = 3.",
                type: "Sample"
            }
        ],
        constraints: [
            "0 <= n <= 30"
        ]
    },
    {
        title: "Implement Stack using Queues",
        description: "Implement a last-in-first-out (LIFO) stack using only two queues. The implemented stack should support all the functions of a normal stack (push, top, pop, and empty).",
        difficulty: "Easy",
        topics: ["Data Structures"],
        tags: ["leetcode", "stack", "queue", "design"],
        testCases: [
            {
                input: '["MyStack", "push", "push", "top", "pop", "empty"]\n[[], [1], [2], [], [], []]',
                expectedOutput: '[null, null, null, 2, 2, false]',
                explanation: "MyStack myStack = new MyStack();\nmyStack.push(1);\nmyStack.push(2);\nmyStack.top(); // return 2\nmyStack.pop(); // return 2\nmyStack.empty(); // return False",
                type: "Sample"
            }
        ],
        constraints: [
            "1 <= x <= 9",
            "At most 100 calls will be made to push, pop, top, and empty."
        ]
    },
    {
        title: "Combine Two Tables",
        description: "Given table Person with columns personId (int), lastName (varchar), firstName (varchar) where personId is the primary key, and table Address with columns addressId (int), personId (int), city (varchar), state (varchar) where addressId is the primary key. Write a solution to report the first name, last name, city, and state of each person in the Person table. If the address of a personId is not present in the Address table, report null instead.",
        difficulty: "Easy",
        topics: ["Databases"],
        tags: ["leetcode", "sql", "database"],
        testCases: [
            {
                input: 'Person table:\n+----------+----------+-----------+\n| personId | lastName | firstName |\n+----------+----------+-----------+\n| 1        | Wang     | Allen     |\n| 2        | Alice    | Bob       |\n+----------+----------+-----------+\nAddress table:\n+-----------+----------+---------------+------------+\n| addressId | personId | city          | state      |\n+-----------+----------+---------------+------------+\n| 1         | 2        | New York City | New York   |\n| 2         | 3        | Leetcode      | California |\n+-----------+----------+---------------+------------+',
                expectedOutput: '+-----------+----------+---------------+----------+\n| firstName | lastName | city          | state    |\n+-----------+----------+---------------+----------+\n| Allen     | Wang     | Null          | Null     |\n| Bob       | Alice    | New York City | New York |\n+-----------+----------+---------------+----------+',
                explanation: "There is no address in the address table for the personId = 1 so we return null in their city and state.",
                type: "Sample"
            }
        ],
        constraints: []
    },
    {
        title: "Repeated DNA Sequences",
        description: "The DNA sequence is composed of a series of nucleotides abbreviated as 'A', 'C', 'G', and 'T'. For example, \"ACGAATTCCG\" is a DNA sequence. When studying DNA, it is useful to identify repeated sequences within the DNA. Given a string s that represents a DNA sequence, return all the 10-letter-long sequences (substrings) that occur more than once in a DNA molecule. You may return the answer in any order.",
        difficulty: "Medium",
        topics: ["Algorithms", "Bit Manipulation"],
        tags: ["leetcode", "hash-table", "string"],
        testCases: [
            {
                input: 's = "AAAAACCCCCAAAAACCCCCCAAAAAGGGTTT"',
                expectedOutput: '["AAAAACCCCC","CCCCCAAAAA"]',
                explanation: "",
                type: "Sample"
            },
            {
                input: 's = "AAAAAAAAAAAAA"',
                expectedOutput: '["AAAAAAAAAA"]',
                explanation: "",
                type: "Sample"
            }
        ],
        constraints: [
            "1 <= s.length <= 10^5",
            "s[i] is either 'A', 'C', 'G', or 'T'."
        ]
    },
    {
        title: "Course Schedule",
        description: "There are a total of numCourses courses you have to take, labeled from 0 to numCourses - 1. You are given an array prerequisites where prerequisites[i] = [ai, bi] indicates that you must take course bi first if you want to take course ai. For example, the pair [0, 1], indicates that to take course 0 you have to first take course 1. Return true if you can finish all courses. Otherwise, return false.",
        difficulty: "Medium",
        topics: ["Data Structures", "Algorithms"],
        tags: ["leetcode", "graph", "topological-sort"],
        testCases: [
            {
                input: 'numCourses = 2, prerequisites = [[1,0]]',
                expectedOutput: 'true',
                explanation: "There are a total of 2 courses to take. To take course 1 you should have finished course 0. So it is possible.",
                type: "Sample"
            },
            {
                input: 'numCourses = 2, prerequisites = [[1,0],[0,1]]',
                expectedOutput: 'false',
                explanation: "There are a total of 2 courses to take. To take course 1 you should have finished course 0, and to take course 0 you should also have finished course 1. So it is impossible.",
                type: "Sample"
            }
        ],
        constraints: [
            "1 <= numCourses <= 2000",
            "0 <= prerequisites.length <= 5000"
        ]
    },
    {
        title: "LRU Cache Design",
        description: "Design and implement an LRU (Least Recently Used) cache.",
        difficulty: "Medium",
        topics: ["Data Structures"],
        tags: ["leetcode", "hash-table", "linked-list", "design"],
        testCases: [
            {
                input: '["LRUCache", "put", "put", "get", "put", "get", "put", "get", "get", "get"]\n[[2], [1, 1], [2, 2], [1], [3, 3], [2], [4, 4], [1], [3], [4]]',
                expectedOutput: '[null, null, null, 1, null, -1, null, -1, 3, 4]',
                explanation: "LRUCache lRUCache = new LRUCache(2);\nlRUCache.put(1, 1); // cache is {1=1}\nlRUCache.put(2, 2); // cache is {1=1, 2=2}\nlRUCache.get(1);    // return 1\nlRUCache.put(3, 3); // LRU key was 2, evicts key 2, cache is {1=1, 3=3}\nlRUCache.get(2);    // returns -1 (not found)\nlRUCache.put(4, 4); // LRU key was 1, evicts key 1, cache is {4=4, 3=3}\nlRUCache.get(1);    // return -1 (not found)\nlRUCache.get(3);    // return 3\nlRUCache.get(4);    // return 4",
                type: "Sample"
            }
        ],
        constraints: [
            "1 <= capacity <= 3000",
            "0 <= key <= 10^4"
        ]
    },
    {
        title: "Longest Common Subsequence",
        description: "Given two strings text1 and text2, return the length of their longest common subsequence. If there is no common subsequence, return 0. A subsequence of a string is a new string generated from the original string with some characters (can be none) deleted without changing the relative order of the remaining characters. A common subsequence of two strings is a subsequence that is common to both strings.",
        difficulty: "Medium",
        topics: ["Strings", "Algorithms"],
        tags: ["leetcode", "dynamic-programming"],
        testCases: [
            {
                input: 'text1 = "abcde", text2 = "ace"',
                expectedOutput: '3',
                explanation: 'The longest common subsequence is "ace" and its length is 3.',
                type: "Sample"
            },
            {
                input: 'text1 = "abc", text2 = "abc"',
                expectedOutput: '3',
                explanation: 'The longest common subsequence is "abc" and its length is 3.',
                type: "Sample"
            },
            {
                input: 'text1 = "abc", text2 = "def"',
                expectedOutput: '0',
                explanation: 'There is no such common subsequence, so the result is 0.',
                type: "Sample"
            }
        ],
        constraints: [
            "1 <= text1.length, text2.length <= 1000"
        ]
    },
    {
        title: "Rotate Image",
        description: "You are given an n x n 2D matrix representing an image, rotate the image by 90 degrees (clockwise).",
        difficulty: "Medium",
        topics: ["Arrays", "Algorithms"],
        tags: ["leetcode", "matrix"],
        testCases: [
            {
                input: 'matrix = [[1,2,3],[4,5,6],[7,8,9]]',
                expectedOutput: '[[7,4,1],[8,5,2],[9,6,3]]',
                explanation: "",
                type: "Sample"
            },
            {
                input: 'matrix = [[5,1,9,11],[2,4,8,10],[13,3,6,7],[15,14,12,16]]',
                expectedOutput: '[[15,13,2,5],[14,3,4,1],[12,6,8,9],[16,7,10,11]]',
                explanation: "",
                type: "Sample"
            }
        ],
        constraints: [
            "n == matrix.length == matrix[i].length",
            "1 <= n <= 20"
        ]
    },
    {
        title: "Airplane Seat Assignment Probability",
        description: "n passengers board an airplane with exactly n seats. The first passenger has lost the ticket and picks a seat randomly. But after that, the rest of the passengers will: Take their own seat if it is still available, and pick other seats randomly when they find their seat occupied. Return the probability that the nth person gets his own seat.",
        difficulty: "Medium",
        topics: ["Brainteaser"],
        tags: ["leetcode", "math", "probability"],
        testCases: [
            {
                input: 'n = 1',
                expectedOutput: '1.00000',
                explanation: "The first person can only get the first seat.",
                type: "Sample"
            },
            {
                input: 'n = 2',
                expectedOutput: '0.50000',
                explanation: "The second person has a probability of 0.5 to get the second seat (when first person gets the first seat).",
                type: "Sample"
            }
        ],
        constraints: [
            "1 <= n <= 10^5"
        ]
    },
    {
        title: "Validate Binary Search Tree",
        description: "Given the root of a binary tree, determine if it is a valid binary search tree (BST).",
        difficulty: "Medium",
        topics: ["Data Structures", "Algorithms"],
        tags: ["leetcode", "tree", "binary-search-tree"],
        testCases: [
            {
                input: 'root = [2,1,3]',
                expectedOutput: 'true',
                explanation: "",
                type: "Sample"
            },
            {
                input: 'root = [5,1,4,null,null,3,6]',
                expectedOutput: 'false',
                explanation: "The root node's value is 5 but its right child's value is 4.",
                type: "Sample"
            }
        ],
        constraints: [
            "The number of nodes in the tree is in the range [1, 10^4]"
        ]
    },
    {
        title: "Sliding Window Maximum",
        description: "You are given an array of integers nums, there is a sliding window of size k which is moving from the very left of the array to the very right. You can only see the k numbers in the window. Each time the sliding window moves right by one position. Return the max sliding window.",
        difficulty: "Hard",
        topics: ["Arrays", "Algorithms"],
        tags: ["leetcode", "sliding-window", "queue"],
        testCases: [
            {
                input: 'nums = [1,3,-1,-3,5,3,6,7], k = 3',
                expectedOutput: '[3,3,5,5,6,7]',
                explanation: "Window position                Max\n---------------               -----\n[1  3  -1] -3  5  3  6  7       3\n 1 [3  -1  -3] 5  3  6  7       3\n 1  3 [-1  -3  5] 3  6  7       5\n 1  3  -1 [-3  5  3] 6  7       5\n 1  3  -1  -3 [5  3  6] 7       6\n 1  3  -1  -3  5 [3  6  7]      7",
                type: "Sample"
            },
            {
                input: 'nums = [1], k = 1',
                expectedOutput: '[1]',
                explanation: "",
                type: "Sample"
            }
        ],
        constraints: [
            "1 <= nums.length <= 10^5",
            "1 <= k <= nums.length"
        ]
    },
    {
        title: "N-Queen Problem",
        description: "The n-queens puzzle is the problem of placing n queens on an n x n chessboard such that no two queens attack each other. Given an integer n, return all distinct solutions to the n-queens puzzle. You may return the answer in any order. Each solution contains a distinct board configuration of the n-queens' placement, where 'Q' and '.' both indicate a queen and an empty space, respectively.",
        difficulty: "Hard",
        topics: ["Algorithms"],
        tags: ["leetcode", "backtracking"],
        testCases: [
            {
                input: 'n = 4',
                expectedOutput: '[[".Q..","...Q","Q...","..Q."],["..Q.","Q...","...Q",".Q.."]]',
                explanation: "There exist two distinct solutions to the 4-queens puzzle.",
                type: "Sample"
            },
            {
                input: 'n = 1',
                expectedOutput: '[["Q"]]',
                explanation: "",
                type: "Sample"
            }
        ],
        constraints: [
            "1 <= n <= 9"
        ]
    },
    {
        title: "Serialize and Deserialize a Binary Tree",
        description: "Serialization is the process of converting a data structure or object into a sequence of bits so that it can be stored in a file or memory buffer, or transmitted across a network connection link to be reconstructed later in the same or another computer environment. Design an algorithm to serialize and deserialize a binary tree. There is no restriction on how your serialization/deserialization algorithm should work. You just need to ensure that a binary tree can be serialized to a string and this string can be deserialized to the original tree structure.",
        difficulty: "Hard",
        topics: ["Data Structures", "Algorithms"],
        tags: ["leetcode", "tree", "design"],
        testCases: [
            {
                input: 'root = [1,2,3,null,null,4,5]',
                expectedOutput: '[1,2,3,null,null,4,5]',
                explanation: "",
                type: "Sample"
            },
            {
                input: 'root = []',
                expectedOutput: '[]',
                explanation: "",
                type: "Sample"
            }
        ],
        constraints: [
            "The number of nodes in the tree is in the range [0, 10^4]"
        ]
    },
    {
        title: "Wildcard Matching",
        description: "Given an input string (s) and a pattern (p), implement wildcard pattern matching with support for '?' and '*' where: '?' Matches any single character. '*' Matches any sequence of characters (including the empty sequence). The matching should cover the entire input string (not partial).",
        difficulty: "Hard",
        topics: ["Strings", "Algorithms"],
        tags: ["leetcode", "dynamic-programming", "greedy"],
        testCases: [
            {
                input: 's = "aa", p = "a"',
                expectedOutput: 'false',
                explanation: '"a" does not match the entire string "aa".',
                type: "Sample"
            },
            {
                input: 's = "aa", p = "*"',
                expectedOutput: 'true',
                explanation: '\'*\' matches any sequence.',
                type: "Sample"
            },
            {
                input: 's = "cb", p = "?a"',
                expectedOutput: 'false',
                explanation: '\'?\' matches \'c\', but the second letter is \'a\', which does not match \'b\'.',
                type: "Sample"
            }
        ],
        constraints: [
            "0 <= s.length, p.length <= 2000"
        ]
    },
    {
        title: "Chalkboard XOR Game",
        description: "You are given an array of integers nums represents the numbers written on a chalkboard. Alice and Bob take turns erasing exactly one number from the chalkboard, with Alice starting first. If erasing a number causes the bitwise XOR of all the elements of the chalkboard to become 0, then that player loses. The bitwise XOR of one element is that element itself, and the bitwise XOR of no elements is 0. Also, if any player starts their turn with the bitwise XOR of all the elements of the chalkboard equal to 0, then that player wins. Return true if and only if Alice wins the game, assuming both players play optimally.",
        difficulty: "Hard",
        topics: ["Brainteaser"],
        tags: ["leetcode", "math", "game-theory"],
        testCases: [
            {
                input: 'nums = [1,1,2]',
                expectedOutput: 'false',
                explanation: "Alice has two choices: erase 1 or erase 2. If she erases 1, the nums array becomes [1, 2]. The bitwise XOR of all the elements of the chalkboard is 1 XOR 2 = 3. Now Bob can remove any element he wants, because Alice will be the one to erase the last element and she will lose. If Alice erases 2 first, now nums become [1, 1]. The bitwise XOR of all the elements of the chalkboard is 1 XOR 1 = 0. Alice will lose.",
                type: "Sample"
            },
            {
                input: 'nums = [0,1]',
                expectedOutput: 'true',
                explanation: "Alice has two choices: erase 0 or erase 1. If she erases 0, the nums array becomes [1]. The bitwise XOR of all the elements of the chalkboard is 1. Now Bob will be the one to erase the last element and he will lose. If Alice erases 1 first, now nums become [0]. The bitwise XOR of all the elements of the chalkboard is 0. Alice will win.",
                type: "Sample"
            }
        ],
        constraints: [
            "1 <= nums.length <= 1000"
        ]
    },
    {
        title: "Trips and Users",
        description: "Given table Trips with columns id, client_id, driver_id, city_id, status (ENUM: 'completed', 'cancelled_by_driver', 'cancelled_by_client'), request_at (date), and table Users with columns users_id, banned (ENUM: 'Yes', 'No'), role (ENUM: 'client', 'driver', 'partner'). The cancellation rate is computed by dividing the number of canceled (by client or driver) requests with unbanned users by the total number of requests with unbanned users on that day. Write a solution to find the cancellation rate of requests with unbanned users (both client and driver must not be banned) each day between '2013-10-01' and '2013-10-03'. Round Cancellation Rate to two decimal points.",
        difficulty: "Hard",
        topics: ["Databases"],
        tags: ["leetcode", "sql", "database"],
        testCases: [
            {
                input: 'Trips table:\n+----+-----------+-----------+---------+---------------------+------------+\n| id | client_id | driver_id | city_id | status              | request_at |\n+----+-----------+-----------+---------+---------------------+------------+\n| 1  | 1         | 10        | 1       | completed           | 2013-10-01 |\n| 2  | 2         | 11        | 1       | cancelled_by_driver | 2013-10-01 |\n| 3  | 3         | 12        | 6       | completed           | 2013-10-01 |\n| 4  | 4         | 13        | 6       | cancelled_by_client | 2013-10-01 |\n| 5  | 1         | 10        | 1       | completed           | 2013-10-02 |\n| 6  | 2         | 11        | 6       | completed           | 2013-10-02 |\n| 7  | 3         | 12        | 6       | completed           | 2013-10-02 |\n| 8  | 2         | 12        | 12      | completed           | 2013-10-03 |\n| 9  | 3         | 10        | 12      | completed           | 2013-10-03 |\n| 10 | 4         | 13        | 12      | cancelled_by_driver | 2013-10-03 |\n+----+-----------+-----------+---------+---------------------+------------+\nUsers table:\n+----------+--------+--------+\n| users_id | banned | role   |\n+----------+--------+--------+\n| 1        | No     | client |\n| 2        | Yes    | client |\n| 3        | No     | client |\n| 4        | No     | client |\n| 10       | No     | driver |\n| 11       | No     | driver |\n| 12       | No     | driver |\n| 13       | No     | driver |\n+----------+--------+--------+',
                expectedOutput: '+------------+-------------------+\n| Day        | Cancellation Rate |\n+------------+-------------------+\n| 2013-10-01 | 0.33              |\n| 2013-10-02 | 0.00              |\n| 2013-10-03 | 0.50              |\n+------------+-------------------+',
                explanation: "On 2013-10-01: There were 4 requests in total, 2 of which were canceled. However, the request with Id=2 was made by a banned client (User_Id=2), so it is ignored in the calculation. Hence there are 3 unbanned requests in total, 1 of which was canceled. The Cancellation Rate is (1 / 3) = 0.33",
                type: "Sample"
            }
        ],
        constraints: []
    }
];

/**
 * Connect to MongoDB and seed the database
 */
const seedDatabase = async () => {
    try {
        // Connect to MongoDB
        const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/questiondb';
        await mongoose.connect(mongoURI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });

        console.log('Connected to MongoDB');

        // Clear existing questions (optional - comment out if you want to keep existing data)
        await Question.deleteMany({});
        console.log('Cleared existing questions');

        // Insert sample questions
        const result = await Question.insertMany(sampleQuestions);
        console.log(`✅ Successfully seeded ${result.length} questions!`);

        // Display summary
        const easy = result.filter(q => q.difficulty === 'Easy').length;
        const medium = result.filter(q => q.difficulty === 'Medium').length;
        const hard = result.filter(q => q.difficulty === 'Hard').length;

        console.log('\n📊 Seed Summary:');
        console.log(`   Easy: ${easy} questions`);
        console.log(`   Medium: ${medium} questions`);
        console.log(`   Hard: ${hard} questions`);
        console.log(`   Total: ${result.length} questions`);

        // Close connection
        await mongoose.connection.close();
        console.log('\n✅ Database seeding completed successfully!');
        process.exit(0);

    } catch (error) {
        console.error('❌ Error seeding database:', error);
        process.exit(1);
    }
};

// Run the seed function
seedDatabase();

