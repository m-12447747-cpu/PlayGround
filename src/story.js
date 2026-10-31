/* Story beats for Chapter I. */

export const SPEAKERS = {
  srif: "SRIF",
  chris: "CHRIS",
  mich: "MICH",
  asgore: "ASGORE",
  toriel: "TORIEL",
  mirror: "THE MIRROR",
};

export const intro = [
  { narration: true, text: "OPPIDAN.\nPopulation: 3,112. Temperature: −4°C." },
  { narration: true, text: "Three years since the Dreemurrs left. Three years since the lights went out on Snowbell Lane." },
  { narration: true, text: "Tonight, the moving truck came back." },
  { narration: true, text: "You stand in the snow and wait for the town to recognise you." },
  { narration: true, text: "It doesn't. That's okay. You're not sure you recognise yourself." },
];

export const asgoreFirst = [
  { who: "asgore", mood: "kind", text: "Srif. As I live and breathe. You got tall on us." },
  { who: "srif", mood: "neutral", text: "Hi, Chief." },
  { who: "asgore", mood: "kind", text: "Chief. Still saying it like I'm about to give you a ticket." },
  { who: "srif", mood: "soft", text: "Are you?" },
  { who: "asgore", mood: "kind", text: "Not tonight." },
  { narration: true, text: "He tips his cap. Snow slides off the brim." },
  { who: "asgore", mood: "kind", text: "Your mother's at the bakery. She's been pretending not to watch the road all evening." },
  { who: "srif", mood: "soft", text: "...She does that." },
  { who: "asgore", mood: "kind", text: "She does a lot of things she thinks nobody notices." },
  { who: "asgore", mood: "kind", text: "So do you." },
  { narration: true, text: "Srif's smile holds. It's a good smile. He's had practice." },
  { who: "asgore", mood: "kind", text: "Go on. Before the snow buries us both." },
];

export const asgoreAgain = [
  { who: "asgore", mood: "kind", text: "Still here? Good. The cold's not going anywhere, but neither is the cocoa." },
  { who: "srif", mood: "soft", text: "I'm looking for Chris." },
  { who: "asgore", mood: "kind", text: "Plaza. Follow the lights. And Srif—" },
  { who: "srif", mood: "neutral", text: "Yeah?" },
  { who: "asgore", mood: "kind", text: "It's good to have you home." },
  { narration: true, text: "Srif nods. The words land somewhere behind his ribs and stay there." },
];

export const torielFirst = [
  { who: "toriel", mood: "warm", text: "There you are." },
  { narration: true, text: "She winds his scarf twice around his neck. Her paws are warm." },
  { who: "toriel", mood: "warm", text: "You'll catch your death. Button up." },
  { who: "srif", mood: "neutral", text: "I'm okay." },
  { who: "toriel", mood: "warm", text: "Mm." },
  { who: "toriel", mood: "warm", text: "You always say that." },
  { who: "srif", mood: "soft", text: "Maybe because it's true." },
  { who: "toriel", mood: "warm", text: "Then why do you say it like an apology?" },
  { narration: true, text: "He doesn't answer. The words are there, somewhere, folded up very small." },
  { who: "toriel", mood: "warm", text: "Chris is by the plaza. He's been hanging lights since noon. I think he knew you were coming before I did." },
  { who: "srif", mood: "soft", text: "He always did." },
  { who: "toriel", mood: "warm", text: "Srif." },
  { who: "srif", mood: "neutral", text: "Yeah?" },
  { who: "toriel", mood: "warm", text: "You don't have to be alright for me. Or for him. Or for the whole town." },
  { who: "srif", mood: "sad", text: "...I know." },
  { narration: true, text: "He doesn't." },
  { who: "toriel", mood: "warm", text: "Eat something. Sleep. Come by the bakery in the morning." },
  { narration: true, text: "She hesitates. Then, mostly to herself:" },
  { who: "toriel", mood: "stern", text: "And if Asgore tells you the roads need watching, tell him the roads are fine." },
];

export const torielAgain = [
  { who: "toriel", mood: "warm", text: "Go on, little one. Before the snow gets ideas." },
  { who: "srif", mood: "soft", text: "I'm seventeen." },
  { who: "toriel", mood: "warm", text: "And I'm your mother. You'll always be little to me." },
  { narration: true, text: "The bakery door chimes behind her. Warm air spills out, then closes." },
];

export const chrisReunion = [
  { who: "chris", mood: "shock", text: "Srif?" },
  { who: "chris", mood: "smile", text: "Srif!" },
  { narration: true, text: "He crosses the plaza at a dead run, boots throwing up snow." },
  { who: "srif", mood: "shock", text: "Chris—" },
  { who: "chris", mood: "smile", text: "You're here. You're actually here!" },
  { narration: true, text: "Srif doesn't plan it. His arms just open." },
  { narration: true, text: "Chris hits him like a very tall, very warm accident." },
  { who: "chris", mood: "hug", text: "Okay. Okay. I'm not crying. The cold is crying." },
  { who: "srif", mood: "hug", text: "You're definitely crying." },
  { who: "chris", mood: "hug", text: "So are you." },
  { who: "srif", mood: "hug", text: "It's snow." },
  { who: "chris", mood: "hug", text: "Sure, buddy." },
  { narration: true, text: "Three years. The hug lasts long enough to admit it." },
  { who: "chris", mood: "soft", text: "Not one letter. Not even a dumb little postcard with a mountain on it." },
  { who: "srif", mood: "sad", text: "I'm sorry." },
  { who: "chris", mood: "soft", text: "Don't apologise. Be here." },
  { narration: true, text: "For a moment, the thing behind Srif's smile goes quiet." },
];

export const chrisChoices = {
  prompt: "The snow falls between you.",
  options: [
    {
      id: "missed",
      label: "I missed you.",
      response: [
        { who: "chris", mood: "soft", text: "Missed you too, you weird little guy." },
        { narration: true, text: "He says it easily, the way he says everything. Like it costs nothing to be kind." },
      ],
    },
    {
      id: "joke",
      label: "You're crushing my ribs.",
      response: [
        { who: "chris", mood: "smile", text: "Good. That means you're real." },
        { narration: true, text: "Srif laughs. It surprises them both." },
      ],
    },
    {
      id: "sorry",
      label: "...I'm sorry I disappeared.",
      response: [
        { who: "chris", mood: "soft", text: "Then don't disappear again. Deal?" },
        { who: "srif", mood: "sad", text: "...Deal." },
        { narration: true, text: "Chris squeezes once, hard, and lets him go before the promise can bruise." },
      ],
    },
  ],
};

export const chrisAfterChoice = [
  { who: "chris", mood: "smile", text: "Now come on. I'm freezing my antlers off." },
  { who: "srif", mood: "neutral", text: "That's not a thing." },
  { who: "chris", mood: "smile", text: "It's a thing when you're this dramatic." },
  { narration: true, text: "Chris bumps his shoulder against Srif's. The contact is warm and terrifying and gone too soon." },
  { who: "chris", mood: "soft", text: "Wash up first. I'll grab us a booth. Don't take forever." },
  { narration: true, text: "He jogs toward the Lakeside Diner, antlers catching the string lights." },
  { narration: true, text: "Srif watches him go. He looks at me like I'm still me." },
];

export const dinerLocked = [
  { narration: true, text: "The Lakeside Diner glows like a held breath." },
  { narration: true, text: "Chris is waiting by the plaza. You should find him first." },
];

export const bathroomIntro = [
  { narration: true, text: "LAKESIDE DINER — RESTROOM\n7:14 PM" },
  { narration: true, text: "The door clicks shut behind you. Fluorescent light hums like a trapped insect." },
  { narration: true, text: "A tiger in a black ushanka is scrubbing his hands at the far sink." },
  { narration: true, text: "You take the one beside him." },
];

export const washStart = [
  { narration: true, text: "The water is colder than the street." },
  { who: "srif", mood: "empty", text: "It's fine. It's fine. It's—" },
];

export const michPin = [
  { who: "mich", mood: "shock", text: "What the hell—" },
  { narration: true, text: "A paw closes around your wrist before you can apologise." },
  { who: "mich", mood: "tough", text: "You think you can just—" },
  { narration: true, text: "He stops. His grip loosens by one finger." },
  { who: "mich", mood: "shock", text: "...Srif?" },
  { who: "srif", mood: "hurt", text: "Hey, Mich." },
  { who: "mich", mood: "shock", text: "You— you absolute— I almost decked you." },
  { who: "srif", mood: "hurt", text: "You did kind of deck me." },
  { who: "mich", mood: "tough", text: "You sprayed me." },
  { who: "srif", mood: "sad", text: "Sorry." },
  { who: "mich", mood: "tough", text: "Why didn't you say it was you?" },
  { who: "srif", mood: "sad", text: "I was washing my hands." },
  { who: "mich", mood: "soft", text: "Before that." },
  { who: "srif", mood: "empty", text: "...Didn't think you'd want me to." },
  { narration: true, text: "Mich stares at him. The tough face slips, just a little." },
  { who: "mich", mood: "soft", text: "That's the dumbest thing I've ever heard." },
  { narration: true, text: "He lets go. The bathroom is very quiet." },
  { who: "mich", mood: "soft", text: "You look different. Not bad-different. Just... older. Quieter." },
  { who: "srif", mood: "soft", text: "You look like a bouncer." },
  { who: "mich", mood: "tough", text: "I'm a line cook." },
  { who: "srif", mood: "soft", text: "Same energy." },
  { who: "mich", mood: "soft", text: "There he is." },
  { narration: true, text: "He almost smiles. Then he looks at Srif properly." },
  { who: "mich", mood: "soft", text: "You okay?" },
  { who: "srif", mood: "empty", text: "Fine." },
  { who: "mich", mood: "soft", text: "See. That. You say 'fine' like a lock." },
  { narration: true, text: "In the mirror, Srif's reflection hasn't blinked." },
  { narration: true, text: "It has too many teeth." },
];

export const mirrorIntro = [
  { narration: true, text: "The fluorescent light stutters." },
  { who: "mirror", mood: "empty", text: "THERE HE IS." },
  { narration: true, text: "The restroom peels away like wet paper." },
  { who: "mirror", mood: "empty", text: "THE LITTLE BOY WITH THE BORROWED SMILE." },
  { who: "srif", mood: "shock", text: "...No." },
  { who: "mirror", mood: "empty", text: "LET'S SEE WHAT YOU'RE HIDING UNDER IT." },
  { narration: true, text: "FIGHT / ACT / ITEM / MERCY" },
];

export const battle = {
  start: "THE MIRROR is waiting.",
  check: "THE MIRROR — ATK 13 · DEF 0.\nIt wears your face. It knows every word you never said.",
  smile: "You smile.\nThe mirror smiles wider. It has more practice.",
  apologize: "You say sorry.\nThe mirror asks what for. The list is too long to fit in your mouth.",
  honest: [
    "You stop hiding.\n“I don't want to be you.”\nThe glass cracks.",
    "You keep going.\n“I'm tired of being the thing people have to forgive.”\nAnother crack.",
    "The mirror goes still.\n“Then what do you want?”\nYou answer: “To be here.”",
  ],
  fight: "You strike the glass.\nIt laughs in your voice.",
  fightBroken: "It comes back together.\nYou can't hit a reflection hard enough.",
  item: "You drink the cocoa Chris left in your pocket.\nIt's cold. It helps.",
  itemEmpty: "Your pocket is empty.\nThe mirror watches you search it.",
  mercy: "You offer mercy.\nThe mirror flinches. Not yet.",
  mercyReady: "The mirror is listening.\nIt is waiting for you to let go.",
  listening: "The mirror is still listening.\nYou can feel it behind your teeth.",
  dodge: "DODGE.",
  hurt: "Something in you cracks.",
  survive: "The mirror will not let you disappear.",
  win: "The mirror doesn't shatter.\nIt lets go.",
};

export const victory = [
  { who: "mirror", mood: "soft", text: "THEN BE HERE." },
  { narration: true, text: "The glass comes apart like snow." },
  { who: "mich", mood: "shock", text: "Srif. Hey. Srif." },
  { narration: true, text: "The fluorescent light buzzes back. Mich is holding your shoulder." },
  { who: "mich", mood: "soft", text: "You went somewhere." },
  { who: "srif", mood: "sad", text: "...Nowhere good." },
  { who: "mich", mood: "soft", text: "You back?" },
  { who: "srif", mood: "soft", text: "...Yeah." },
  { who: "mich", mood: "soft", text: "Good. You went pale as a ghost." },
  { who: "srif", mood: "sad", text: "I think I'm not okay." },
  { narration: true, text: "The words come out before he can stop them. Small. Real." },
  { who: "mich", mood: "soft", text: "Okay." },
  { who: "srif", mood: "shock", text: "Okay?" },
  { who: "mich", mood: "soft", text: "Yeah. Okay. We'll start there." },
  { narration: true, text: "Mich lets go. He doesn't leave." },
  { who: "chris", mood: "smile", text: "You two okay in there? The cocoa's getting lonely!" },
  { who: "mich", mood: "tough", text: "We're coming!" },
  { who: "mich", mood: "soft", text: "Hey. Srif." },
  { who: "srif", mood: "soft", text: "Yeah?" },
  { who: "mich", mood: "soft", text: "Thanks for almost getting decked." },
  { who: "srif", mood: "smile", text: "Anytime." },
  { narration: true, text: "For the first time in three years, Srif doesn't say 'fine.'" },
];

export const ending = {
  kicker: "A DREEMURR STORY",
  quote: "“You don't have to be okay.\nYou just have to be here.”",
  copy: "The town remembers. So does he.",
};
