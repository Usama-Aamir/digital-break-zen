export interface BlogPost {
  title: string;
  slug: string;
  date: string;
  category: string;
  featured: boolean;
  description: string;
  content: string[];
}

// Static blog metadata - will be replaced with dynamic markdown parsing in future phase
const POSTS: BlogPost[] = [
  {
    title: "Quick Office Break Ideas",
    slug: "quick-office-break-ideas",
    date: "2024-01-15",
    category: "Productivity",
    featured: true,
    description: "Short, effective break ideas for busy office workers.",
    content: [
      "Office stress is real, but so are quick office break ideas that can help you reset in just 5 minutes. Whether you're drowning in emails or stuck in back-to-back meetings, taking a moment to breathe can make all the difference.",
      "The 5-4-3-2-1 grounding technique is perfect for office stress relief. Look around and name 5 things you can see, 4 you can touch, 3 you can hear, 2 you can smell, and 1 you can taste. It's simple, effective, and you can do it right at your desk.",
      "Desk stretches are another great option. Try neck rolls, shoulder shrugs, and wrist circles. These quick movements release tension built up from hours of typing and staring at screens. Your body will thank you.",
      "If you have access to a window, spend 2 minutes just looking outside. Watch the clouds, notice the trees, or observe people passing by. This brief connection with the outside world can reset your mental state.",
      "Digital detox breaks are increasingly important. Put your phone on silent, close unnecessary browser tabs, and just sit quietly for 3 minutes. The constant notifications and information overload contribute significantly to workplace stress.",
      "Quick breathing exercises can be done anywhere. Try box breathing: inhale for 4 counts, hold for 4, exhale for 4, and hold for 4. Repeat this cycle 4 times. It's a powerful stress-relief technique used by everyone from Navy SEALs to yoga teachers.",
      "Remember, taking breaks isn't slacking off—it's strategic. Regular breaks actually boost productivity and creativity. The most successful people know when to step back and recharge.",
      "Try incorporating these quick office break ideas into your daily routine. Set reminders if needed. Your mental health and work quality will both improve."
    ],
  },
  {
    title: "Signs You Need a Mental Break",
    slug: "signs-you-need-a-mental-break",
    date: "2024-01-20",
    category: "Mental Health",
    featured: true,
    description: "Recognizing when it's time to step back and recharge.",
    content: [
      "Burnout doesn't happen overnight. It creeps up slowly, often disguised as 'just being busy' or 'needing to push through.' Recognizing the early signs you need a mental break can prevent full-blown burnout before it takes hold.",
      "One of the first signs is irritability. If small things that never bothered you before suddenly make you angry or frustrated, that's a red flag. Your emotional reserves are running low, and you need to recharge.",
      "Physical symptoms often accompany mental exhaustion. Headaches, muscle tension, digestive issues, and trouble sleeping can all indicate that your stress levels are too high. Your body is telling you something—listen to it.",
      "Cognitive decline is another warning sign. If you're having trouble concentrating, making simple mistakes, or can't seem to remember things you used to know easily, your brain needs a break. Mental fog is real, and rest is the only cure.",
      "Loss of motivation is particularly telling. When tasks you used to enjoy feel like a chore, or when you start questioning why you're doing any of this at all, it's time to step back. Passion doesn't disappear without reason—it's often buried under exhaustion.",
      "Social withdrawal is common when you're overwhelmed. If you find yourself avoiding colleagues, skipping lunch with friends, or feeling annoyed by normal human interaction, you're likely operating on empty.",
      "The good news is that recognizing these signs is the first step to recovery. A mental break doesn't have to mean a week-long vacation. Sometimes a weekend, or even a dedicated afternoon of doing nothing, can work wonders.",
      "Start small. Take a sick day if you need to. Say no to non-essential commitments. Ask for help with your workload. These aren't signs of weakness—they're signs of wisdom.",
      "Your mental health is more important than any deadline, project, or expectation. The work will always be there, but you need to be there too, in good health, to do it well."
    ],
  },
  {
    title: "Funny Office Stress Relief Games",
    slug: "funny-office-stress-relief-games",
    date: "2024-01-25",
    category: "Fun",
    featured: false,
    description: "Lighthearted games to relieve workplace stress.",
    content: [
      "Who says stress relief has to be serious? Funny office stress relief games can turn a tense workday into something actually enjoyable. Sometimes the best way to handle office chaos is to laugh at it.",
      "Corporate buzzword bingo is a classic. Create a card with phrases like 'circle back,' 'synergy,' 'low-hanging fruit,' and 'touch base.' Every time you hear one in a meeting, mark it off. First to get five in a row wins. It makes even the most boring meetings bearable.",
      "The 'reply-all' drinking game (with water, of course) is another office favorite. Every time someone unnecessarily replies-all to an email, take a sip. You'll be amazed how often it happens, and somehow, knowing you're not alone in your frustration makes it better.",
      "Desk Olympics can turn mundane office tasks into sport. Chair races (carefully), precision paper-toss into the recycling bin, and the fastest-to-reply-to-an-email competition are all surprisingly entertaining. Just don't let your boss catch you.",
      "The 'guess the meeting length' game is perfect for calendar-heavy days. Before each meeting starts, everyone guesses how long it will actually run. Closest guess wins. The overruns that always happen suddenly become funny instead of frustrating.",
      "Stress ball competitions are surprisingly satisfying. See who can squeeze their stress ball the most times in a minute, or who can balance it on their head the longest. It's ridiculous, but that's exactly why it works.",
      "The 'fake emergency' drill is for when things get truly overwhelming. Everyone agrees on a ridiculous code word. When someone says it, everyone stops what they're doing and does something silly for 30 seconds. It breaks the tension and reminds everyone that work isn't life or death.",
      "Remember, humor is a legitimate coping mechanism. These games aren't just goofing off—they're strategic stress relief. Laughter reduces cortisol, boosts endorphins, and makes even the toughest days manageable.",
      "The key is keeping it light and inclusive. No one should feel targeted or uncomfortable. The goal is shared laughter and collective stress relief, not adding to anyone's stress."
    ],
  },
  {
    title: "Student Study Break Ideas",
    slug: "student-study-break-ideas",
    date: "2024-02-01",
    category: "Study Tips",
    featured: true,
    description: "Effective break strategies for students during study sessions.",
    content: [
      "Studying for hours without breaks isn't dedication—it's ineffective. Your brain needs regular resets to maintain focus and retain information. The right student study break ideas can actually improve your grades while keeping you sane.",
      "The Pomodoro Technique is a game-changer for many students. Study for 25 minutes, then take a 5-minute break. After four cycles, take a longer 15-30 minute break. This structured approach prevents burnout while maintaining productivity.",
      "Physical movement during breaks is crucial. Your brain uses a lot of glucose during intense study, and physical activity helps restore it. Even a quick walk around the block or some jumping jacks can refresh your mental state.",
      "Creative breaks engage different parts of your brain, giving your analytical thinking centers a rest. Doodle, listen to music, or do a quick puzzle. This cross-training approach can actually enhance problem-solving skills when you return to studying.",
      "Social breaks, when done right, can be energizing. Call a friend for 5 minutes, study with a group and chat during breaks, or even just people-watch at a café. Human connection is a powerful antidote to study isolation.",
      "Mindfulness breaks are increasingly popular among high-performing students. Try a 5-minute meditation, some deep breathing exercises, or progressive muscle relaxation. These practices reduce anxiety and improve focus for your next study session.",
      "Nature breaks have scientifically proven benefits. Even looking at pictures of nature can reduce stress and improve attention. If possible, study near a window or take your breaks outside. The natural environment resets your brain in ways indoor spaces can't.",
      "Nutrition breaks matter too. Instead of mindlessly snacking, use break time to prepare a healthy meal or drink. Proper nutrition fuels your brain and prevents the energy crashes that make studying feel impossible.",
      "The key is intentionality. Don't just default to scrolling social media during breaks. Choose activities that genuinely refresh you. Your study sessions will be more productive, and you'll actually enjoy the process more."
    ],
  },
  {
    title: "Corporate Burnout in Malaysia",
    slug: "corporate-burnout-malaysia",
    date: "2024-02-10",
    category: "Workplace",
    featured: true,
    description: "Understanding and addressing burnout in Malaysian corporate culture.",
    content: [
      "Corporate burnout in Malaysia is reaching epidemic levels. The combination of long working hours, high performance expectations, and cultural pressures to always appear capable is creating a perfect storm for mental health crisis in Malaysian workplaces.",
      "The 'face' culture in Malaysia plays a significant role. There's immense pressure to maintain appearances of success and competence, even when struggling internally. Admitting to burnout or stress is often seen as weakness, which prevents people from seeking help early.",
      "Overtime expectations are particularly problematic. Many Malaysian companies normalize working late and on weekends as dedication. What's framed as 'going the extra mile' is often actually exploitation that leads to exhaustion and resentment.",
      "The hierarchical nature of Malaysian corporate culture adds another layer. Junior employees often feel unable to say no to unreasonable demands from seniors. This power imbalance creates situations where people accept workloads they know are unsustainable.",
      "Family expectations compound workplace stress. Many Malaysian professionals face pressure not just to succeed at work, but to support extended families financially and emotionally. This dual burden can feel overwhelming, especially during economic uncertainty.",
      "The good news is that awareness is growing. More companies are implementing mental health programs, and younger generations are more open about discussing burnout. However, there's still a long way to go in creating genuinely supportive workplace cultures.",
      "Individual strategies can help cope with this environment. Setting clear boundaries, learning to say no diplomatically, and prioritizing self-care aren't just personal choices—they're survival skills in the current corporate landscape.",
      "Organizational change is ultimately necessary. Companies need to recognize that burned-out employees aren't productive employees. Investing in mental health, reasonable working hours, and supportive cultures isn't just ethical—it's good business.",
      "If you're experiencing burnout in Malaysia's corporate environment, know that you're not alone. The system is broken, not you. Seeking help, setting boundaries, and sometimes even changing environments are all valid and necessary steps."
    ],
  },
];

export function getAllPosts(): BlogPost[] {
  return POSTS.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function getPostBySlug(slug: string): BlogPost | undefined {
  return POSTS.find((post) => post.slug === slug);
}

export function getFeaturedPosts(): BlogPost[] {
  return POSTS.filter((post) => post.featured).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}
