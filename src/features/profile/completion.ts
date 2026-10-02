export type CompletionInput = {
  gender: string | null;
  intention_primary: string | null;
  country_id: string | null;
  region_id: string | null;
  city_id: string | null;
  city_other: string | null;
  bio: string | null;
  occupation: string | null;
  education: string | null;
  languages: string[];
  photoCount: number;
  interestCount: number;
};

export type CompletionTask = {
  key: string;
  label: string;
  points: number;
  done: boolean;
  section: "about" | "photos" | "interests" | "looking" | "location";
};

/** Weights sum to 100. Account basics (name, date of birth) are always present. */
export function completionTasks(p: CompletionInput): CompletionTask[] {
  const hasPlace =
    !!p.country_id && (!!p.region_id || !!p.city_id || !!p.city_other);
  return [
    { key: "basics", label: "Name and date of birth", points: 10, done: true, section: "about" },
    { key: "gender", label: "Say who you are", points: 5, done: !!p.gender, section: "about" },
    { key: "intention", label: "Say what you are looking for", points: 10, done: !!p.intention_primary, section: "looking" },
    { key: "location", label: "Add where you live", points: 15, done: hasPlace, section: "location" },
    { key: "bio", label: "Write a short bio (at least 20 characters)", points: 15, done: (p.bio ?? "").trim().length >= 20, section: "about" },
    { key: "photo", label: "Add a main photo", points: 20, done: p.photoCount >= 1, section: "photos" },
    { key: "photos", label: "Add at least 3 photos", points: 5, done: p.photoCount >= 3, section: "photos" },
    { key: "interests", label: "Pick at least 3 interests", points: 10, done: p.interestCount >= 3, section: "interests" },
    { key: "work", label: "Add your work or education", points: 5, done: !!(p.occupation?.trim() || p.education?.trim()), section: "about" },
    { key: "languages", label: "Add a language you speak", points: 5, done: p.languages.length >= 1, section: "about" },
  ];
}

export function completionPercent(p: CompletionInput): number {
  return completionTasks(p).reduce((sum, t) => sum + (t.done ? t.points : 0), 0);
}
