/**
 * MandelBro - Code Generator Utility
 * 
 * This utility generates unique codes for world sharing in the MandelBro game.
 * It creates short, memorable codes that are easy for children to share.
 */

const { customAlphabet } = require('nanoid');

// Define a child-friendly alphabet (no confusing characters like 0/O, 1/I, etc.)
const ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';

// Create code generators of different lengths
const generateShortCode = customAlphabet(ALPHABET, 5);  // 5-character code
const generateMediumCode = customAlphabet(ALPHABET, 6); // 6-character code
const generateLongCode = customAlphabet(ALPHABET, 8);   // 8-character code

/**
 * Generate a unique world code
 * @param {string} length - The length of code to generate ('short', 'medium', or 'long')
 * @returns {string} A unique code
 */
function generateWorldCode(length = 'medium') {
  switch (length) {
    case 'short':
      return generateShortCode();
    case 'medium':
      return generateMediumCode();
    case 'long':
      return generateLongCode();
    default:
      return generateMediumCode();
  }
}

/**
 * Validate if a code follows the correct format
 * @param {string} code - The code to validate
 * @returns {boolean} Whether the code is valid
 */
function validateWorldCode(code) {
  if (!code) return false;
  
  // Check if code only contains characters from our alphabet
  const validChars = new RegExp(`^[${ALPHABET}]+$`);
  if (!validChars.test(code)) return false;
  
  // Check length
  const length = code.length;
  return length >= 5 && length <= 8;
}

/**
 * Generate a friendly name for a world
 * This creates names like "Purple-Mountain-45" that are easy for kids to remember
 * @returns {string} A friendly world name
 */
function generateWorldName() {
  const adjectives = [
    'Red', 'Blue', 'Green', 'Yellow', 'Purple', 'Orange', 'Pink', 'Teal',
    'Happy', 'Silly', 'Funny', 'Brave', 'Clever', 'Mighty', 'Super', 'Mega',
    'Giant', 'Tiny', 'Wild', 'Magic', 'Secret', 'Amazing', 'Awesome', 'Epic'
  ];
  
  const nouns = [
    'Mountain', 'Ocean', 'Forest', 'Desert', 'Island', 'Castle', 'Dragon', 'Robot',
    'Spaceship', 'Dinosaur', 'Unicorn', 'Wizard', 'Pirate', 'Ninja', 'Rocket', 'Tiger',
    'Dolphin', 'Monkey', 'Panda', 'Penguin', 'Elephant', 'Butterfly', 'Rainbow', 'Star'
  ];
  
  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const number = Math.floor(Math.random() * 100);
  
  return `${adjective}-${noun}-${number}`;
}

module.exports = {
  generateWorldCode,
  validateWorldCode,
  generateWorldName
};
