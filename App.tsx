
import React, { useState, useCallback, useMemo } from 'react';
import { AppStep, AnalysisResult, Thread, ReportTopic } from './types';
import { RANKING_EMOJI } from './constants';
import { processCsvFile } from './services/csvProcessor';
import { generateTopicDetails } from './services/geminiService';
import { formatJapaneseDateRange, formatDateForInput } from './utils/dateUtils';
import { StepIndicator } from './components/StepIndicator';
import { UploadIcon } from './components/icons/UploadIcon';
import { CopyIcon } from './components/icons/CopyIcon';
import { CheckIcon } from './components/icons/CheckIcon';

const App: React.FC = () => {
  const [step, setStep] = useState<AppStep>(AppStep.Upload);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [reportText, setReportText] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [isCopied, setIsCopied] = useState<boolean>(false);

  const handleFileDrop = useCallback(async (file: File | null) => {
    if (!file) return;
    setError(null);
    setIsLoading(true);
    try {
      const result = await processCsvFile(file);
      setAnalysisResult(result);

      const defaultEndDate = result.dateRange.max;
      const defaultStartDate = new Date(defaultEndDate);
      defaultStartDate.setDate(defaultStartDate.getDate() - 6);

      setStartDate(formatDateForInput(defaultStartDate < result.dateRange.min ? result.dateRange.min : defaultStartDate));
      setEndDate(formatDateForInput(defaultEndDate));
      
      setStep(AppStep.Configure);
    } catch (err) {
      setError(err instanceof Error ? err.message : '不明なエラーが発生しました。');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleGenerateReport = useCallback(async () => {
    if (!analysisResult) return;
    setError(null);
    setIsLoading(true);
    setStep(AppStep.Generate);

    try {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);

      const filteredThreads = analysisResult.threads.filter(t => 
        t.parent.date >= start && t.parent.date <= end
      );

      const generalThreads = filteredThreads.filter(t => t.area === 'general').sort((a,b) => b.engagementScore - a.engagementScore).slice(0, 3);
      const paidThreads = filteredThreads.filter(t => t.area === 'paid').sort((a,b) => b.engagementScore - a.engagementScore).slice(0, 3);
      
      const generateTopics = async (threads: Thread[]): Promise<ReportTopic[]> => {
        const promises = threads.map((thread, index) => 
          generateTopicDetails(thread).then(details => ({
            rank: index,
            channelName: thread.parent.channel_name,
            title: details.title,
            summary: details.summary,
            url: thread.parent.comment_url
          }))
        );
        return await Promise.all(promises);
      };

      const [generalTopics, paidTopics] = await Promise.all([
          generateTopics(generalThreads),
          generateTopics(paidThreads)
      ]);

      const formatTopics = (topics: ReportTopic[]): string => {
        if (topics.length === 0) return '今週は特に目立った話題はありませんでした。\n';
        return topics
          .map(t => 
            `${RANKING_EMOJI[t.rank] || '🔹'} #${t.channelName} で「${t.title}」\n→ ${t.summary}\n💬 スレッドを見る: ${t.url}\n`
          )
          .join('\n');
      };

      const report = `＿＿＿＿＿＿＿＿＿＿＿
📅 ${analysisResult.serverName}週報
${formatJapaneseDateRange(start, end)}
＿＿＿＿＿＿＿＿＿＿＿

こんにちは！今週も${analysisResult.serverName}で様々な交流がありました。
今週のトピックスをお届けします✨

《一般エリア》
【🔥 今週盛り上がった話題 TOP${generalTopics.length}】

${formatTopics(generalTopics)}
《有料エリア》
【🔥 今週盛り上がった話題 TOP${paidTopics.length}】

${formatTopics(paidTopics)}
＿＿＿＿＿＿＿＿＿＿＿
それでは、来週も活発な交流を楽しみにしています！
良い週末をお過ごしください 🌟
＿＿＿＿＿＿＿＿＿＿＿`;
      
      setReportText(report);

    } catch (err) {
      setError(err instanceof Error ? err.message : '週報の生成中にエラーが発生しました。');
    } finally {
      setIsLoading(false);
    }
  }, [analysisResult, startDate, endDate]);

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(reportText);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const restart = () => {
    setStep(AppStep.Upload);
    setAnalysisResult(null);
    setError(null);
    setReportText('');
    setStartDate('');
    setEndDate('');
  };
  
  const FileUploadScreen = () => (
    <div className="text-center">
      <h2 className="text-2xl font-bold text-brand-text mb-2">週報を作成する</h2>
      <p className="text-gray-600 mb-8">コミュニティの活動データ(CSV)をアップロードしてください。</p>
      <div 
        className="relative border-2 border-dashed border-gray-300 rounded-xl p-12 text-center cursor-pointer hover:border-brand-primary hover:bg-brand-secondary transition-all duration-300"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
            e.preventDefault();
            handleFileDrop(e.dataTransfer.files[0]);
        }}
      >
        <div className="flex flex-col items-center text-gray-500">
          <UploadIcon className="w-16 h-16 mb-4 text-gray-400" />
          <p className="font-semibold">ここにファイルをドラッグ＆ドロップ</p>
          <p className="text-sm my-2">または</p>
          <input 
            type="file" 
            accept=".csv"
            className="hidden"
            id="file-upload"
            onChange={(e) => handleFileDrop(e.target.files ? e.target.files[0] : null)}
          />
          <label htmlFor="file-upload" className="bg-brand-primary text-white font-bold py-2 px-4 rounded-lg hover:bg-opacity-90 transition-colors cursor-pointer">
            ファイルを選択
          </label>
           <p className="text-xs text-gray-400 mt-4">ファイルサイズ10MBまで</p>
        </div>
      </div>
    </div>
  );

  const ReportConfigScreen = () => analysisResult && (
    <div className="text-center">
      <h2 className="text-2xl font-bold text-brand-text mb-2">データ読み込み完了</h2>
      <p className="text-gray-600 mb-8">週報を作成する期間を選択してください。</p>
      
      <div className="bg-white rounded-lg shadow-md p-6 mb-8 text-left grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
            <h3 className="font-bold text-brand-text mb-4">データ概要</h3>
            <div className="space-y-2 text-sm text-gray-700">
              <p><strong>コミュニティ名:</strong> {analysisResult.serverName}</p>
              <p><strong>総投稿数:</strong> {analysisResult.stats.postCount}件</p>
              <p><strong>投稿ユーザー数:</strong> {analysisResult.stats.userCount}人</p>
              <p><strong>チャンネル数:</strong> {analysisResult.stats.channelCount}</p>
            </div>
        </div>
        <div>
            <h3 className="font-bold text-brand-text mb-4">データ期間</h3>
             <p className="text-sm text-gray-700">{formatJapaneseDateRange(analysisResult.dateRange.min, analysisResult.dateRange.max)}</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <input 
              type="date"
              value={startDate}
              min={formatDateForInput(analysisResult.dateRange.min)}
              max={endDate || formatDateForInput(analysisResult.dateRange.max)}
              onChange={(e) => setStartDate(e.target.value)}
              className="border border-gray-300 rounded-lg p-2 w-full sm:w-auto"
            />
            <span className="text-gray-500">〜</span>
            <input 
              type="date"
              value={endDate}
              min={startDate || formatDateForInput(analysisResult.dateRange.min)}
              max={formatDateForInput(analysisResult.dateRange.max)}
              onChange={(e) => setEndDate(e.target.value)}
              className="border border-gray-300 rounded-lg p-2 w-full sm:w-auto"
            />
        </div>
        <button 
          onClick={handleGenerateReport} 
          className="mt-6 bg-brand-primary text-white font-bold py-3 px-8 rounded-lg hover:bg-opacity-90 transition-colors text-lg w-full sm:w-auto"
        >
          週報を生成する
        </button>
      </div>
    </div>
  );

  const ReportDisplayScreen = () => (
    <div className="text-center">
      <h2 className="text-2xl font-bold text-brand-text mb-2">週報が生成されました！</h2>
      <p className="text-gray-600 mb-8">内容を確認し、コピーしてご利用ください。</p>
      <div className="relative bg-white rounded-lg shadow-md">
        <div className="max-h-[70vh] overflow-y-auto rounded-lg">
            <pre className="p-6 text-left font-sans text-sm text-gray-800 leading-relaxed whitespace-pre-wrap break-words">
                {reportText}
            </pre>
        </div>
        <button
          onClick={handleCopyToClipboard}
          className="absolute top-4 right-4 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-4 rounded-lg flex items-center gap-2 transition-colors"
        >
          {isCopied ? <CheckIcon className="w-5 h-5 text-green-600" /> : <CopyIcon className="w-5 h-5" />}
          {isCopied ? 'コピーしました' : 'コピー'}
        </button>
      </div>
      <button
        onClick={restart}
        className="mt-6 bg-gray-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-opacity-90 transition-colors text-lg"
      >
        最初からやり直す
      </button>
    </div>
  );

  const LoadingScreen = () => (
      <div className="flex flex-col items-center justify-center text-center h-64">
          <svg className="animate-spin -ml-1 mr-3 h-12 w-12 text-brand-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <h2 className="text-2xl font-bold text-brand-text mt-4">
              {step === AppStep.Upload ? 'ファイルを処理中...' : 'AIが週報を生成中...'}
          </h2>
          <p className="text-gray-600 mt-2">しばらくお待ちください。この処理には最大で1分ほどかかる場合があります。</p>
      </div>
  );

  const renderContent = () => {
    if (isLoading) return <LoadingScreen />;
    switch(step) {
      case AppStep.Upload: return <FileUploadScreen />;
      case AppStep.Configure: return <ReportConfigScreen />;
      case AppStep.Generate: return reportText ? <ReportDisplayScreen /> : <LoadingScreen />;
      default: return <FileUploadScreen />;
    }
  };

  return (
    <div className="min-h-screen bg-brand-secondary p-4 sm:p-8">
      <div className="max-w-4xl mx-auto">
        <header className="text-center mb-10">
          <h1 className="text-4xl font-extrabold text-brand-text">コミュニティ週報作成アプリ</h1>
          <p className="text-gray-500 mt-2">CSVからAIで魅力的な週報を自動生成</p>
        </header>
        <main className="bg-white rounded-2xl shadow-xl p-6 sm:p-10">
          <StepIndicator currentStep={step} />
          {error && (
            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded-r-lg" role="alert">
              <p className="font-bold">エラー</p>
              <p>{error}</p>
            </div>
          )}
          {renderContent()}
        </main>
        <footer className="text-center mt-8 text-gray-500 text-sm">
            <p>&copy; {new Date().getFullYear()} Community Report Generator. All rights reserved.</p>
        </footer>
      </div>
    </div>
  );
};

export default App;
