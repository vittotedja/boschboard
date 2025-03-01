"use client";

import {useState, useEffect} from "react";
import {BrainCircuit, Send, User, PlusCircle, Trash2} from "lucide-react";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {ScrollArea} from "@/components/ui/scroll-area";

// Define message type
type Message = {
	role: "user" | "assistant";
	content: string;
};

// Define conversation type
type Conversation = {
	id: string;
	title: string;
	messages: Message[];
};

export default function RagChatPage() {
	// State for conversations
	const [conversations, setConversations] = useState<Conversation[]>(() => {
		// Initialize from sessionStorage if available
		if (typeof window !== "undefined") {
			const saved = sessionStorage.getItem("conversations");
			if (saved) {
				return JSON.parse(saved);
			}
		}
		return [{id: "1", title: "New conversation", messages: []}];
	});

	// State for current conversation
	const [currentConversationId, setCurrentConversationId] =
		useState<string>("1");

	// State for input
	const [input, setInput] = useState("");

	// State for loading
	const [isLoading, setIsLoading] = useState(false);

	// Get current conversation
	const currentConversation =
		conversations.find((c) => c.id === currentConversationId) ||
		conversations[0];

	// Save conversations to sessionStorage when they change
	useEffect(() => {
		sessionStorage.setItem("conversations", JSON.stringify(conversations));
	}, [conversations]);

	// Handle sending a message
	const handleSendMessage = async () => {
		if (!input.trim()) return;

		// Add user message
		const userMessage: Message = {role: "user", content: input};

		// Update conversations
		const updatedConversations = conversations.map((conv) => {
			if (conv.id === currentConversationId) {
				return {
					...conv,
					messages: [...conv.messages, userMessage],
				};
			}
			return conv;
		});

		setConversations(updatedConversations);
		setInput("");
		setIsLoading(true);

		// Simulate AI response (in a real app, this would call your RAG API)
		setTimeout(() => {
			// Generate AI response
			const aiResponse: Message = {
				role: "assistant",
				content: `This is a simulated RAG response to: "${input}". In a real implementation, this would retrieve relevant information from your Rexroth knowledge base and generate a contextual response.`,
			};

			// Update conversations with AI response
			const finalConversations = updatedConversations.map((conv) => {
				if (conv.id === currentConversationId) {
					return {
						...conv,
						messages: [...conv.messages, aiResponse],
					};
				}
				return conv;
			});

			setConversations(finalConversations);
			setIsLoading(false);
		}, 1000);
	};

	// Create a new conversation
	const createNewConversation = () => {
		const newId = Date.now().toString();
		const newConversation: Conversation = {
			id: newId,
			title: "New conversation",
			messages: [],
		};

		setConversations([...conversations, newConversation]);
		setCurrentConversationId(newId);
	};

	// Clear current conversation
	const clearCurrentConversation = () => {
		const updatedConversations = conversations.map((conv) => {
			if (conv.id === currentConversationId) {
				return {
					...conv,
					messages: [],
				};
			}
			return conv;
		});

		setConversations(updatedConversations);
	};

	return (
		<div className="flex h-[96vh] bg-white text-gray-900">
			{/* Sidebar */}
			<div className="w-64 border-r border-gray-200 flex flex-col">
				<div className="p-4">
					<Button
						onClick={createNewConversation}
						className="w-full bg-sky-950 hover:bg-sky-900 text-white"
					>
						<PlusCircle className="mr-2 h-4 w-4" />
						New Chat
					</Button>
				</div>

				<ScrollArea className="flex-1">
					<div className="p-2 space-y-2">
						{conversations.map((conv) => (
							<Button
								key={conv.id}
								variant={
									conv.id === currentConversationId ? "secondary" : "ghost"
								}
								className={`w-full justify-start text-left ${
									conv.id === currentConversationId
										? "bg-sky-250 text-sky-950"
										: "text-sky-950 hover:bg-gray-100"
								}`}
								onClick={() => setCurrentConversationId(conv.id)}
							>
								{conv.title}
							</Button>
						))}
					</div>
				</ScrollArea>

				<div className="p-4 border-t border-gray-200">
					<div className="text-xs text-gray-500">Powered by AI SDK</div>
				</div>
			</div>

			{/* Main content */}
			<div className="flex-1 flex flex-col">
				{/* Chat header */}
				<div className="p-4 border-b border-gray-200 flex justify-between items-center">
					<h1 className="text-xl font-semibold text-sky-950">
						BoschBoard Knowledge Assistant
					</h1>
					<Button
						variant="ghost"
						size="icon"
						className="text-sky-950 hover:text-red-600 hover:bg-sky-250"
						onClick={clearCurrentConversation}
					>
						<Trash2 className="h-5 w-5" />
					</Button>
				</div>

				{/* Chat messages */}
				<ScrollArea className="flex-1 p-4">
					<div className="space-y-6 max-w-3xl mx-auto">
						{currentConversation.messages.length === 0 ? (
							<div className="text-center py-12">
								<div className="inline-block p-4 rounded-full bg-sky-250 mb-4">
									<BrainCircuit className="h-8 w-8 text-sky-950" />
								</div>
								<h2 className="text-xl font-semibold text-sky-950 mb-2">
									How can I help you with Rexroth today?
								</h2>
								<p className="text-gray-600 max-w-md mx-auto">
									Ask me anything about Rexroth products, specifications, or
									applications.
								</p>
							</div>
						) : (
							currentConversation.messages.map((message, index) => (
								<div
									key={index}
									className={`flex ${
										message.role === "user" ? "justify-end" : "justify-start"
									}`}
								>
									<div
										className={`flex gap-3 max-w-[80%] ${
											message.role === "user"
												? "bg-sky-200 text-black"
												: "text-sky-950"
										} p-4 rounded-lg`}
									>
										<div className="flex-shrink-0">
											{message.role === "user" ? (
												<User className="h-5 w-5" />
											) : (
												<BrainCircuit className="h-5 w-5" />
											)}
										</div>
										<div>{message.content}</div>
									</div>
								</div>
							))
						)}

						{isLoading && (
							<div className="flex justify-start">
								<div className="flex gap-3 max-w-[80%] bg-sky-250 text-sky-950 p-4 rounded-lg">
									<div className="flex-shrink-0 mt-1">
										<BrainCircuit className="h-5 w-5" />
									</div>
									<div className="flex items-center gap-1">
										<div
											className="h-2 w-2 bg-sky-950 rounded-full animate-bounce"
											style={{animationDelay: "0ms"}}
										></div>
										<div
											className="h-2 w-2 bg-sky-950 rounded-full animate-bounce"
											style={{animationDelay: "150ms"}}
										></div>
										<div
											className="h-2 w-2 bg-sky-950 rounded-full animate-bounce"
											style={{animationDelay: "300ms"}}
										></div>
									</div>
								</div>
							</div>
						)}
					</div>
				</ScrollArea>

				{/* Input area */}
				<div className="p-4 border-t border-gray-200">
					<div className="max-w-3xl mx-auto">
						<div className="relative">
							<Input
								value={input}
								onChange={(e) => setInput(e.target.value)}
								onKeyDown={(e) => {
									if (e.key === "Enter" && !e.shiftKey) {
										e.preventDefault();
										handleSendMessage();
									}
								}}
								placeholder="Ask about Rexroth products, specifications, or applications..."
								className="pr-12 py-6 bg-white border-sky-250 text-gray-900 placeholder:text-gray-500 focus-visible:ring-red-600"
							/>
							<Button
								onClick={handleSendMessage}
								disabled={isLoading || !input.trim()}
								className="absolute right-2 top-1/2 -translate-y-1/2 bg-sky-950 hover:bg-black text-white"
								size="icon"
							>
								<Send className="h-4 w-4" />
							</Button>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
