// All dialogue content for chapter one, kept apart from the scene code.

const n = (text) => ({ who: null, text });
const s = (who, text, mood = 'normal') => ({ who, text, mood });

export const INTRO = [
  n('The bus exhales. Oppidan. Same grey sky. Same cold that gets into your teeth.'),
  n('You are W.D. Comic Srifken Dreemurr. Nobody has ever used all of it. Not even your dad.'),
  s('srif', '(Home. Or the shape of it.)'),
  s('sans', 'made it safe? tell tori i said hi. or dont. she has a phone.'),
  s('srif', "(Dad, texting like a man wanted by several timelines.)"),
  n('Ahead: the Holiday house. A figure in a green sweater is already staring at you.'),
];

export const ASGORE = [
  s('asgore', 'Srif! Look at you. You\'ve grown!'),
  s('asgore', 'Or... have you? You were always tall for a—'),
  s('asgore', '...Anyway. Welcome home, son.'),
  s('asgore', 'Your mother is at the school. She told me not to tell you she cried.'),
  s('srif', '(She is going to kill you, Chief.)'),
  s('asgore', 'She does that.'),
];

export const TORIEL = [
  s('toriel', 'My child. You are early.'),
  s('toriel', 'Your room is ready. I aired it out. Twice.'),
  s('srif', 'Thanks, Mom.'),
  s('toriel', '...You look tired.'),
  s('srif', 'Bus.'),
  s('toriel', 'Mm. The bus.'),
  s('toriel', 'I am at the school until five. The kettle is on. The pie is... a pie.'),
  s('srif', '(She is worried. She is always worried. I make her worried.)'),
];

export const CHRIS_MEET = [
  s('chris', '...No way.'),
  s('chris', 'No WAY. SRIF?!'),
  s('srif', 'Hey, Chris.'),
  s('chris', "You're— you're actually— get over here—"),
  n('You are hugged with the force of three winters.'),
  s('srif', '(He still hugs like a car crash.)'),
  s('chris', "You're freezing! Where's your thermal?"),
  s('srif', "Truck. Maybe. It's a long story."),
  s('chris', 'Diner. Now. My treat.'),
  s('chris', "I gotta tell Mich you're back. He's gonna be SO normal about this."),
  s('srif', 'Mich is here?'),
  s('chris', "He's ALWAYS here. It's a small town, Srif."),
  n('Chris is already running. He runs like a deer. Obviously.'),
];

export const DINER_CHRIS = [
  s('chris', 'There he is! Sit. Sit sit sit.'),
  s('chris', 'I ordered you a hot chocolate. And a second hot chocolate. For later.'),
  s('srif', "I'm not staying that long."),
  s('chris', "You're staying for two hot chocolates."),
  n('You drink the first one. It burns your tongue. You do not tell him.'),
  s('chris', "So. How've you been? And don't say 'fine.'"),
  s('srif', '...Fine.'),
  s('chris', 'Incredible. A comedian.'),
  s('chris', "Bathroom's in the back. You look like a snowman that lost a fight."),
];

export const MICH_SCENE = [
  n('The tap shrieks. The pipe bucks. Water goes everywhere.'),
  s('mich', 'WHAT THE—'),
  n('A very large, very wet tiger turns around.'),
  s('mich', "You think that's FUNNY?!"),
  n('He pins you against the tile. Your back hits hard.'),
  s('mich', 'You picked the wrong—'),
  n('He stops. He looks. He actually looks.'),
  s('mich', '...Srif?'),
  s('srif', '...Hi, Mich.'),
  s('mich', "Oh no. Oh no, I'm so sorry—"),
  s('srif', "It's okay."),
  s('mich', "It's NOT okay, I almost—"),
  s('srif', "It's okay. Really."),
  n('He lets go. His hands are shaking. Or maybe yours are.'),
  s('mich', 'You still do that.'),
  s('srif', 'Do what?'),
  s('mich', "Say it's okay before anyone asks."),
  n('He pulls his ushanka down over his eyes. It does not hide the fact that he is crying.'),
  s('mich', "...Come on. I'm walking you home."),
];

export const ROOM_ENTER = [
  n('Your room. Boxes. A bed. A mirror Mom uncovered and forgot to cover again.'),
  s('srif', "(I can hear the house settling. Or maybe that's me.)"),
];

export const FOLDER = [
  n('A folder on the desk. DEMON FACE SYNDROME — CASE FILE: W.D. DREEMURR.'),
  n('The photograph inside is of a six-year-old who is not smiling.'),
  s('srif', '(Mom keeps everything.)'),
];

export const MIRROR = [
  n('You look.'),
  n('For a second, you look like you.'),
  { who: 'reflection', text: "it's you...", mood: 'normal' },
  { who: 'reflection', text: 'you are in the mirror', mood: 'normal' },
  s('srif', '(No. Not tonight.)'),
  n('The face in the glass smiles wider than your mouth can.'),
  { who: 'reflection', text: 'say it. say what you did.', mood: 'normal' },
  s('srif', 'No.'),
  n('You swing.'),
  n('The mirror breaks.'),
  n('The glass does not fall.'),
  n('You do.'),
];

export const NOVELLA_INTRO = [
  n('Light. Warm. Too warm. Like the memory of a summer that never happened.'),
  s('chris', 'Srif?! Srif, where— where are we?!'),
  s('mich', '...This is not the diner.'),
  s('srif', '(The Novella. The little world I made when I was small.)'),
  s('srif', "(It wasn't this big.)"),
  s('chris', "There's a... smiling thing. It's coming this way."),
  s('mich', 'Great. Fantastic. I hate it.'),
];

export const AFTER_FIRST = [
  n('The grin bursts like a soap bubble. Something small and warm stays behind.'),
  s('srif', "(It didn't hate me. It was just... sad.)"),
  s('chris', 'Okay. New rule. Nobody panics.'),
  s('mich', "I'm panicking."),
  n('The world ahead gets brighter. That is probably fine.'),
];

export const AFTER_SECOND = [
  s('mich', '...Did that one have my face?'),
  s('srif', 'A little.'),
  s('mich', 'I hate this place.'),
  s('chris', 'Hey. Look. A door.'),
  n('A door made of your own reflection waits at the end of the path.'),
];

export const BOSS_INTRO = [
  n('The door opens before you touch it.'),
  { who: 'reflection', text: 'you made this place.', mood: 'normal' },
  { who: 'reflection', text: 'so you could be someone else.', mood: 'normal' },
  { who: 'reflection', text: "but i'm still here.", mood: 'normal' },
  s('srif', 'I know.'),
  { who: 'reflection', text: 'then say it. say what you did.', mood: 'normal' },
  s('srif', '...'),
  s('mich', "Srif. Whatever it's saying— don't listen."),
  s('chris', "We're right here."),
];

export const BOSS_SPARE = [
  { who: 'reflection', text: "...you're not going to fight me?", mood: 'normal' },
  s('srif', 'No.'),
  { who: 'reflection', text: 'then what are you going to do?', mood: 'normal' },
  s('srif', 'Walk through you.'),
  n('The reflection cracks. Not like glass. Like ice in spring.'),
];

export const BOSS_KILL = [
  n('The reflection comes apart in your hands.'),
  n('For a moment the face is yours again. Small. Seventeen. Tired.'),
  s('srif', "(I'm sorry.)"),
  s('srif', '(I keep saying that.)'),
];

export const ENDING = [
  n('The Novella folds itself small. A book. A door. A boy.'),
  n('You wake on the floor of your room. The mirror is whole.'),
  n('It shows you. Just you. For now.'),
  s('chris', 'Srif? You okay in there?'),
  s('srif', '...Yeah.'),
  s('srif', '(For now.)'),
];

export const CHRIS_AFTER = [
  s('chris', 'There you are! Mich texted me. In all caps. For six minutes.'),
  s('mich', "I was WORRIED. There's a difference."),
  s('chris', 'You gonna be okay?'),
  s('srif', '...Yeah.'),
  s('mich', "Liar. But okay."),
  s('chris', 'Pie at my place tomorrow. Non-negotiable.'),
];

export const DINER_AGAIN = [
  s('chris', 'Two hot chocolates. Still waiting.'),
  s('srif', '(They are cold now. I drink one anyway.)'),
];
