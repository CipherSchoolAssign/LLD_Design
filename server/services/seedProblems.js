import Problem from '../models/Problem.js';

const problems = [
  {
    title: 'Parking Lot System',
    description: 'Design a parking lot system that can manage vehicles entering and exiting a multi-level parking facility. The system should handle different vehicle types, track available spots, and calculate parking fees based on duration.',
    requirements: [
      'Support multiple levels in the parking lot, each with a fixed number of spots.',
      'Handle different vehicle types: Motorcycle, Car, Bus/Truck (different spot sizes).',
      'Assign the nearest available spot of the correct size when a vehicle enters.',
      'Track entry and exit times to calculate parking fees.',
      'Support different pricing strategies (e.g., hourly, flat rate, dynamic pricing).',
      'Display real-time availability of spots per level and type.',
      'Handle edge cases: lot full, invalid ticket, double exit.',
    ],
    hints: [
      'Think about the Strategy pattern for pricing.',
      'Consider how ParkingSpot and Vehicle relate — is it inheritance or composition?',
      'What happens when a Bus needs multiple spots?',
      'How would you add a new vehicle type without modifying existing code?',
    ],
    difficulty: 'Medium',
  },
  {
    title: 'Elevator System',
    description: 'Design an elevator system for a building with multiple elevators. The system should efficiently handle requests from different floors, optimize elevator movement, and manage concurrent requests safely.',
    requirements: [
      'Support multiple elevators in a single building.',
      'Handle requests from both outside (floor buttons) and inside (elevator panel).',
      'Implement a scheduling algorithm to decide which elevator serves which request.',
      'Support elevator states: IDLE, MOVING_UP, MOVING_DOWN, MAINTENANCE.',
      'Handle concurrent requests from multiple floors safely.',
      'Prioritize requests based on direction of travel (e.g., LOOK/SCAN algorithm).',
      'Display current floor and direction for each elevator.',
    ],
    hints: [
      'Consider the State pattern for elevator states.',
      'Think about the Observer pattern for notifying when an elevator arrives.',
      'How do you decide which elevator to dispatch? What algorithm would you use?',
      'What happens when all elevators are busy? How do you queue requests?',
    ],
    difficulty: 'Hard',
  },
  {
    title: 'Vending Machine',
    description: 'Design a vending machine that dispenses products when the correct amount is paid. The machine should handle product inventory, multiple payment methods, change calculation, and various error states.',
    requirements: [
      'Support multiple products, each with a name, price, and quantity.',
      'Accept coins and bills as payment (later potentially card payments).',
      'Calculate and dispense correct change after a purchase.',
      'Track inventory and prevent purchase when out of stock.',
      'Handle states: IDLE, COLLECTING_MONEY, DISPENSING, OUT_OF_SERVICE.',
      'Support admin operations: restock, collect money, add new products.',
      'Handle edge cases: insufficient payment, exact change only, product stuck.',
    ],
    hints: [
      'The State pattern is a natural fit for vending machine states.',
      'How do you separate the payment logic from the dispensing logic?',
      'Think about how to handle the "exact change only" scenario.',
      'What interface would allow adding card payments without changing existing code?',
    ],
    difficulty: 'Easy',
  },
  {
    title: 'Library Management System',
    description: 'Design a library management system that handles book catalog management, member registration, book borrowing/returning, and fine calculation for late returns.',
    requirements: [
      'Manage a catalog of books with details (title, author, ISBN, copies available).',
      'Support member registration with different membership types (Student, Faculty, Premium).',
      'Allow borrowing and returning of books with due date tracking.',
      'Calculate fines for late returns based on membership type and days overdue.',
      'Support book reservation/hold when all copies are checked out.',
      'Search books by title, author, ISBN, or category.',
      'Notify members when reserved books become available.',
      'Limit concurrent borrows based on membership type.',
    ],
    hints: [
      'Think about the Observer pattern for reservation notifications.',
      'How do different membership types affect borrowing limits and fine rates?',
      'Consider the Factory pattern for creating different membership types.',
      'What happens when a book is returned that someone has reserved?',
    ],
    difficulty: 'Medium',
  },
  {
    title: 'Splitwise — Expense Sharing',
    description: 'Design a simplified Splitwise-like expense sharing system. Users can create groups, add expenses, split them in different ways, and the system tracks balances and suggests optimal settlements.',
    requirements: [
      'Support user creation and group management.',
      'Allow adding expenses split in different ways: EQUAL, EXACT, PERCENTAGE.',
      'Track balances between pairs of users.',
      'Calculate simplified/minimized debts (settle with minimum transactions).',
      'Support both group expenses and direct (1-to-1) expenses.',
      'Show a user\'s total balance (how much they owe / are owed).',
      'Handle edge cases: user not in group, percentages not summing to 100, negative amounts.',
    ],
    hints: [
      'Think about the Strategy pattern for different split types.',
      'How do you represent the balance graph between users?',
      'Consider how to minimize the number of settlement transactions.',
      'What data structures best represent "User A owes User B $X"?',
    ],
    difficulty: 'Hard',
  },
];

const seedProblems = async () => {
  try {
    const existingCount = await Problem.countDocuments();
    if (existingCount > 0) {
      console.log(`Database already has ${existingCount} problems. Skipping seed.`);
      return;
    }

    const created = await Problem.insertMany(problems);
    console.log(`Seeded ${created.length} LLD problems successfully.`);
  } catch (error) {
    console.error('Error seeding problems:', error.message);
  }
};

export default seedProblems;
