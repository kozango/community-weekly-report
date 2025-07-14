
export interface RawPost {
  poster_name: string;
  post_datetime: string;
  channel_name: string;
  reaction_count: number;
  reply_count: number;
  parent_id: string;
  message_type: 'parent' | 'reply';
  user_type: '有料' | '無料';
  channel_type: '限定' | '一般';
  message: string;
  comment_url: string;
  server_name: string;
  premium_badges: string;
  id: string; // Unique identifier for each post
}

export interface ProcessedPost extends RawPost {
  date: Date;
}

export interface Thread {
  parent: ProcessedPost;
  replies: ProcessedPost[];
  totalReactionCount: number;
  engagementScore: number;
  area: 'general' | 'paid';
}

export interface ReportTopic {
  rank: number;
  channelName: string;
  title: string;
  summary: string;
  url: string;
}

export interface AnalysisResult {
  threads: Thread[];
  serverName: string;
  dateRange: {
    min: Date;
    max: Date;
  };
  stats: {
    postCount: number;
    userCount: number;
    channelCount: number;
  }
}

export enum AppStep {
  Upload = 1,
  Configure = 2,
  Generate = 3,
}
