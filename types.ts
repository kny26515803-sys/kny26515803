
export interface ScriptLine {
  speaker: string;
  text: string;
  direction?: string;
}

export interface ImagePrompt {
  scene: string;
  prompt: string;
}

export interface YouTubeMetadata {
  titles: string[];
  description: string;
  thumbnailText: string;
  summary: string;     // 스크립트 150자 요약
  hashtags: string;    // 해시태그 7개 (1줄)
  keywords: string;    // 키워드 30개 (1줄, 모든 키워드 뒤 쉼표 부착)
}

export interface GeneratedContent {
  analysis: string;
  script: ScriptLine[];
  pythonCode: string;
  imagePrompts: ImagePrompt[];
  metadata: YouTubeMetadata;
}

export enum VisualStyle {
  REALISTIC = "Cinematic Realistic",
  GHIBLI = "Ghibli Style Animation",
  PIXAR = "3D Pixar Style",
  WATERCOLOR = "Watercolor Illustration",
  NOIR = "Black & White Noir",
  CYBERPUNK = "Cyberpunk Futuristic",
  OILPAINTING = "Classic Oil Painting",
  SKETCH = "Ink Sketch Illustration",
  VINTAGE = "Vintage 16mm Film",
  RETRO80S = "80s Retro Anime"
}

export type StoryLength = '1min' | '3min' | '5min';
export type PassengerGender = 'male' | 'female';
export type DriverGender = 'male' | 'female';
export type DriverAge = '40s' | '50s' | '60s' | '70s';
export type PassengerAge = '20s' | '30s' | '40s' | '50s' | '60s' | '70s';

export interface GenerationRequest {
  topic: string;
  style: VisualStyle;
  length: StoryLength;
  passengerGender: PassengerGender;
  driverGender: DriverGender;
  driverAge: DriverAge;
  passengerAge: PassengerAge;
}
