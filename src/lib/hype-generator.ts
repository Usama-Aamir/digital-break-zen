/**
 * Local hype generator - no API required!
 * Generates fun, over-the-top motivational speeches based on job titles.
 */

const ADJECTIVES = [
  "legendary", "unstoppable", "phenomenal", "extraordinary", "magnificent",
  "spectacular", "incredible", "awesome", "remarkable", "exceptional",
  "brilliant", "masterful", "supreme", "ultimate", "supreme"
];

const NOUNS = [
  "warrior", "champion", "hero", "legend", "master", "wizard", "ninja",
  "guru", "expert", "prodigy", "virtuoso", "maestro", " titan", "force"
];

const VERBS = [
  "crushing", "dominating", "conquering", "mastering", "revolutionizing",
  "transforming", "elevating", "empowering", "igniting", "unleashing"
];

const TEMPLATES = [
  (title: string, adj: string, noun: string, verb: string) =>
    `You're not just a ${title} — you're a ${adj} ${noun} of the ${title} realm! Keep ${verb} it every single day and show the world what true excellence looks like.`,
  
  (title: string, adj: string, noun: string, verb: string) =>
    `Behold the ${adj} ${title} who's ${verb} the game! You're not doing work — you're crafting masterpieces and leaving a legacy that echoes through the digital halls of greatness.`,
  
  (title: string, adj: string, noun: string, verb: string) =>
    `The ${title} world trembles before your ${adj} skills! You're a ${noun} on a mission, ${verb} challenges and turning obstacles into stepping stones toward glory.`,
  
  (title: string, adj: string, noun: string, verb: string) =>
    `Forget ordinary — you're a ${adj} ${title} ${noun}! Every day you're ${verb} expectations and proving that passion, precision, and power are your middle names.`,
  
  (title: string, adj: string, noun: string, verb: string) =>
    `You've unlocked the ${adj} potential of being a ${title}! As a true ${noun}, you're ${verb} the impossible and making it look easy while the rest of the world watches in awe.`
];

function getRandomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

/**
 * Generates a hype speech for a given job title
 * @param jobTitle - The job title to generate hype for
 * @returns A fun, over-the-top motivational speech
 */
export function generateHypeSpeech(jobTitle: string): string {
  const normalizedTitle = jobTitle.trim().toLowerCase();
  
  // Special handling for common titles to make them more specific
  const titleMap: Record<string, string> = {
    "qa": "quality assurance",
    "qa engineer": "quality assurance engineer",
    "dev": "developer",
    "pm": "product manager",
    "ux": "user experience",
    "ui": "user interface",
    "hr": "human resources",
    "ceo": "chief executive officer",
    "cto": "chief technology officer",
    "cfo": "chief financial officer",
  };
  
  const displayTitle = titleMap[normalizedTitle] || jobTitle;
  
  const adj = getRandomElement(ADJECTIVES);
  const noun = getRandomElement(NOUNS);
  const verb = getRandomElement(VERBS);
  const template = getRandomElement(TEMPLATES);
  
  return template(displayTitle, adj, noun, verb);
}
