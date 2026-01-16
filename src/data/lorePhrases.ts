// 100 unique lore phrases for set completion dialogs - Hotline Miami style

export interface LorePhrase {
  id: number;
  text: string;
  category: 'taunt' | 'motivation' | 'weight' | 'combat' | 'philosophy';
}

export const lorePhrases: LorePhrase[] = [
  // ENEMY TAUNTS (20)
  { id: 1, text: "Is that all you've got? Pathetic.", category: 'taunt' },
  { id: 2, text: "My grandmother lifts heavier. She's dead.", category: 'taunt' },
  { id: 3, text: "You call that a set? I call it a warm-up.", category: 'taunt' },
  { id: 4, text: "The iron doesn't lie. Neither do I. You're weak.", category: 'taunt' },
  { id: 5, text: "Keep going. I enjoy watching you suffer.", category: 'taunt' },
  { id: 6, text: "Pain is just weakness leaving the body. You must be full of it.", category: 'taunt' },
  { id: 7, text: "They said you were dangerous. They were wrong.", category: 'taunt' },
  { id: 8, text: "I've seen corpses with better form.", category: 'taunt' },
  { id: 9, text: "That weight won't lift itself. Neither will your ego.", category: 'taunt' },
  { id: 10, text: "Tick tock. Your muscles are giving up before your mind.", category: 'taunt' },
  { id: 11, text: "The bar doesn't care about your feelings.", category: 'taunt' },
  { id: 12, text: "Sweat now or bleed later. Your choice.", category: 'taunt' },
  { id: 13, text: "I've crushed better soldiers than you.", category: 'taunt' },
  { id: 14, text: "Your ancestors are watching. They're disappointed.", category: 'taunt' },
  { id: 15, text: "Gravity always wins. So do I.", category: 'taunt' },
  { id: 16, text: "You think this is hard? Wait until round two.", category: 'taunt' },
  { id: 17, text: "The iron remembers every failed rep.", category: 'taunt' },
  { id: 18, text: "Quit now. Save yourself the embarrassment.", category: 'taunt' },
  { id: 19, text: "I smell fear. And protein powder.", category: 'taunt' },
  { id: 20, text: "Your form is a crime against humanity.", category: 'taunt' },

  // MOTIVATIONAL QUOTES (25)
  { id: 21, text: "Pain is temporary. Legend is forever.", category: 'motivation' },
  { id: 22, text: "The only easy day was yesterday.", category: 'motivation' },
  { id: 23, text: "Embrace the grind. Become the weapon.", category: 'motivation' },
  { id: 24, text: "Every rep is a bullet in your arsenal.", category: 'motivation' },
  { id: 25, text: "You didn't come this far to only come this far.", category: 'motivation' },
  { id: 26, text: "The weights don't know who you were. Show them who you are.", category: 'motivation' },
  { id: 27, text: "Comfort is the enemy of progress.", category: 'motivation' },
  { id: 28, text: "Build the body. Forge the mind. Break the limits.", category: 'motivation' },
  { id: 29, text: "Champions are made when no one is watching.", category: 'motivation' },
  { id: 30, text: "The iron path is paved with sacrifice.", category: 'motivation' },
  { id: 31, text: "Your body is a battlefield. Win the war.", category: 'motivation' },
  { id: 32, text: "Weakness is a choice. Choose violence.", category: 'motivation' },
  { id: 33, text: "The burn means you're still alive.", category: 'motivation' },
  { id: 34, text: "One more rep. One step closer to glory.", category: 'motivation' },
  { id: 35, text: "Discipline is the bridge between goals and accomplishment.", category: 'motivation' },
  { id: 36, text: "You're not tired. You're just getting started.", category: 'motivation' },
  { id: 37, text: "The strongest steel is forged in the hottest fire.", category: 'motivation' },
  { id: 38, text: "Rise. Lift. Conquer. Repeat.", category: 'motivation' },
  { id: 39, text: "Your potential is infinite. Your excuses are not.", category: 'motivation' },
  { id: 40, text: "The grind never stops. Neither should you.", category: 'motivation' },
  { id: 41, text: "Train like your life depends on it. It does.", category: 'motivation' },
  { id: 42, text: "The only limit is the one you accept.", category: 'motivation' },
  { id: 43, text: "Sweat is just fat crying. Make it weep.", category: 'motivation' },
  { id: 44, text: "Victory belongs to the relentless.", category: 'motivation' },
  { id: 45, text: "Every set is a step towards immortality.", category: 'motivation' },

  // WEIGHT COMMENTARY (25)
  { id: 46, text: "That's a lot of iron. The floor is jealous.", category: 'weight' },
  { id: 47, text: "Weight moved: Impressive. Enemies crushed: Imminent.", category: 'weight' },
  { id: 48, text: "The bar bends to your will. As it should.", category: 'weight' },
  { id: 49, text: "Gravity tried. Gravity failed.", category: 'weight' },
  { id: 50, text: "That weight had a family. They'll miss it.", category: 'weight' },
  { id: 51, text: "Heavy metal isn't just a genre. It's a lifestyle.", category: 'weight' },
  { id: 52, text: "The plates whisper your name in fear.", category: 'weight' },
  { id: 53, text: "Another ton closer to becoming unstoppable.", category: 'weight' },
  { id: 54, text: "The iron bows before you.", category: 'weight' },
  { id: 55, text: "Weight: Demolished. Ego: Justified.", category: 'weight' },
  { id: 56, text: "The rack trembles at your approach.", category: 'weight' },
  { id: 57, text: "Steel meets flesh. Steel loses.", category: 'weight' },
  { id: 58, text: "That's not weight. That's a warm-up for a warrior.", category: 'weight' },
  { id: 59, text: "The barbell begs for mercy. None given.", category: 'weight' },
  { id: 60, text: "Pounds pulverized. Progress secured.", category: 'weight' },
  { id: 61, text: "You've lifted small cars. Metaphorically.", category: 'weight' },
  { id: 62, text: "The gym floor groans under your power.", category: 'weight' },
  { id: 63, text: "Iron therapy: Session complete.", category: 'weight' },
  { id: 64, text: "That weight didn't stand a chance.", category: 'weight' },
  { id: 65, text: "Plates stacked. Enemies crushed.", category: 'weight' },
  { id: 66, text: "The weights were heavy. Your resolve was heavier.", category: 'weight' },
  { id: 67, text: "Another sacrifice to the iron gods.", category: 'weight' },
  { id: 68, text: "The bar rises. Your enemies fall.", category: 'weight' },
  { id: 69, text: "Weight displaced: Maximum. Mercy shown: Zero.", category: 'weight' },
  { id: 70, text: "The iron submits to your dominance.", category: 'weight' },

  // COMBAT/ACTION STYLE (20)
  { id: 71, text: "Target eliminated. Next.", category: 'combat' },
  { id: 72, text: "Damage dealt. Moving to next objective.", category: 'combat' },
  { id: 73, text: "Set complete. Casualties: Your limitations.", category: 'combat' },
  { id: 74, text: "Mission progress: Optimal. Weakness: Terminated.", category: 'combat' },
  { id: 75, text: "Another rep, another enemy silenced.", category: 'combat' },
  { id: 76, text: "Execute. Adapt. Overcome.", category: 'combat' },
  { id: 77, text: "The body count rises. Keep going.", category: 'combat' },
  { id: 78, text: "Clean kill. No witnesses.", category: 'combat' },
  { id: 79, text: "You're not working out. You're training for war.", category: 'combat' },
  { id: 80, text: "Objective secured. Proceed to next target.", category: 'combat' },
  { id: 81, text: "Violence is the answer. The question is irrelevant.", category: 'combat' },
  { id: 82, text: "Tactical superiority achieved.", category: 'combat' },
  { id: 83, text: "The mission demands perfection. Deliver it.", category: 'combat' },
  { id: 84, text: "Hostiles neutralized. Continue assault.", category: 'combat' },
  { id: 85, text: "Your muscles are weapons. Keep them loaded.", category: 'combat' },
  { id: 86, text: "No prisoners. No excuses. No mercy.", category: 'combat' },
  { id: 87, text: "Strike fast. Lift heavy. Leave nothing.", category: 'combat' },
  { id: 88, text: "The battlefield is the weight room. Dominate it.", category: 'combat' },
  { id: 89, text: "War paint optional. War mindset required.", category: 'combat' },
  { id: 90, text: "Every set is a skirmish. Win them all.", category: 'combat' },

  // DARK PHILOSOPHY (10)
  { id: 91, text: "Do you like hurting yourself? Good.", category: 'philosophy' },
  { id: 92, text: "We all wear masks. Yours just happens to be sweat.", category: 'philosophy' },
  { id: 93, text: "The void stares back. Lift anyway.", category: 'philosophy' },
  { id: 94, text: "In the end, we're all just meat. Might as well be strong meat.", category: 'philosophy' },
  { id: 95, text: "The abyss has a gym. You're in it.", category: 'philosophy' },
  { id: 96, text: "Existence is suffering. Might as well suffer productively.", category: 'philosophy' },
  { id: 97, text: "The weight room is honest. Everything else lies.", category: 'philosophy' },
  { id: 98, text: "You lift to forget. You can't forget. Lift more.", category: 'philosophy' },
  { id: 99, text: "Between reps, there is only silence and truth.", category: 'philosophy' },
  { id: 100, text: "The iron doesn't judge. It only reveals.", category: 'philosophy' },
];

// Helper function to get a random lore phrase
export function getRandomLorePhrase(): LorePhrase {
  return lorePhrases[Math.floor(Math.random() * lorePhrases.length)];
}

// Helper function to get a random lore phrase by category
export function getRandomLorePhraseByCategory(category: LorePhrase['category']): LorePhrase {
  const filtered = lorePhrases.filter(p => p.category === category);
  return filtered[Math.floor(Math.random() * filtered.length)];
}

// Helper function to get a weighted random phrase (taunts less frequent)
export function getWeightedRandomLorePhrase(): LorePhrase {
  const random = Math.random();
  
  if (random < 0.15) {
    // 15% chance for enemy taunt
    return getRandomLorePhraseByCategory('taunt');
  } else if (random < 0.45) {
    // 30% chance for motivation
    return getRandomLorePhraseByCategory('motivation');
  } else if (random < 0.70) {
    // 25% chance for weight commentary
    return getRandomLorePhraseByCategory('weight');
  } else if (random < 0.90) {
    // 20% chance for combat
    return getRandomLorePhraseByCategory('combat');
  } else {
    // 10% chance for philosophy
    return getRandomLorePhraseByCategory('philosophy');
  }
}
