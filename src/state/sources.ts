import _sources from "../manifest.json";

export interface SourceData {
  url: string;
  image: string;
  duration: number;
}

export const sources: SourceData[] = _sources;
