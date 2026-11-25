/**
 * Photo registry. `kind` drives the on-image credit label:
 *  - 'ai'   → AI-generated CONCEPT image. Primary uniform modelled on the school's published 2019–20 photos;
 *             senior (Classes 6–10) uniform modelled on reference photos supplied by the client (to be confirmed).
 *             Must be replaced by approved school photography before launch.
 *  - 'real' → genuine image published on stkvem.com (school archive).
 */
import type { ImageMetadata } from 'astro';
import hero from '../assets/photos/ai-hero-courtyard.jpg';
import classroom from '../assets/photos/ai-classroom.jpg';
import library from '../assets/photos/ai-library.jpg';
import lab from '../assets/photos/ai-science-lab.jpg';
import skating from '../assets/photos/ai-skating.jpg';
import riding from '../assets/photos/ai-horse-riding.jpg';
import computer from '../assets/photos/ai-computer-lab.jpg';
import sportsday from '../assets/photos/ai-sports-day.jpg';
import dance from '../assets/photos/ai-folk-dance.jpg';
import art from '../assets/photos/ai-art-class.jpg';
import campus from '../assets/photos/real-campus-render.jpg';
import janmashtami from '../assets/photos/real-janmashtami.jpg';
import carnival from '../assets/photos/real-christmas-carnival.jpg';
import uniform from '../assets/photos/real-uniform-celebration.jpg';
import principal from '../assets/photos/real-principal.jpg';
import chairman from '../assets/photos/real-chairman.jpg';
import founder from '../assets/photos/real-founder-portrait.jpg';
import logo from '../assets/brand/stkv-logo-official.png';
import logoT from '../assets/brand/stkv-logo-transparent.png';

export interface Photo { src: ImageMetadata; alt: string; kind: 'ai' | 'real'; credit?: string }

export const photos = {
  hero: { src: hero, kind: 'ai', alt: 'Laughing students in navy-and-white uniforms running across a sunlit school courtyard' },
  classroom: { src: classroom, kind: 'ai', alt: 'A teacher at a smart board while eager students raise their hands' },
  library: { src: library, kind: 'ai', alt: 'A girl reading a storybook on a cushion between library shelves' },
  lab: { src: lab, kind: 'ai', alt: 'Two senior students in safety goggles watching a colour-changing test tube in the chemistry lab' },
  skating: { src: skating, kind: 'ai', alt: 'Students in helmets roller-skating through cones in an activity hall' },
  riding: { src: riding, kind: 'ai', alt: 'A student on a chestnut horse during a supervised riding lesson at golden hour' },
  computer: { src: computer, kind: 'ai', alt: 'Two senior students building a block-coding project with their teacher' },
  sportsday: { src: sportsday, kind: 'ai', alt: 'A girl breaking the finish tape on sports day as classmates cheer' },
  dance: { src: dance, kind: 'ai', alt: 'Girls in traditional Maharashtrian dress performing a lezim folk dance' },
  art: { src: art, kind: 'ai', alt: 'A student proudly holding up her peacock painting in art class' },
  campus: { src: campus, kind: 'real', credit: 'Campus building — architectural rendering (stkvem.com)', alt: 'Architectural rendering of the STKV school building with white diagonal fins' },
  janmashtami: { src: janmashtami, kind: 'real', credit: 'Janmashtami celebration (stkvem.com)', alt: 'Young students dressed in colourful traditional outfits for Janmashtami' },
  carnival: { src: carnival, kind: 'real', credit: 'Christmas Kids Carnival 2019 (stkvem.com)', alt: 'Hundreds of students and parents at the school Christmas carnival' },
  uniform: { src: uniform, kind: 'real', credit: 'Classroom celebration (stkvem.com)', alt: 'Primary students in school uniform celebrating in their classroom' },
  principal: { src: principal, kind: 'real', alt: 'Shri Pradeep Murlidhar Panigrahi, Principal' },
  chairman: { src: chairman, kind: 'real', alt: 'Shri Vagesh Sadanand Kadam, Chairman' },
  founder: { src: founder, kind: 'real', alt: 'Portrait of Late Shri S. T. Kadam, Founder Chairman, Jeevan Vikas Shikshan Sanstha' },
} satisfies Record<string, Photo>;

export const logoOfficial = logo;
export const logoTransparent = logoT;
