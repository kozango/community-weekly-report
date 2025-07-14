
import { GoogleGenAI } from "@google/genai";
import { Thread } from '../types';
import { cleanMessage } from '../utils/textUtils';

// Ensure API key is available, but do not expose UI for it.
if (!process.env.API_KEY) {
  // In a real app, you might have a fallback or a more graceful error state.
  // For this context, we assume the key is set in the environment.
  console.error("API_KEY environment variable not set.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
const model = 'gemini-2.5-flash';

const generateTitle = async (threadContent: string): Promise<string> => {
    if (!threadContent.trim()) {
        return "コミュニティでの交流";
    }
    try {
        const prompt = `あなたはオンラインコミュニティの優秀なコピーライターです。以下の会話スレッドの内容を要約し、15〜25文字でキャッチーなタイトルを生成してください。タイトルは「〇〇について語り合い」「△△の体験談」のような、親しみやすく魅力的な形式にしてください。引用符は含めないでください。\n\n会話内容:\n---\n${threadContent}`;

        const response = await ai.models.generateContent({
            model: model,
            contents: prompt,
            config: {
                temperature: 0.7,
            }
        });

        return response.text.trim().replace(/["「」]/g, '');
    } catch (error) {
        console.error("Error generating title:", error);
        return "注目のトピック"; // Fallback title
    }
};

const generateSummary = async (threadContent: string, reactionCount: number, replyCount: number): Promise<string> => {
    if (!threadContent.trim()) {
        return "メンバー間で活発なやり取りがありました。";
    }
    try {
        const prompt = `あなたはコミュニティマネージャーのアシスタントです。以下の会話スreadの内容を分析し、50〜100文字で自然で親しみやすい要約文を作成してください。このスレッドは${reactionCount}件のリアクションと${replyCount}件の返信がありました。このエンゲージメント数を「○件の返信で活発な議論に」「多くの共感を集めました」のように、会話の盛り上がりを表現する文脈に含めてください。\n\n会話内容:\n---\n${threadContent}`;
        
        const response = await ai.models.generateContent({
            model: model,
            contents: prompt,
             config: {
                temperature: 0.8,
            }
        });

        return response.text.trim();
    } catch (error) {
        console.error("Error generating summary:", error);
        return `合計${reactionCount + replyCount}件のエンゲージメントがあり、大変盛り上がりました。`; // Fallback summary
    }
};

export const generateTopicDetails = async (thread: Thread): Promise<{ title: string; summary: string }> => {
    const threadMessages = [thread.parent, ...thread.replies]
        .map(p => cleanMessage(p.message))
        .filter(Boolean)
        .join('\n');

    // Generate title and summary in parallel
    const [title, summary] = await Promise.all([
        generateTitle(threadMessages),
        generateSummary(threadMessages, thread.totalReactionCount, thread.replies.length),
    ]);
    
    return { title, summary };
};
