
import Papa from 'papaparse';
import { RawPost, ProcessedPost, Thread, AnalysisResult } from '../types';
import { REQUIRED_COLUMNS } from '../constants';
import { parseDate } from '../utils/dateUtils';

export const processCsvFile = (file: File): Promise<AnalysisResult> => {
  return new Promise((resolve, reject) => {
    if (file.size > 10 * 1024 * 1024) {
      return reject(new Error('ファイルサイズは10MB以下にしてください。'));
    }

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      encoding: "UTF-8",
      complete: (results) => {
        const { data, errors, meta } = results;

        if (errors.length > 0) {
          console.error('CSV parsing errors:', errors);
          return reject(new Error(`CSVの解析中にエラーが発生しました: ${errors[0].message}`));
        }

        if (!meta.fields || REQUIRED_COLUMNS.some(col => !meta.fields?.includes(col))) {
          return reject(new Error(`必要なカラムが不足しています。必須: ${REQUIRED_COLUMNS.join(', ')}`));
        }
        
        try {
          const analysisResult = analyzeData(data as RawPost[]);
          resolve(analysisResult);
        } catch(e) {
          if (e instanceof Error) {
            reject(e);
          } else {
            reject(new Error("データ分析中に不明なエラーが発生しました。"));
          }
        }
      },
      error: (error) => {
        reject(new Error(`ファイルの読み込みに失敗しました: ${error.message}`));
      },
    });
  });
};


const analyzeData = (posts: RawPost[]): AnalysisResult => {
    let minDate = new Date();
    let maxDate = new Date(1970, 0, 1);
    const users = new Set<string>();
    const channels = new Set<string>();
    let serverName = posts.length > 0 ? posts[0].server_name : 'コミュニティ';

    const processedPosts: ProcessedPost[] = posts.map((post, index) => {
      const date = parseDate(post.post_datetime);
      if (!date) {
        throw new Error(`${index + 2}行目の投稿日時形式が不正です: ${post.post_datetime}`);
      }
      if (date < minDate) minDate = date;
      if (date > maxDate) maxDate = date;
      users.add(post.poster_name);
      channels.add(post.channel_name);
      
      return {
        ...post,
        date,
        reaction_count: Number(post.reaction_count) || 0,
        reply_count: Number(post.reply_count) || 0,
        // Assuming each row in the CSV needs a unique ID for processing
        id: `${post.comment_url}-${index}` 
      };
    });

    if (processedPosts.length === 0) {
      throw new Error("CSVファイルに有効なデータがありません。");
    }

    const threads = buildThreads(processedPosts);

    return {
      threads,
      serverName,
      dateRange: { min: minDate, max: maxDate },
      stats: {
          postCount: processedPosts.length,
          userCount: users.size,
          channelCount: channels.size,
      }
    };
}


const buildThreads = (posts: ProcessedPost[]): Thread[] => {
    const threadMap = new Map<string, Thread>();
    const postsById = new Map<string, ProcessedPost>(posts.map(p => [p.id, p]));

    // First pass: create threads from parent posts
    for (const post of posts) {
        if (post.message_type === 'parent') {
            const area = (post.user_type === '有料' || post.channel_type === '限定') ? 'paid' : 'general';
            threadMap.set(post.id, {
                parent: post,
                replies: [],
                totalReactionCount: post.reaction_count,
                engagementScore: 0, // Will be calculated later
                area: area,
            });
        }
    }

    // Second pass: add replies to threads
    for (const post of posts) {
        if (post.message_type === 'reply' && post.parent_id) {
            // Find parent post by traversing up if needed
            let currentPost = post;
            let parentThread = threadMap.get(currentPost.parent_id);
            
            // This logic assumes parent_id refers to another post's ID in the dataset
            // Let's adjust to a more common pattern where parent_id points to the thread's root post
            const rootPostId = post.parent_id; 
            const thread = threadMap.get(rootPostId);
            
            if (thread) {
                thread.replies.push(post);
                thread.totalReactionCount += post.reaction_count;
            }
        }
    }
    
    // Final pass: calculate engagement score
    for (const thread of threadMap.values()) {
        thread.engagementScore = thread.totalReactionCount + thread.replies.length;
        // Sort replies by date
        thread.replies.sort((a, b) => a.date.getTime() - b.date.getTime());
    }

    return Array.from(threadMap.values());
};
