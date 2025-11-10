const mongoose = require('mongoose');
const Question = require('../models/question-model');
require('dotenv').config();

/**
 * Seed Script for Question Service
 * Populates the database with 60+ sample LeetCode questions
 * Test cases use simplified format: params array and expected value
 */

const sampleQuestions = [
  // ==================== EASY QUESTIONS ====================

  // STRINGS - EASY
  {
    title: 'Reverse String',
    description:
      'Write a function that reverses a string. The input string is given as an array of characters s. You must do this by modifying the input array in-place with O(1) extra memory.',
    difficulty: 'Easy',
    topics: ['Strings', 'Algorithms'],
    tags: ['leetcode', 'two-pointers'],
    testCases: [
      {
        params: [['h', 'e', 'l', 'l', 'o']],
        expected: ['o', 'l', 'l', 'e', 'h'],
        explanation: 'Reverse the array of characters',
        type: 'Sample',
      },
      {
        params: [['H', 'a', 'n', 'n', 'a', 'h']],
        expected: ['h', 'a', 'n', 'n', 'a', 'H'],
        explanation: 'Reverse the array of characters',
        type: 'Sample',
      },
    ],
    constraints: ['1 <= s.length <= 10^5', 's[i] is a printable ascii character.'],
  },
  {
    title: 'Valid Palindrome',
    description:
      'A phrase is a palindrome if, after converting all uppercase letters into lowercase letters and removing all non-alphanumeric characters, it reads the same forward and backward. Given a string s, return true if it is a palindrome, or false otherwise.',
    difficulty: 'Easy',
    topics: ['Strings', 'Algorithms'],
    tags: ['leetcode', 'two-pointers', 'string'],
    testCases: [
      {
        params: ['A man, a plan, a canal: Panama'],
        expected: true,
        explanation: 'After removing non-alphanumeric characters: "amanaplanacanalpanama" is a palindrome',
        type: 'Sample',
      },
      {
        params: ['race a car'],
        expected: false,
        explanation: '"raceacar" is not a palindrome',
        type: 'Sample',
      },
      {
        params: [' '],
        expected: true,
        explanation: 'Empty string after removing non-alphanumeric is considered palindrome',
        type: 'Sample',
      },
    ],
    constraints: ['1 <= s.length <= 2 * 10^5'],
  },

  // ARRAYS - EASY
  {
    title: 'Two Sum',
    description:
      'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target. You may assume that each input would have exactly one solution, and you may not use the same element twice.',
    difficulty: 'Easy',
    topics: ['Arrays', 'Algorithms'],
    tags: ['leetcode', 'hash-table', 'array'],
    testCases: [
      {
        params: [[2, 7, 11, 15], 9],
        expected: [0, 1],
        explanation: 'Because nums[0] + nums[1] == 9, we return [0, 1]',
        type: 'Sample',
      },
      {
        params: [[3, 2, 4], 6],
        expected: [1, 2],
        explanation: 'Because nums[1] + nums[2] == 6, we return [1, 2]',
        type: 'Sample',
      },
      {
        params: [[3, 3], 6],
        expected: [0, 1],
        explanation: 'Because nums[0] + nums[1] == 6, we return [0, 1]',
        type: 'Sample',
      },
    ],
    constraints: ['2 <= nums.length <= 10^4', '-10^9 <= nums[i] <= 10^9', 'Only one valid answer exists'],
  },
  {
    title: 'Best Time to Buy and Sell Stock',
    description:
      'You are given an array prices where prices[i] is the price of a given stock on the ith day. You want to maximize your profit by choosing a single day to buy one stock and choosing a different day in the future to sell that stock. Return the maximum profit you can achieve from this transaction. If you cannot achieve any profit, return 0.',
    difficulty: 'Easy',
    topics: ['Arrays', 'Algorithms'],
    tags: ['leetcode', 'array', 'dynamic-programming'],
    testCases: [
      {
        params: [[7, 1, 5, 3, 6, 4]],
        expected: 5,
        explanation: 'Buy on day 2 (price = 1) and sell on day 5 (price = 6), profit = 6-1 = 5',
        type: 'Sample',
      },
      {
        params: [[7, 6, 4, 3, 1]],
        expected: 0,
        explanation: 'No transactions are done and the max profit = 0',
        type: 'Sample',
      },
    ],
    constraints: ['1 <= prices.length <= 10^5', '0 <= prices[i] <= 10^4'],
  },

  // DATA STRUCTURES - EASY
  {
    title: 'Linked List Cycle Detection',
    description:
      'Given head, the head of a linked list, determine if the linked list has a cycle in it. Return true if there is a cycle, false otherwise.',
    difficulty: 'Easy',
    topics: ['Data Structures', 'Algorithms'],
    tags: ['leetcode', 'linked-list', 'two-pointers'],
    testCases: [
      {
        params: [[3, 2, 0, -4], 1],
        expected: true,
        explanation: 'There is a cycle in the linked list, where the tail connects to the 1st node (0-indexed)',
        type: 'Sample',
      },
      {
        params: [[1, 2], 0],
        expected: true,
        explanation: 'There is a cycle in the linked list, where the tail connects to the 0th node',
        type: 'Sample',
      },
      {
        params: [[1], -1],
        expected: false,
        explanation: 'There is no cycle in the linked list',
        type: 'Sample',
      },
    ],
    constraints: ['The number of nodes in the list is in the range [0, 10^4]', '-10^5 <= Node.val <= 10^5'],
  },
  {
    title: 'Implement Stack using Queues',
    description:
      'Implement a last-in-first-out (LIFO) stack using only two queues. The implemented stack should support all the functions of a normal stack (push, top, pop, and empty).',
    difficulty: 'Easy',
    topics: ['Data Structures'],
    tags: ['leetcode', 'stack', 'queue', 'design'],
    testCases: [
      {
        params: [['MyStack', 'push', 'push', 'top', 'pop', 'empty'], [[], [1], [2], [], [], []]],
        expected: [null, null, null, 2, 2, false],
        explanation: 'Implement stack operations using queues',
        type: 'Sample',
      },
    ],
    constraints: ['1 <= x <= 9', 'At most 100 calls will be made to push, pop, top, and empty'],
  },

  // ALGORITHMS - EASY
  {
    title: 'Roman to Integer',
    description:
      'Roman numerals are represented by seven different symbols: I, V, X, L, C, D and M. Given a roman numeral, convert it to an integer.',
    difficulty: 'Easy',
    topics: ['Algorithms'],
    tags: ['leetcode', 'hash-table', 'math', 'string'],
    testCases: [
      {
        params: ['III'],
        expected: 3,
        explanation: 'III = 3',
        type: 'Sample',
      },
      {
        params: ['LVIII'],
        expected: 58,
        explanation: 'L = 50, V= 5, III = 3',
        type: 'Sample',
      },
      {
        params: ['MCMXCIV'],
        expected: 1994,
        explanation: 'M = 1000, CM = 900, XC = 90 and IV = 4',
        type: 'Sample',
      },
    ],
    constraints: ['1 <= s.length <= 15', "s contains only the characters ('I', 'V', 'X', 'L', 'C', 'D', 'M')"],
  },
  {
    title: 'Valid Parentheses',
    description:
      "Given a string s containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid. An input string is valid if: Open brackets must be closed by the same type of brackets, and open brackets must be closed in the correct order.",
    difficulty: 'Easy',
    topics: ['Algorithms', 'Data Structures'],
    tags: ['leetcode', 'stack', 'string'],
    testCases: [
      {
        params: ['()'],
        expected: true,
        explanation: 'Valid parentheses',
        type: 'Sample',
      },
      {
        params: ['()[]{}'],
        expected: true,
        explanation: 'All brackets are properly closed',
        type: 'Sample',
      },
      {
        params: ['(]'],
        expected: false,
        explanation: 'Mismatched brackets',
        type: 'Sample',
      },
    ],
    constraints: ['1 <= s.length <= 10^4'],
  },

  // BIT MANIPULATION - EASY
  {
    title: 'Add Binary',
    description: 'Given two binary strings a and b, return their sum as a binary string.',
    difficulty: 'Easy',
    topics: ['Bit Manipulation', 'Algorithms'],
    tags: ['leetcode', 'math', 'string', 'bit-manipulation'],
    testCases: [
      {
        params: ['11', '1'],
        expected: '100',
        explanation: '11 + 1 = 100 in binary',
        type: 'Sample',
      },
      {
        params: ['1010', '1011'],
        expected: '10101',
        explanation: '1010 + 1011 = 10101 in binary',
        type: 'Sample',
      },
    ],
    constraints: ['1 <= a.length, b.length <= 10^4', "a and b consist only of '0' or '1' characters"],
  },
  {
    title: 'Number of 1 Bits',
    description:
      'Write a function that takes an unsigned integer and returns the number of 1 bits it has (also known as the Hamming weight).',
    difficulty: 'Easy',
    topics: ['Bit Manipulation', 'Algorithms'],
    tags: ['leetcode', 'bit-manipulation'],
    testCases: [
      {
        params: [11],
        expected: 3,
        explanation: 'The binary representation of 11 is 1011, which has three 1 bits',
        type: 'Sample',
      },
      {
        params: [128],
        expected: 1,
        explanation: 'The binary representation of 128 is 10000000, which has one 1 bit',
        type: 'Sample',
      },
      {
        params: [7],
        expected: 3,
        explanation: 'The binary representation of 7 is 111, which has three 1 bits',
        type: 'Sample',
      },
    ],
    constraints: ['The input must be a binary string of length 32'],
  },

  // RECURSION - EASY
  {
    title: 'Fibonacci Number',
    description:
      'The Fibonacci numbers form a sequence where each number is the sum of the two preceding ones, starting from 0 and 1. Given n, calculate F(n).',
    difficulty: 'Easy',
    topics: ['Recursion', 'Algorithms'],
    tags: ['leetcode', 'dynamic-programming', 'math', 'recursion'],
    testCases: [
      {
        params: [2],
        expected: 1,
        explanation: 'F(2) = F(1) + F(0) = 1 + 0 = 1',
        type: 'Sample',
      },
      {
        params: [3],
        expected: 2,
        explanation: 'F(3) = F(2) + F(1) = 1 + 1 = 2',
        type: 'Sample',
      },
      {
        params: [4],
        expected: 3,
        explanation: 'F(4) = F(3) + F(2) = 2 + 1 = 3',
        type: 'Sample',
      },
    ],
    constraints: ['0 <= n <= 30'],
  },
  {
    title: 'Climbing Stairs',
    description:
      'You are climbing a staircase. It takes n steps to reach the top. Each time you can either climb 1 or 2 steps. In how many distinct ways can you climb to the top?',
    difficulty: 'Easy',
    topics: ['Recursion', 'Algorithms'],
    tags: ['leetcode', 'dynamic-programming', 'math'],
    testCases: [
      {
        params: [2],
        expected: 2,
        explanation: 'There are two ways: 1+1 or 2',
        type: 'Sample',
      },
      {
        params: [3],
        expected: 3,
        explanation: 'There are three ways: 1+1+1, 1+2, or 2+1',
        type: 'Sample',
      },
    ],
    constraints: ['1 <= n <= 45'],
  },

  // DATABASES - EASY
  {
    title: 'Combine Two Tables',
    description:
      'Write a SQL query to report the first name, last name, city, and state of each person in the Person table. If the address of a personId is not present in the Address table, report null instead.',
    difficulty: 'Easy',
    topics: ['Databases'],
    tags: ['leetcode', 'sql', 'database'],
    testCases: [
      {
        params: [
          {
            Person: [
              { personId: 1, lastName: 'Wang', firstName: 'Allen' },
              { personId: 2, lastName: 'Alice', firstName: 'Bob' },
            ],
            Address: [
              { addressId: 1, personId: 2, city: 'New York City', state: 'New York' },
              { addressId: 2, personId: 3, city: 'Leetcode', state: 'California' },
            ],
          },
        ],
        expected: [
          { firstName: 'Allen', lastName: 'Wang', city: null, state: null },
          { firstName: 'Bob', lastName: 'Alice', city: 'New York City', state: 'New York' },
        ],
        explanation: 'Person with personId=1 has no address in the Address table',
        type: 'Sample',
      },
    ],
    constraints: [],
  },
  {
    title: 'Duplicate Emails',
    description:
      'Write a SQL query to report all the duplicate emails. Return the result table in any order.',
    difficulty: 'Easy',
    topics: ['Databases'],
    tags: ['leetcode', 'sql', 'database'],
    testCases: [
      {
        params: [
          {
            Person: [
              { id: 1, email: 'a@b.com' },
              { id: 2, email: 'c@d.com' },
              { id: 3, email: 'a@b.com' },
            ],
          },
        ],
        expected: [{ email: 'a@b.com' }],
        explanation: 'a@b.com appears twice',
        type: 'Sample',
      },
    ],
    constraints: [],
  },

  // BRAINTEASER - EASY
  {
    title: 'Nim Game',
    description:
      'You are playing the following Nim Game with your friend: Initially, there is a heap of stones on the table. You and your friend will alternate taking turns, and you go first. On each turn, the person whose turn it is will remove 1 to 3 stones from the heap. The one who removes the last stone is the winner. Given n, the number of stones in the heap, return true if you can win the game assuming both you and your friend play optimally, otherwise return false.',
    difficulty: 'Easy',
    topics: ['Brainteaser'],
    tags: ['leetcode', 'math', 'brainteaser', 'game-theory'],
    testCases: [
      {
        params: [4],
        expected: false,
        explanation:
          'These are the possible outcomes: 1. You remove 1 stone. Your friend removes 3 stones, including the last stone. Your friend wins. 2. You remove 2 stones. Your friend removes 2 stones, including the last stone. Your friend wins. 3. You remove 3 stones. Your friend removes the last stone. Your friend wins. In all outcomes, your friend wins.',
        type: 'Sample',
      },
      {
        params: [1],
        expected: true,
        explanation: 'You can remove the last stone and win',
        type: 'Sample',
      },
      {
        params: [2],
        expected: true,
        explanation: 'You can remove 2 stones and win',
        type: 'Sample',
      },
    ],
    constraints: ['1 <= n <= 2^31 - 1'],
  },
  {
    title: 'Power of Two',
    description:
      'Given an integer n, return true if it is a power of two. Otherwise, return false. An integer n is a power of two, if there exists an integer x such that n == 2^x.',
    difficulty: 'Easy',
    topics: ['Brainteaser'],
    tags: ['leetcode', 'math', 'bit-manipulation', 'recursion'],
    testCases: [
      {
        params: [1],
        expected: true,
        explanation: '2^0 = 1',
        type: 'Sample',
      },
      {
        params: [16],
        expected: true,
        explanation: '2^4 = 16',
        type: 'Sample',
      },
      {
        params: [3],
        expected: false,
        explanation: '3 is not a power of two',
        type: 'Sample',
      },
    ],
    constraints: ['-2^31 <= n <= 2^31 - 1'],
  },

  // ==================== MEDIUM QUESTIONS ====================

  // STRINGS - MEDIUM
  {
    title: 'Longest Substring Without Repeating Characters',
    description:
      'Given a string s, find the length of the longest substring without repeating characters.',
    difficulty: 'Medium',
    topics: ['Strings', 'Algorithms'],
    tags: ['leetcode', 'hash-table', 'string', 'sliding-window'],
    testCases: [
      {
        params: ['abcabcbb'],
        expected: 3,
        explanation: 'The answer is "abc", with the length of 3',
        type: 'Sample',
      },
      {
        params: ['bbbbb'],
        expected: 1,
        explanation: 'The answer is "b", with the length of 1',
        type: 'Sample',
      },
      {
        params: ['pwwkew'],
        expected: 3,
        explanation: 'The answer is "wke", with the length of 3',
        type: 'Sample',
      },
    ],
    constraints: ['0 <= s.length <= 5 * 10^4'],
  },
  {
    title: 'Longest Common Subsequence',
    description:
      'Given two strings text1 and text2, return the length of their longest common subsequence. If there is no common subsequence, return 0.',
    difficulty: 'Medium',
    topics: ['Strings', 'Algorithms'],
    tags: ['leetcode', 'dynamic-programming', 'string'],
    testCases: [
      {
        params: ['abcde', 'ace'],
        expected: 3,
        explanation: 'The longest common subsequence is "ace" and its length is 3',
        type: 'Sample',
      },
      {
        params: ['abc', 'abc'],
        expected: 3,
        explanation: 'The longest common subsequence is "abc" and its length is 3',
        type: 'Sample',
      },
      {
        params: ['abc', 'def'],
        expected: 0,
        explanation: 'There is no such common subsequence, so the result is 0',
        type: 'Sample',
      },
    ],
    constraints: ['1 <= text1.length, text2.length <= 1000'],
  },

  // ARRAYS - MEDIUM
  {
    title: 'Rotate Image',
    description:
      'You are given an n x n 2D matrix representing an image, rotate the image by 90 degrees (clockwise). You have to rotate the image in-place.',
    difficulty: 'Medium',
    topics: ['Arrays', 'Algorithms'],
    tags: ['leetcode', 'array', 'matrix'],
    testCases: [
      {
        params: [
          [
            [1, 2, 3],
            [4, 5, 6],
            [7, 8, 9],
          ],
        ],
        expected: [
          [7, 4, 1],
          [8, 5, 2],
          [9, 6, 3],
        ],
        explanation: 'Rotate the matrix 90 degrees clockwise',
        type: 'Sample',
      },
      {
        params: [
          [
            [5, 1, 9, 11],
            [2, 4, 8, 10],
            [13, 3, 6, 7],
            [15, 14, 12, 16],
          ],
        ],
        expected: [
          [15, 13, 2, 5],
          [14, 3, 4, 1],
          [12, 6, 8, 9],
          [16, 7, 10, 11],
        ],
        explanation: 'Rotate the 4x4 matrix 90 degrees clockwise',
        type: 'Sample',
      },
    ],
    constraints: ['n == matrix.length == matrix[i].length', '1 <= n <= 20'],
  },
  {
    title: 'Product of Array Except Self',
    description:
      'Given an integer array nums, return an array answer such that answer[i] is equal to the product of all the elements of nums except nums[i]. You must write an algorithm that runs in O(n) time and without using the division operation.',
    difficulty: 'Medium',
    topics: ['Arrays', 'Algorithms'],
    tags: ['leetcode', 'array', 'prefix-sum'],
    testCases: [
      {
        params: [[1, 2, 3, 4]],
        expected: [24, 12, 8, 6],
        explanation: 'Output[0] = 2*3*4 = 24, Output[1] = 1*3*4 = 12, etc.',
        type: 'Sample',
      },
      {
        params: [[-1, 1, 0, -3, 3]],
        expected: [0, 0, 9, 0, 0],
        explanation: 'Product of all except self',
        type: 'Sample',
      },
    ],
    constraints: ['2 <= nums.length <= 10^5', '-30 <= nums[i] <= 30'],
  },

  // DATA STRUCTURES - MEDIUM
  {
    title: 'Course Schedule',
    description:
      'There are a total of numCourses courses you have to take, labeled from 0 to numCourses - 1. You are given an array prerequisites where prerequisites[i] = [ai, bi] indicates that you must take course bi first if you want to take course ai. Return true if you can finish all courses.',
    difficulty: 'Medium',
    topics: ['Data Structures', 'Algorithms'],
    tags: ['leetcode', 'graph', 'topological-sort', 'dfs'],
    testCases: [
      {
        params: [2, [[1, 0]]],
        expected: true,
        explanation: 'To take course 1 you should have finished course 0. So it is possible',
        type: 'Sample',
      },
      {
        params: [2, [[1, 0], [0, 1]]],
        expected: false,
        explanation: 'Circular dependency - impossible to finish',
        type: 'Sample',
      },
    ],
    constraints: ['1 <= numCourses <= 2000', '0 <= prerequisites.length <= 5000'],
  },
  {
    title: 'LRU Cache Design',
    description:
      'Design a data structure that follows the constraints of a Least Recently Used (LRU) cache. Implement the LRUCache class with get and put methods.',
    difficulty: 'Medium',
    topics: ['Data Structures'],
    tags: ['leetcode', 'hash-table', 'linked-list', 'design'],
    testCases: [
      {
        params: [
          ['LRUCache', 'put', 'put', 'get', 'put', 'get', 'put', 'get', 'get', 'get'],
          [[2], [1, 1], [2, 2], [1], [3, 3], [2], [4, 4], [1], [3], [4]],
        ],
        expected: [null, null, null, 1, null, -1, null, -1, 3, 4],
        explanation: 'LRU cache operations',
        type: 'Sample',
      },
    ],
    constraints: ['1 <= capacity <= 3000', '0 <= key <= 10^4'],
  },

  // ALGORITHMS - MEDIUM
  {
    title: 'Repeated DNA Sequences',
    description:
      'Given a string s that represents a DNA sequence, return all the 10-letter-long sequences (substrings) that occur more than once in a DNA molecule.',
    difficulty: 'Medium',
    topics: ['Algorithms', 'Bit Manipulation'],
    tags: ['leetcode', 'hash-table', 'string', 'sliding-window'],
    testCases: [
      {
        params: ['AAAAACCCCCAAAAACCCCCCAAAAAGGGTTT'],
        expected: ['AAAAACCCCC', 'CCCCCAAAAA'],
        explanation: 'These 10-letter sequences appear more than once',
        type: 'Sample',
      },
      {
        params: ['AAAAAAAAAAAAA'],
        expected: ['AAAAAAAAAA'],
        explanation: 'The sequence AAAAAAAAAA appears multiple times',
        type: 'Sample',
      },
    ],
    constraints: ['1 <= s.length <= 10^5', "s[i] is either 'A', 'C', 'G', or 'T'"],
  },
  {
    title: 'Container With Most Water',
    description:
      'You are given an integer array height of length n. There are n vertical lines drawn such that the two endpoints of the ith line are (i, 0) and (i, height[i]). Find two lines that together with the x-axis form a container that contains the most water.',
    difficulty: 'Medium',
    topics: ['Algorithms', 'Arrays'],
    tags: ['leetcode', 'array', 'two-pointers', 'greedy'],
    testCases: [
      {
        params: [[1, 8, 6, 2, 5, 4, 8, 3, 7]],
        expected: 49,
        explanation: 'The vertical lines at indices 1 and 8 form a container with area 7*7=49',
        type: 'Sample',
      },
      {
        params: [[1, 1]],
        expected: 1,
        explanation: 'The only container has area 1*1=1',
        type: 'Sample',
      },
    ],
    constraints: ['n == height.length', '2 <= n <= 10^5'],
  },

  // BIT MANIPULATION - MEDIUM
  {
    title: 'Single Number II',
    description:
      'Given an integer array nums where every element appears three times except for one, which appears exactly once. Find the single element and return it.',
    difficulty: 'Medium',
    topics: ['Bit Manipulation', 'Algorithms'],
    tags: ['leetcode', 'bit-manipulation', 'array'],
    testCases: [
      {
        params: [[2, 2, 3, 2]],
        expected: 3,
        explanation: '3 appears once while 2 appears three times',
        type: 'Sample',
      },
      {
        params: [[0, 1, 0, 1, 0, 1, 99]],
        expected: 99,
        explanation: '99 appears once',
        type: 'Sample',
      },
    ],
    constraints: ['1 <= nums.length <= 3 * 10^4', '-2^31 <= nums[i] <= 2^31 - 1'],
  },
  {
    title: 'Bitwise AND of Numbers Range',
    description:
      'Given two integers left and right that represent the range [left, right], return the bitwise AND of all numbers in this range, inclusive.',
    difficulty: 'Medium',
    topics: ['Bit Manipulation', 'Algorithms'],
    tags: ['leetcode', 'bit-manipulation'],
    testCases: [
      {
        params: [5, 7],
        expected: 4,
        explanation: '5 & 6 & 7 = 4',
        type: 'Sample',
      },
      {
        params: [0, 0],
        expected: 0,
        explanation: '0 & 0 = 0',
        type: 'Sample',
      },
      {
        params: [1, 2147483647],
        expected: 0,
        explanation: 'Range is too large, result is 0',
        type: 'Sample',
      },
    ],
    constraints: ['0 <= left <= right <= 2^31 - 1'],
  },

  // RECURSION - MEDIUM
  {
    title: 'Generate Parentheses',
    description:
      'Given n pairs of parentheses, write a function to generate all combinations of well-formed parentheses.',
    difficulty: 'Medium',
    topics: ['Recursion', 'Algorithms'],
    tags: ['leetcode', 'string', 'backtracking', 'recursion'],
    testCases: [
      {
        params: [3],
        expected: ['((()))', '(()())', '(())()', '()(())', '()()()'],
        explanation: 'All possible combinations of 3 pairs of parentheses',
        type: 'Sample',
      },
      {
        params: [1],
        expected: ['()'],
        explanation: 'Only one combination possible',
        type: 'Sample',
      },
    ],
    constraints: ['1 <= n <= 8'],
  },
  {
    title: 'Letter Combinations of a Phone Number',
    description:
      'Given a string containing digits from 2-9 inclusive, return all possible letter combinations that the number could represent (like on a phone keypad).',
    difficulty: 'Medium',
    topics: ['Recursion', 'Algorithms'],
    tags: ['leetcode', 'string', 'backtracking', 'recursion'],
    testCases: [
      {
        params: ['23'],
        expected: ['ad', 'ae', 'af', 'bd', 'be', 'bf', 'cd', 'ce', 'cf'],
        explanation: 'All possible letter combinations from digits 2 and 3',
        type: 'Sample',
      },
      {
        params: [''],
        expected: [],
        explanation: 'Empty input returns empty array',
        type: 'Sample',
      },
      {
        params: ['2'],
        expected: ['a', 'b', 'c'],
        explanation: 'Digit 2 maps to abc',
        type: 'Sample',
      },
    ],
    constraints: ['0 <= digits.length <= 4'],
  },

  // BRAINTEASER - MEDIUM
  {
    title: 'Airplane Seat Assignment Probability',
    description:
      'n passengers board an airplane with exactly n seats. The first passenger has lost the ticket and picks a seat randomly. Return the probability that the nth person gets his own seat.',
    difficulty: 'Medium',
    topics: ['Brainteaser'],
    tags: ['leetcode', 'math', 'probability', 'brainteaser'],
    testCases: [
      {
        params: [1],
        expected: 1.0,
        explanation: 'The first person can only get the first seat',
        type: 'Sample',
      },
      {
        params: [2],
        expected: 0.5,
        explanation: 'The second person has a probability of 0.5 to get their seat',
        type: 'Sample',
      },
    ],
    constraints: ['1 <= n <= 10^5'],
  },
  {
    title: 'Bulb Switcher',
    description:
      'There are n bulbs that are initially off. You first turn on all the bulbs, then you turn off every second bulb. On the third round, you toggle every third bulb. For the ith round, you toggle every i bulb. Return the number of bulbs that are on after n rounds.',
    difficulty: 'Medium',
    topics: ['Brainteaser'],
    tags: ['leetcode', 'math', 'brainteaser'],
    testCases: [
      {
        params: [3],
        expected: 1,
        explanation: 'After 3 rounds, only bulb 1 is on',
        type: 'Sample',
      },
      {
        params: [0],
        expected: 0,
        explanation: 'No bulbs',
        type: 'Sample',
      },
      {
        params: [1],
        expected: 1,
        explanation: 'Only one bulb, turned on in round 1',
        type: 'Sample',
      },
    ],
    constraints: ['0 <= n <= 10^9'],
  },

  // DATABASES - MEDIUM
  {
    title: 'Rank Scores',
    description:
      'Write a SQL query to rank scores. If there is a tie between two scores, both should have the same ranking. Note that after a tie, the next ranking number should be the next consecutive integer value.',
    difficulty: 'Medium',
    topics: ['Databases'],
    tags: ['leetcode', 'sql', 'database'],
    testCases: [
      {
        params: [
          {
            Scores: [
              { id: 1, score: 3.5 },
              { id: 2, score: 3.65 },
              { id: 3, score: 4.0 },
              { id: 4, score: 3.85 },
              { id: 5, score: 4.0 },
              { id: 6, score: 3.65 },
            ],
          },
        ],
        expected: [
          { score: 4.0, rank: 1 },
          { score: 4.0, rank: 1 },
          { score: 3.85, rank: 2 },
          { score: 3.65, rank: 3 },
          { score: 3.65, rank: 3 },
          { score: 3.5, rank: 4 },
        ],
        explanation: 'Rank scores with ties getting same rank',
        type: 'Sample',
      },
    ],
    constraints: [],
  },
  {
    title: 'Department Highest Salary',
    description:
      'Write a SQL query to find employees who have the highest salary in each of the departments.',
    difficulty: 'Medium',
    topics: ['Databases'],
    tags: ['leetcode', 'sql', 'database'],
    testCases: [
      {
        params: [
          {
            Employee: [
              { id: 1, name: 'Joe', salary: 70000, departmentId: 1 },
              { id: 2, name: 'Jim', salary: 90000, departmentId: 1 },
              { id: 3, name: 'Henry', salary: 80000, departmentId: 2 },
              { id: 4, name: 'Sam', salary: 60000, departmentId: 2 },
            ],
            Department: [
              { id: 1, name: 'IT' },
              { id: 2, name: 'Sales' },
            ],
          },
        ],
        expected: [
          { department: 'IT', employee: 'Jim', salary: 90000 },
          { department: 'Sales', employee: 'Henry', salary: 80000 },
        ],
        explanation: 'Highest salary in each department',
        type: 'Sample',
      },
    ],
    constraints: [],
  },

  // ==================== HARD QUESTIONS ====================

  // STRINGS - HARD
  {
    title: 'Wildcard Matching',
    description:
      "Given an input string (s) and a pattern (p), implement wildcard pattern matching with support for '?' and '*' where '?' matches any single character and '*' matches any sequence of characters.",
    difficulty: 'Hard',
    topics: ['Strings', 'Algorithms'],
    tags: ['leetcode', 'dynamic-programming', 'greedy', 'string'],
    testCases: [
      {
        params: ['aa', 'a'],
        expected: false,
        explanation: '"a" does not match the entire string "aa"',
        type: 'Sample',
      },
      {
        params: ['aa', '*'],
        expected: true,
        explanation: "'*' matches any sequence",
        type: 'Sample',
      },
      {
        params: ['cb', '?a'],
        expected: false,
        explanation: "'?' matches 'c', but the second letter is 'a', which does not match 'b'",
        type: 'Sample',
      },
    ],
    constraints: ['0 <= s.length, p.length <= 2000'],
  },
  {
    title: 'Regular Expression Matching',
    description:
      "Given an input string s and a pattern p, implement regular expression matching with support for '.' and '*' where '.' matches any single character and '*' matches zero or more of the preceding element.",
    difficulty: 'Hard',
    topics: ['Strings', 'Algorithms'],
    tags: ['leetcode', 'dynamic-programming', 'string', 'recursion'],
    testCases: [
      {
        params: ['aa', 'a'],
        expected: false,
        explanation: '"a" does not match the entire string "aa"',
        type: 'Sample',
      },
      {
        params: ['aa', 'a*'],
        expected: true,
        explanation: "'*' means zero or more of the preceding element 'a'",
        type: 'Sample',
      },
      {
        params: ['ab', '.*'],
        expected: true,
        explanation: "'.*' means zero or more of any character",
        type: 'Sample',
      },
    ],
    constraints: ['1 <= s.length <= 20', '1 <= p.length <= 30'],
  },

  // ARRAYS - HARD
  {
    title: 'Sliding Window Maximum',
    description:
      'You are given an array of integers nums and a sliding window of size k. Return the max sliding window as the window moves from left to right.',
    difficulty: 'Hard',
    topics: ['Arrays', 'Algorithms'],
    tags: ['leetcode', 'array', 'queue', 'sliding-window', 'heap'],
    testCases: [
      {
        params: [[1, 3, -1, -3, 5, 3, 6, 7], 3],
        expected: [3, 3, 5, 5, 6, 7],
        explanation: 'Maximum of each window of size 3',
        type: 'Sample',
      },
      {
        params: [[1], 1],
        expected: [1],
        explanation: 'Only one element',
        type: 'Sample',
      },
    ],
    constraints: ['1 <= nums.length <= 10^5', '1 <= k <= nums.length'],
  },
  {
    title: 'Median of Two Sorted Arrays',
    description:
      'Given two sorted arrays nums1 and nums2 of size m and n respectively, return the median of the two sorted arrays. The overall run time complexity should be O(log (m+n)).',
    difficulty: 'Hard',
    topics: ['Arrays', 'Algorithms'],
    tags: ['leetcode', 'array', 'binary-search', 'divide-and-conquer'],
    testCases: [
      {
        params: [[1, 3], [2]],
        expected: 2.0,
        explanation: 'Merged array = [1,2,3] and median is 2',
        type: 'Sample',
      },
      {
        params: [[1, 2], [3, 4]],
        expected: 2.5,
        explanation: 'Merged array = [1,2,3,4] and median is (2+3)/2 = 2.5',
        type: 'Sample',
      },
    ],
    constraints: ['nums1.length == m', 'nums2.length == n', '0 <= m <= 1000', '0 <= n <= 1000'],
  },

  // DATA STRUCTURES - HARD
  {
    title: 'Serialize and Deserialize Binary Tree',
    description:
      'Design an algorithm to serialize and deserialize a binary tree. Serialization is converting a tree to a string, and deserialization is converting the string back to the tree structure.',
    difficulty: 'Hard',
    topics: ['Data Structures', 'Algorithms'],
    tags: ['leetcode', 'tree', 'design', 'string', 'binary-tree'],
    testCases: [
      {
        params: [[1, 2, 3, null, null, 4, 5]],
        expected: [1, 2, 3, null, null, 4, 5],
        explanation: 'Serialize and deserialize should return the same tree',
        type: 'Sample',
      },
      {
        params: [[]],
        expected: [],
        explanation: 'Empty tree',
        type: 'Sample',
      },
    ],
    constraints: ['The number of nodes in the tree is in the range [0, 10^4]'],
  },
  {
    title: 'Design In-Memory File System',
    description:
      'Design a data structure that simulates an in-memory file system. Implement functions to create paths, list directory contents, read file contents, and write file contents.',
    difficulty: 'Hard',
    topics: ['Data Structures'],
    tags: ['leetcode', 'design', 'hash-table', 'trie', 'string'],
    testCases: [
      {
        params: [
          ['FileSystem', 'ls', 'mkdir', 'addContentToFile', 'ls', 'readContentFromFile'],
          [[], ['/'], ['/a/b/c'], ['/a/b/c/d', 'hello'], ['/'], ['/a/b/c/d']],
        ],
        expected: [null, [], null, null, ['a'], 'hello'],
        explanation: 'File system operations',
        type: 'Sample',
      },
    ],
    constraints: ['1 <= path.length <= 100'],
  },

  // ALGORITHMS - HARD
  {
    title: 'N-Queens Problem',
    description:
      "The n-queens puzzle is the problem of placing n queens on an n x n chessboard such that no two queens attack each other. Given an integer n, return all distinct solutions to the n-queens puzzle.",
    difficulty: 'Hard',
    topics: ['Algorithms'],
    tags: ['leetcode', 'backtracking', 'array'],
    testCases: [
      {
        params: [4],
        expected: [
          ['.Q..', '...Q', 'Q...', '..Q.'],
          ['..Q.', 'Q...', '...Q', '.Q..'],
        ],
        explanation: 'There exist two distinct solutions to the 4-queens puzzle',
        type: 'Sample',
      },
      {
        params: [1],
        expected: [['Q']],
        explanation: 'Only one solution for n=1',
        type: 'Sample',
      },
    ],
    constraints: ['1 <= n <= 9'],
  },
  {
    title: 'Word Ladder II',
    description:
      'Given two words, beginWord and endWord, and a dictionary wordList, return all the shortest transformation sequences from beginWord to endWord.',
    difficulty: 'Hard',
    topics: ['Algorithms'],
    tags: ['leetcode', 'hash-table', 'string', 'backtracking', 'bfs'],
    testCases: [
      {
        params: ['hit', 'cog', ['hot', 'dot', 'dog', 'lot', 'log', 'cog']],
        expected: [
          ['hit', 'hot', 'dot', 'dog', 'cog'],
          ['hit', 'hot', 'lot', 'log', 'cog'],
        ],
        explanation: 'Two shortest transformation sequences',
        type: 'Sample',
      },
      {
        params: ['hit', 'cog', ['hot', 'dot', 'dog', 'lot', 'log']],
        expected: [],
        explanation: 'No transformation sequence exists',
        type: 'Sample',
      },
    ],
    constraints: ['1 <= beginWord.length <= 5', 'endWord.length == beginWord.length'],
  },

  // BIT MANIPULATION - HARD
  {
    title: 'Maximum XOR of Two Numbers in an Array',
    description:
      'Given an integer array nums, return the maximum result of nums[i] XOR nums[j], where 0 <= i <= j < n.',
    difficulty: 'Hard',
    topics: ['Bit Manipulation', 'Algorithms'],
    tags: ['leetcode', 'bit-manipulation', 'trie', 'array'],
    testCases: [
      {
        params: [[3, 10, 5, 25, 2, 8]],
        expected: 28,
        explanation: 'The maximum result is 5 XOR 25 = 28',
        type: 'Sample',
      },
      {
        params: [[14, 70, 53, 83, 49, 91, 36, 80, 92, 51, 66, 70]],
        expected: 127,
        explanation: 'The maximum XOR result',
        type: 'Sample',
      },
    ],
    constraints: ['1 <= nums.length <= 2 * 10^5', '0 <= nums[i] <= 2^31 - 1'],
  },
  {
    title: 'Count Total Set Bits',
    description:
      'Given a positive integer n, count the total number of set bits in binary representation of all numbers from 1 to n.',
    difficulty: 'Hard',
    topics: ['Bit Manipulation', 'Algorithms'],
    tags: ['leetcode', 'bit-manipulation', 'math', 'dynamic-programming'],
    testCases: [
      {
        params: [3],
        expected: 4,
        explanation: 'Binary: 1(1), 10(1), 11(2) = total 4 set bits',
        type: 'Sample',
      },
      {
        params: [6],
        expected: 9,
        explanation: 'Binary: 1(1), 10(1), 11(2), 100(1), 101(2), 110(2) = total 9 set bits',
        type: 'Sample',
      },
    ],
    constraints: ['1 <= n <= 10^9'],
  },

  // RECURSION - HARD
  {
    title: 'Sudoku Solver',
    description:
      'Write a program to solve a Sudoku puzzle by filling the empty cells. A sudoku solution must satisfy all of the following rules: Each of the digits 1-9 must occur exactly once in each row, column, and 3x3 sub-box.',
    difficulty: 'Hard',
    topics: ['Recursion', 'Algorithms'],
    tags: ['leetcode', 'array', 'backtracking', 'matrix'],
    testCases: [
      {
        params: [
          [
            ['5', '3', '.', '.', '7', '.', '.', '.', '.'],
            ['6', '.', '.', '1', '9', '5', '.', '.', '.'],
            ['.', '9', '8', '.', '.', '.', '.', '6', '.'],
            ['8', '.', '.', '.', '6', '.', '.', '.', '3'],
            ['4', '.', '.', '8', '.', '3', '.', '.', '1'],
            ['7', '.', '.', '.', '2', '.', '.', '.', '6'],
            ['.', '6', '.', '.', '.', '.', '2', '8', '.'],
            ['.', '.', '.', '4', '1', '9', '.', '.', '5'],
            ['.', '.', '.', '.', '8', '.', '.', '7', '9'],
          ],
        ],
        expected: [
          [
            ['5', '3', '4', '6', '7', '8', '9', '1', '2'],
            ['6', '7', '2', '1', '9', '5', '3', '4', '8'],
            ['1', '9', '8', '3', '4', '2', '5', '6', '7'],
            ['8', '5', '9', '7', '6', '1', '4', '2', '3'],
            ['4', '2', '6', '8', '5', '3', '7', '9', '1'],
            ['7', '1', '3', '9', '2', '4', '8', '5', '6'],
            ['9', '6', '1', '5', '3', '7', '2', '8', '4'],
            ['2', '8', '7', '4', '1', '9', '6', '3', '5'],
            ['3', '4', '5', '2', '8', '6', '1', '7', '9'],
          ],
        ],
        explanation: 'Fill the empty cells to solve the Sudoku',
        type: 'Sample',
      },
    ],
    constraints: ['board.length == 9', 'board[i].length == 9'],
  },
  {
    title: 'Expression Add Operators',
    description:
      'Given a string num that contains only digits and an integer target, return all possibilities to insert the binary operators +, -, or * between the digits of num so that the resultant expression evaluates to the target value.',
    difficulty: 'Hard',
    topics: ['Recursion', 'Algorithms'],
    tags: ['leetcode', 'string', 'backtracking', 'math'],
    testCases: [
      {
        params: ['123', 6],
        expected: ['1*2*3', '1+2+3'],
        explanation: 'Both expressions evaluate to 6',
        type: 'Sample',
      },
      {
        params: ['232', 8],
        expected: ['2*3+2', '2+3*2'],
        explanation: 'Both expressions evaluate to 8',
        type: 'Sample',
      },
      {
        params: ['3456237490', 9191],
        expected: [],
        explanation: 'No valid expressions',
        type: 'Sample',
      },
    ],
    constraints: ['1 <= num.length <= 10', 'num consists of only digits'],
  },

  // BRAINTEASER - HARD
  {
    title: 'Chalkboard XOR Game',
    description:
      'You are given an array of integers nums. Alice and Bob take turns erasing exactly one number from the chalkboard, with Alice starting first. Return true if Alice wins the game, assuming both players play optimally.',
    difficulty: 'Hard',
    topics: ['Brainteaser'],
    tags: ['leetcode', 'math', 'game-theory', 'brainteaser'],
    testCases: [
      {
        params: [[1, 1, 2]],
        expected: false,
        explanation: 'Alice loses with optimal play',
        type: 'Sample',
      },
      {
        params: [[0, 1]],
        expected: true,
        explanation: 'Alice wins',
        type: 'Sample',
      },
    ],
    constraints: ['1 <= nums.length <= 1000'],
  },
  {
    title: 'Cat and Mouse',
    description:
      'A game on an undirected graph is played by two players, Mouse and Cat, who alternate turns. Return 1 if the mouse wins the game, 2 if the cat wins, or 0 if the game is a draw.',
    difficulty: 'Hard',
    topics: ['Brainteaser'],
    tags: ['leetcode', 'graph', 'topological-sort', 'game-theory'],
    testCases: [
      {
        params: [[[2, 5], [3], [0, 4, 5], [1, 4, 5], [2, 3], [0, 2, 3]]],
        expected: 0,
        explanation: 'The game ends in a draw',
        type: 'Sample',
      },
      {
        params: [[[1, 3], [0], [3], [0, 2]]],
        expected: 1,
        explanation: 'Mouse wins',
        type: 'Sample',
      },
    ],
    constraints: ['3 <= graph.length <= 50'],
  },

  // DATABASES - HARD
  {
    title: 'Trips and Users',
    description:
      'Write a SQL query to find the cancellation rate of requests with unbanned users (both client and driver must not be banned) each day between "2013-10-01" and "2013-10-03". Round the cancellation rate to two decimal points.',
    difficulty: 'Hard',
    topics: ['Databases'],
    tags: ['leetcode', 'sql', 'database'],
    testCases: [
      {
        params: [
          {
            Trips: [
              { id: 1, client_id: 1, driver_id: 10, city_id: 1, status: 'completed', request_at: '2013-10-01' },
              { id: 2, client_id: 2, driver_id: 11, city_id: 1, status: 'cancelled_by_driver', request_at: '2013-10-01' },
              { id: 3, client_id: 3, driver_id: 12, city_id: 6, status: 'completed', request_at: '2013-10-01' },
              { id: 4, client_id: 4, driver_id: 13, city_id: 6, status: 'cancelled_by_client', request_at: '2013-10-01' },
            ],
            Users: [
              { users_id: 1, banned: 'No', role: 'client' },
              { users_id: 2, banned: 'Yes', role: 'client' },
              { users_id: 3, banned: 'No', role: 'client' },
              { users_id: 4, banned: 'No', role: 'client' },
              { users_id: 10, banned: 'No', role: 'driver' },
            ],
          },
        ],
        expected: [
          { Day: '2013-10-01', 'Cancellation Rate': 0.33 },
          { Day: '2013-10-02', 'Cancellation Rate': 0.0 },
          { Day: '2013-10-03', 'Cancellation Rate': 0.5 },
        ],
        explanation: 'Calculate cancellation rate for each day',
        type: 'Sample',
      },
    ],
    constraints: [],
  },
  {
    title: 'Department Top Three Salaries',
    description:
      'Write a SQL query to find employees who earn the top three unique salaries in each department. Return the result in any order.',
    difficulty: 'Hard',
    topics: ['Databases'],
    tags: ['leetcode', 'sql', 'database'],
    testCases: [
      {
        params: [
          {
            Employee: [
              { id: 1, name: 'Joe', salary: 85000, departmentId: 1 },
              { id: 2, name: 'Henry', salary: 80000, departmentId: 2 },
              { id: 3, name: 'Sam', salary: 60000, departmentId: 2 },
              { id: 4, name: 'Max', salary: 90000, departmentId: 1 },
              { id: 5, name: 'Janet', salary: 69000, departmentId: 1 },
              { id: 6, name: 'Randy', salary: 85000, departmentId: 1 },
            ],
            Department: [
              { id: 1, name: 'IT' },
              { id: 2, name: 'Sales' },
            ],
          },
        ],
        expected: [
          { department: 'IT', employee: 'Max', salary: 90000 },
          { department: 'IT', employee: 'Joe', salary: 85000 },
          { department: 'IT', employee: 'Randy', salary: 85000 },
          { department: 'IT', employee: 'Janet', salary: 69000 },
          { department: 'Sales', employee: 'Henry', salary: 80000 },
          { department: 'Sales', employee: 'Sam', salary: 60000 },
        ],
        explanation: 'Top three salaries in each department',
        type: 'Sample',
      },
    ],
    constraints: [],
  },
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
    const easy = result.filter((q) => q.difficulty === 'Easy').length;
    const medium = result.filter((q) => q.difficulty === 'Medium').length;
    const hard = result.filter((q) => q.difficulty === 'Hard').length;

    console.log('\n📊 Seed Summary:');
    console.log(`   Easy: ${easy} questions`);
    console.log(`   Medium: ${medium} questions`);
    console.log(`   Hard: ${hard} questions`);
    console.log(`   Total: ${result.length} questions`);

    // Display topic breakdown
    const topics = {};
    result.forEach((q) => {
      q.topics.forEach((topic) => {
        topics[topic] = topics[topic] || { Easy: 0, Medium: 0, Hard: 0 };
        topics[topic][q.difficulty]++;
      });
    });

    console.log('\n📚 Questions by Topic:');
    Object.keys(topics)
      .sort()
      .forEach((topic) => {
        console.log(`   ${topic}: Easy(${topics[topic].Easy}) Medium(${topics[topic].Medium}) Hard(${topics[topic].Hard})`);
      });

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
