/**
 * Campus life content. Activity & facility AREAS are listed as categories for the design;
 * the school must confirm which exist and supply descriptions + photographs.
 * `confirmed: false` renders an "Awaiting confirmation" marker in the UI.
 */
export type ArtName =
  | 'book' | 'science' | 'library' | 'sports' | 'arts' | 'music' | 'classroom'
  | 'celebration' | 'computer' | 'campus' | 'maths' | 'notice' | 'yoga' | 'chess';

export interface Area { id: string; name: string; line: string; art: ArtName; confirmed: boolean }

export const activities: Area[] = [
  { id: 'sport', name: 'Sports & Fitness', line: 'Physical education, team games and athletics as part of the weekly timetable.', art: 'sports', confirmed: false },
  { id: 'performing', name: 'Music & Dance', line: 'Performing arts that build confidence on stage and in the classroom.', art: 'music', confirmed: false },
  { id: 'visual', name: 'Visual Arts', line: 'Drawing, painting and craft, encouraged through CBSE art education.', art: 'arts', confirmed: false },
  { id: 'inquiry', name: 'Science & Inquiry', line: 'Experiments, models and exhibitions that turn questions into investigations.', art: 'science', confirmed: false },
  { id: 'reading', name: 'Reading & Literacy', line: 'Reading habits built through the library, storytelling and recitation.', art: 'library', confirmed: false },
  { id: 'culture', name: 'Celebrations & Culture', line: 'National days, festivals and annual events that bring the school together.', art: 'celebration', confirmed: false },
];

export const facilities: Area[] = [
  { id: 'classrooms', name: 'Classrooms', line: 'Learning spaces for Classes 1 to 10.', art: 'classroom', confirmed: false },
  { id: 'library', name: 'Library', line: 'Books and reading space for every age group.', art: 'library', confirmed: false },
  { id: 'labs', name: 'Science Laboratories', line: 'Practical work for middle and secondary classes.', art: 'science', confirmed: false },
  { id: 'computer', name: 'Computer Laboratory', line: 'Digital literacy and skill education.', art: 'computer', confirmed: false },
  { id: 'ground', name: 'Playground', line: 'Outdoor space for sport and physical education.', art: 'sports', confirmed: false },
  { id: 'activity', name: 'Activity Spaces', line: 'Room for music, dance, art and assemblies.', art: 'music', confirmed: false },
];

export type GalleryTag = 'Sports' | 'Culture' | 'Academics' | 'Celebrations';
export interface GalleryItem { id: string; title: string; tag: GalleryTag; art: ArtName; tone: 'navy' | 'marigold' | 'ivory' | 'sky' | 'clay' }

/** Illustrations stand in for photographs until the school supplies its own (see docs/ASSET-PLAN.md). */
export const gallery: GalleryItem[] = [
  { id: 'g1', title: 'On the field', tag: 'Sports', art: 'sports', tone: 'marigold' },
  { id: 'g2', title: 'In the laboratory', tag: 'Academics', art: 'science', tone: 'navy' },
  { id: 'g3', title: 'Stage & rhythm', tag: 'Culture', art: 'music', tone: 'clay' },
  { id: 'g4', title: 'Festival of lights', tag: 'Celebrations', art: 'celebration', tone: 'navy' },
  { id: 'g5', title: 'Quiet reading', tag: 'Academics', art: 'library', tone: 'ivory' },
  { id: 'g6', title: 'Colour & craft', tag: 'Culture', art: 'arts', tone: 'sky' },
  { id: 'g7', title: 'Mind games', tag: 'Sports', art: 'chess', tone: 'ivory' },
  { id: 'g8', title: 'Numbers & patterns', tag: 'Academics', art: 'maths', tone: 'marigold' },
  { id: 'g9', title: 'Morning yoga', tag: 'Sports', art: 'yoga', tone: 'sky' },
  { id: 'g10', title: 'Republic Day', tag: 'Celebrations', art: 'campus', tone: 'clay' },
];

export const achievementCategories = ['Academics', 'Sports', 'Arts', 'Olympiads', 'Community'] as const;
