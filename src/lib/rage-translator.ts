const translations = {
  "can't do": [
    "I may not be able to take this on in its current form, but I'm happy to discuss possible alternatives or clarify the best next step.",
    "This may require additional resources or adjustments to the scope. Let's explore what's feasible together.",
    "I'd like to review the requirements to ensure I can deliver the expected outcome effectively."
  ],
  "cannot do": [
    "I may not be able to take this on in its current form, but I'm happy to discuss possible alternatives or clarify the best next step.",
    "This may require additional resources or adjustments to the scope. Let's explore what's feasible together.",
    "I'd like to review the requirements to ensure I can deliver the expected outcome effectively."
  ],
  "cant do": [
    "I may not be able to take this on in its current form, but I'm happy to discuss possible alternatives or clarify the best next step.",
    "This may require additional resources or adjustments to the scope. Let's explore what's feasible together.",
    "I'd like to review the requirements to ensure I can deliver the expected outcome effectively."
  ],
  "makes no sense": [
    "I think this may need a bit more clarification so we can align on the expected outcome.",
    "Let's schedule a quick sync to ensure we're all on the same page regarding the requirements.",
    "I'd appreciate some additional context to better understand the intent behind this."
  ],
  "confusing": [
    "I think this may need a bit more clarification so we can align on the expected outcome.",
    "Let's schedule a quick sync to ensure we're all on the same page regarding the requirements.",
    "I'd appreciate some additional context to better understand the intent behind this."
  ],
  "not my job": [
    "This may sit outside my current scope, but I'm happy to help identify the right owner.",
    "I can connect you with the appropriate team who would be better positioned to assist with this.",
    "Let me help route this to the right person who can address this effectively."
  ],
  "too much work": [
    "Given the current bandwidth, we may need to prioritize or adjust the timeline for this initiative.",
    "Let's discuss how we can scope this appropriately to ensure successful delivery.",
    "I'd like to review the workload to identify the most realistic approach for tackling this."
  ],
  "stop changing": [
    "To keep delivery on track, it would be helpful to finalize the requirements before we continue making further changes.",
    "Stabilizing the scope will help us maintain momentum and deliver quality results.",
    "Let's lock in the current requirements to avoid scope creep and ensure timely completion."
  ],
  "urgent again": [
    "I understand the urgency, but I'd like to ensure we balance this with other committed deliverables.",
    "Let's review the priorities to determine the best approach for accommodating this request.",
    "I'll do my best to accommodate this, though it may impact other timelines."
  ],
  "no time": [
    "My current capacity is limited, but let's discuss how we can best prioritize this request.",
    "I'd like to review the schedule to see if we can accommodate this within the existing commitments.",
    "Let's explore options for adjusting timelines or delegating to ensure this gets addressed."
  ],
  "bad idea": [
    "I have some concerns about this approach and would welcome the opportunity to discuss alternative strategies.",
    "Let's explore other options that might better align with our objectives and constraints.",
    "I'd like to share some considerations that might help us refine this direction."
  ],
  "fix it yourself": [
    "I'd be happy to provide guidance or documentation to support you in addressing this directly.",
    "Let me point you to the relevant resources that will help you resolve this independently.",
    "I can outline the steps needed so you can tackle this with confidence."
  ],
  "leave me alone": [
    "I need some focused time to complete my current tasks, but I'll be available for collaboration later.",
    "Let's schedule a dedicated time to discuss this once I've cleared my current priorities.",
    "I'll follow up once I have the bandwidth to give this the attention it deserves."
  ]
};

const fallbackResponses = [
  "Thank you for sharing this. Let's work together to find a constructive path forward.",
  "I appreciate your feedback and would like to discuss how we can address this effectively.",
  "Let's explore options to ensure we achieve the desired outcome collaboratively.",
  "I understand your perspective and would welcome the opportunity to discuss this further.",
  "Let's connect to align on expectations and determine the best next steps."
];

export function translateRageToCorporate(input: string): string {
  const lowerInput = input.toLowerCase().trim();
  
  // Check for keyword matches
  for (const [keyword, responses] of Object.entries(translations)) {
    if (lowerInput.includes(keyword)) {
      const randomIndex = Math.floor(Math.random() * responses.length);
      return responses[randomIndex];
    }
  }
  
  // Fallback to a generic professional response
  const randomIndex = Math.floor(Math.random() * fallbackResponses.length);
  return fallbackResponses[randomIndex];
}
