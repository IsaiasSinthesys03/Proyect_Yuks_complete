export interface CreateYoutubeVideoDTO {
  title: string;
  youtube_url: string;
  is_active?: boolean;
}

export interface UpdateYoutubeVideoDTO {
  title?: string;
  youtube_url?: string;
  position?: number;
  is_active?: boolean;
}

export interface ReorderYoutubeVideosDTO {
  videos: { id: string; position: number }[];
}
