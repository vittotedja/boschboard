'use client';

import { useState, useEffect, useRef } from 'react';
import { BrainCircuit, Send, User, Trash2, PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/atom-one-dark.css';

type Message = {
  role: "user" | "assistant";
  content: string;
};

type Conversation = {
  id: string;
  title: string;
  messages: Message[];
};

export default function RagChatPage() {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<Conversation>({
    id: 'default',
    title: 'New Chat',
    messages: []
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [currentConversation.messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    setLoading(true);
    const newMessages = [...currentConversation.messages, 
      { role: 'user', content: input },
    ];

    try {
      const response = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: input }),
      });

      if (!response.ok) throw new Error('Failed to fetch data');
      
      const data = await response.json();
      newMessages.push({ role: 'assistant', content: data.answer });
      
      setCurrentConversation(prev => ({
        ...prev,
        messages: newMessages
      }));
      setInput('');
    } catch (error) {
      console.error('Error:', error);
      newMessages.push({ 
        role: 'assistant', 
        content: 'Sorry, there was an error processing your request.'
      });
    } finally {
      setLoading(false);
    }
  };

  const createNewConversation = () => {
    const newConv = {
      id: Date.now().toString(),
      title: 'New Chat',
      messages: []
    };
    setConversations(prev => [...prev, newConv]);
    setCurrentConversation(newConv);
  };

  return (
    <div className="flex h-[96vh] bg-white text-gray-900">
      {/* Sidebar */}
      
      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-scroll">

        <div className="p-4 border-b border-gray-200 flex justify-between items-center sticky top-0 z-10 bg-white">
          <h1 className="text-xl font-semibold text-sky-950">
            BoschBoard Knowledge Assistant
          </h1>
          <Button
            variant="ghost"
            size="icon"
            className="text-sky-950 hover:bg-sky-100"
            onClick={() => setCurrentConversation(prev => ({ ...prev, messages: [] }))}
          >
            <Trash2 className="h-5 w-5" />
          </Button>
        </div>

        <ScrollArea className="flex-1 z-0">
          <div className="max-w-3xl mx-auto p-4 space-y-4">
            {currentConversation.messages.map((message, index) => (
              <div 
                key={index}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex gap-3 max-w-[90%] ${
                  message.role === 'user' 
                    ? 'bg-sky-950 text-white' 
                    : 'bg-white border border-gray-200'
                } p-4 rounded-xl shadow-sm`}>
                  <div className="flex-shrink-0 pt-1">
                    {message.role === 'user' ? (
                      <User className="h-5 w-5" />
                    ) : (
                      <BrainCircuit className="h-5 w-5 text-sky-950" />
                    )}
                  </div>
                  <div className="prose prose-sm max-w-none">
                    {message.role === 'user' ? (
                      message.content
                    ) : (
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        rehypePlugins={[rehypeHighlight]}
                      >
                        {message.content}
                      </ReactMarkdown>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="flex gap-3 bg-white border border-gray-200 p-4 rounded-xl">
                  <div className="flex-shrink-0 pt-1">
                    <BrainCircuit className="h-5 w-5 text-sky-950 animate-pulse" />
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="h-2 w-2 bg-sky-950 rounded-full animate-bounce" />
                    <div className="h-2 w-2 bg-sky-950 rounded-full animate-bounce delay-150" />
                    <div className="h-2 w-2 bg-sky-950 rounded-full animate-bounce delay-300" />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        <div className="p-4 border-t border-gray-200 bg-white sticky bottom-0">
          <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
            <div className="relative">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e);
                  }
                }}
                placeholder="Ask about Rexroth products, specifications, or applications..."
                className="pr-12 py-6 bg-white border-gray-200 focus:border-sky-300 placeholder:text-gray-400 focus-visible:ring-sky-300"
              />
              <Button
                type="submit"
                disabled={loading || !input.trim()}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-sky-950 hover:bg-sky-900 text-white"
                size="icon"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}