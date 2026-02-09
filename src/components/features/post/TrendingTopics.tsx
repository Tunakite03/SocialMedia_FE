import { useState, useEffect } from 'react';
import { TrendingUp, Hash, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface TrendingTopic {
   id: string;
   tag: string;
   count: number;
   trend: 'up' | 'down' | 'stable';
}

const TrendingTopics = () => {
   const navigate = useNavigate();
   const [trendingTopics, setTrendingTopics] = useState<TrendingTopic[]>([]);
   const [loading, setLoading] = useState(true);

   useEffect(() => {
      // Simulated trending topics - replace with actual API call
      const fetchTrendingTopics = async () => {
         try {
            // TODO: Replace with actual API endpoint
            // const response = await apiService.getTrendingTopics();
            
            // Mock data for demonstration
            const mockTopics: TrendingTopic[] = [
               { id: '1', tag: 'technology', count: 1234, trend: 'up' },
               { id: '2', tag: 'photography', count: 892, trend: 'up' },
               { id: '3', tag: 'travel', count: 756, trend: 'stable' },
               { id: '4', tag: 'food', count: 645, trend: 'up' },
               { id: '5', tag: 'fitness', count: 523, trend: 'down' },
               { id: '6', tag: 'art', count: 489, trend: 'stable' },
            ];
            
            setTrendingTopics(mockTopics);
         } catch (error) {
            console.error('Failed to fetch trending topics:', error);
         } finally {
            setLoading(false);
         }
      };

      fetchTrendingTopics();
      // Refresh every 5 minutes
      const interval = setInterval(fetchTrendingTopics, 5 * 60 * 1000);
      return () => clearInterval(interval);
   }, []);

   const handleTopicClick = (tag: string) => {
      navigate(`/search?q=${encodeURIComponent('#' + tag)}`);
   };

   const formatCount = (count: number): string => {
      if (count >= 1000) {
         return `${(count / 1000).toFixed(1)}K`;
      }
      return count.toString();
   };

   const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
      switch (trend) {
         case 'up':
            return <TrendingUp className='w-3 h-3 text-green-500' />;
         case 'down':
            return <TrendingUp className='w-3 h-3 text-red-500 rotate-180' />;
         default:
            return <div className='w-3 h-3 bg-gray-400 rounded-full' />;
      }
   };

   if (loading) {
      return (
         <div className='bg-card rounded-lg shadow-sm p-4 mb-4 border border-border'>
            <div className='flex items-center gap-2 mb-3'>
               <Sparkles className='w-4 h-4 text-primary' />
               <h2 className='text-sm font-semibold text-card-foreground'>Trending Topics</h2>
            </div>
            <div className='space-y-2'>
               {[1, 2, 3].map((i) => (
                  <div key={i} className='animate-pulse flex items-center gap-2 p-2'>
                     <div className='w-8 h-8 bg-muted rounded' />
                     <div className='flex-1'>
                        <div className='h-3 bg-muted rounded w-3/4 mb-1' />
                        <div className='h-2 bg-muted rounded w-1/2' />
                     </div>
                  </div>
               ))}
            </div>
         </div>
      );
   }

   if (trendingTopics.length === 0) {
      return (
         <div className='bg-card rounded-lg shadow-sm p-4 mb-4 border border-border'>
            <div className='flex items-center gap-2 mb-3'>
               <Sparkles className='w-4 h-4 text-primary' />
               <h2 className='text-sm font-semibold text-card-foreground'>Trending Topics</h2>
            </div>
            <p className='text-sm text-muted-foreground text-center py-2'>No trending topics right now</p>
         </div>
      );
   }

   return (
      <div className='bg-card rounded-lg shadow-sm p-4 mb-4 border border-border anime-fade-in'>
         <div className='flex items-center justify-between mb-3'>
            <div className='flex items-center gap-2'>
               <Sparkles className='w-4 h-4 text-primary anime-pulse' />
               <h2 className='text-sm font-semibold text-card-foreground'>Trending Topics</h2>
            </div>
            <span className='text-xs text-muted-foreground'>Updated now</span>
         </div>

         <div className='space-y-2'>
            {trendingTopics.map((topic, index) => (
               <div
                  key={topic.id}
                  onClick={() => handleTopicClick(topic.tag)}
                  className='flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-muted/50 transition-all anime-hover-lift'
                  style={{ animationDelay: `${index * 50}ms` }}
               >
                  <div className='flex items-center justify-center w-8 h-8 bg-primary/10 rounded-lg'>
                     <Hash className='w-4 h-4 text-primary' />
                  </div>
                  
                  <div className='flex-1 min-w-0'>
                     <div className='flex items-center gap-2'>
                        <p className='text-sm font-medium text-card-foreground truncate'>
                           #{topic.tag}
                        </p>
                        {getTrendIcon(topic.trend)}
                     </div>
                     <p className='text-xs text-muted-foreground'>
                        {formatCount(topic.count)} posts
                     </p>
                  </div>

                  <div className='flex items-center justify-center w-6 h-6 bg-accent/10 rounded-full text-xs font-medium text-accent'>
                     {index + 1}
                  </div>
               </div>
            ))}
         </div>

         <div className='mt-3 pt-3 border-t border-border'>
            <button
               onClick={() => navigate('/search')}
               className='w-full text-xs text-primary hover:text-primary/80 font-medium transition-colors'
            >
               Explore more topics →
            </button>
         </div>
      </div>
   );
};

export default TrendingTopics;
