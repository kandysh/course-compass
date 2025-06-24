"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  SendHorizonal,
  Bot,
  User,
  CornerDownLeft,
  MessageCircle,
} from "lucide-react";
import {
  startOrGetChatSession,
  getChatMessages,
  saveChatMessage,
} from "@/app/actions";
import type { Course, ChatMessage as DbChatMessage } from "@/lib/data";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  courseChatbotFlow,
  CourseChatbotInput,
  CourseChatbotOutput,
} from "@/ai/flows/course-chatbot";
import { runFlow } from "@genkit-ai/next/client";

interface ClientMessage {
  id: number;
  sessionId?: number;
  sender: "student" | "bot";
  text: string;
  timestamp: Date;
}

interface ChatbotClientProps {
  studentId: number;
  selectedCourse: Course | null;
  allCourses: Course[];
  onSetSelectedCourseAction: (course: Course | null) => void;
  initialContext?: string;
}

function renderMessageContent(text: string): JSX.Element[] {
  const segments = text.split(/(```[\s\S]*?```)/g);

  return segments
    .map((segment, index) => {
      if (segment.startsWith("```") && segment.endsWith("```")) {
        let codeContent = segment.slice(3, -3);
        const languageMatch = codeContent.match(/^(\w+)\n/);
        let language = "";
        if (languageMatch) {
          language = languageMatch[1];
          codeContent = codeContent.substring(languageMatch[0].length);
        }
        codeContent = codeContent.replace(/^\n|\n$/g, "");

        if (codeContent.trim() === "") return null;

        return (
          <pre
            key={`code-${index}`}
            className="bg-muted p-3 rounded-md my-1 overflow-x-auto text-sm"
          >
            {language && (
              <span className="block text-xs text-muted-foreground mb-1">
                {language}
              </span>
            )}
            <code className="font-mono text-foreground">{codeContent}</code>
          </pre>
        );
      } else if (segment.trim() !== "") {
        return segment
          .split("\n")
          .map((line, lineIndex) =>
            line.trim() !== "" ? (
              <p key={`text-${index}-${lineIndex}`} className="text-sm my-0.5">
                {line}
              </p>
            ) : null,
          )
          .filter(Boolean) as JSX.Element[];
      }
      return null;
    })
    .flat()
    .filter(Boolean) as JSX.Element[];
}

export function ChatbotClient({
  studentId,
  selectedCourse,
  allCourses,
  onSetSelectedCourseAction,
}: ChatbotClientProps) {
  const [messages, setMessages] = React.useState<ClientMessage[]>([]);
  const [inputValue, setInputValue] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = React.useState(true);
  const [context, setContext] = React.useState("General course information.");
  const [currentSessionId, setCurrentSessionId] = React.useState<number | null>(
    null,
  );
  const { toast } = useToast();

  const scrollAreaRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (selectedCourse) {
      let courseContext = `Context for course: ${selectedCourse.name}.`;
      if (selectedCourse.description) {
        courseContext += `\nCourse Description: ${selectedCourse.description}`;
      } else {
        courseContext += `\nNo detailed description available for this course.`;
      }
      setContext(courseContext);
    } else {
      setContext(
        "General course information. Ask me about any enrolled course or general topics.",
      );
    }
  }, [selectedCourse]);

  React.useEffect(() => {
    async function initializeChat() {
      if (!studentId) return;
      setIsLoadingHistory(true);
      try {
        const session = await startOrGetChatSession(studentId);
        setCurrentSessionId(session.id);
        const history = await getChatMessages(session.id);
        setMessages(
          history.map((dbMsg) => ({
            id: dbMsg.id,
            sessionId: dbMsg.sessionId,
            sender: dbMsg.sender,
            text: dbMsg.message,
            timestamp: new Date(dbMsg.sentAt),
          })),
        );
      } catch (error) {
        toast({
          title: "Chat Error",
          description:
            "Could not initialize chat session or load history. Please try again later.",
          variant: "destructive",
        });
      } finally {
        setIsLoadingHistory(false);
      }
    }
    initializeChat();
  }, [studentId, toast]);

  React.useEffect(() => {
    if (scrollAreaRef.current) {
      const viewport = scrollAreaRef.current.querySelector(
        "[data-radix-scroll-area-viewport]",
      );
      if (viewport) {
        viewport.scrollTop = viewport.scrollHeight;
      }
    }
  }, [messages]);

  const handleSendMessage = async (event?: React.FormEvent) => {
    if (event) event.preventDefault();
    if (!inputValue.trim() || !currentSessionId) return;

    const userMessageText = inputValue;
    setInputValue("");

    const optimisticUserMessage: ClientMessage = {
      id: Date.now(),
      sender: "student",
      text: userMessageText,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, optimisticUserMessage]);
    setIsLoading(true);

    try {
      const savedUserMessage = await saveChatMessage(
        currentSessionId,
        "student",
        userMessageText,
      );
      setMessages((prev) =>
        prev.map((m) =>
          m.id === optimisticUserMessage.id
            ? {
                ...m,
                id: savedUserMessage.id,
                timestamp: new Date(savedUserMessage.sentAt),
              }
            : m,
        ),
      );

      const chatbotInput: CourseChatbotInput = {
        question: userMessageText,
        context,
      };
      const response: CourseChatbotOutput = await runFlow<
        typeof courseChatbotFlow
      >({ url: "/api/genkit/courseChatbotFlow", input: chatbotInput });

      const savedAiMessage = await saveChatMessage(
        currentSessionId,
        "bot",
        response.answer,
      );

      const aiClientMessage: ClientMessage = {
        id: savedAiMessage.id,
        sender: "bot",
        text: savedAiMessage.message,
        timestamp: new Date(savedAiMessage.sentAt),
      };
      setMessages((prev) => [...prev, aiClientMessage]);
    } catch (error) {
      const errorMessage: ClientMessage = {
        id: Date.now() + 1,
        sender: "bot",
        text: "Sorry, I had trouble getting a response or saving your message. Please try again.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
      toast({
        title: "Chat Error",
        description:
          error instanceof Error && error.message
            ? error.message
            : "Could not send your message or get a response.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCourseSelectionChange = (courseIdValue: string) => {
    if (courseIdValue === "general") {
      onSetSelectedCourseAction(null);
    } else {
      const course = allCourses.find((c) => c.id.toString() === courseIdValue);
      onSetSelectedCourseAction(course || null);
    }
  };

  return (
    <div className="flex h-full w-full flex-col">
      <ScrollArea className="flex-grow p-4" ref={scrollAreaRef}>
        <div className="space-y-6">
          {isLoadingHistory && (
            <div className="text-center text-muted-foreground py-8">
              <CornerDownLeft className="mx-auto h-12 w-12 mb-2 animate-pulse" />
              <p>Loading chat history...</p>
            </div>
          )}
          {!isLoadingHistory && messages.length === 0 && (
            <div className="text-center text-muted-foreground py-8">
              <MessageCircle className="mx-auto h-12 w-12 mb-2" />
              <p>No messages yet. Ask me anything!</p>
              {selectedCourse && (
                <p className="text-xs mt-1">
                  Current context: {selectedCourse.name}
                </p>
              )}
              {!selectedCourse && (
                <p className="text-xs mt-1">Current context: General</p>
              )}
            </div>
          )}
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex items-start space-x-2 ${
                message.sender === "student" ? "justify-end" : ""
              }`}
            >
              {message.sender === "bot" && (
                <Avatar className="h-8 w-8 flex-shrink-0">
                  <AvatarImage
                    src="https://placehold.co/32x32.png"
                    alt="AI"
                    data-ai-hint="bot avatar"
                  />
                  <AvatarFallback>
                    <Bot className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
              )}
              <div
                className={`max-w-[70%] rounded-xl px-4 py-3 shadow ${
                  message.sender === "student"
                    ? "bg-primary text-primary-foreground"
                    : "bg-card text-card-foreground"
                }`}
              >
                <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-1 prose-pre:my-1.5">
                  {renderMessageContent(message.text)}
                </div>
                <p
                  className={`text-xs mt-2 ${message.sender === "student" ? "text-primary-foreground/70 text-right" : "text-muted-foreground/70 text-left"}`}
                >
                  {message.timestamp.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
              {message.sender === "student" && (
                <Avatar className="h-8 w-8 flex-shrink-0">
                  <AvatarImage
                    src="https://placehold.co/32x32.png"
                    alt="User"
                    data-ai-hint="user avatar"
                  />
                  <AvatarFallback>
                    <User className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
              )}
            </div>
          ))}
          {isLoading && !isLoadingHistory && (
            <div className="flex items-start space-x-2">
              <Avatar className="h-8 w-8 flex-shrink-0">
                <AvatarImage
                  src="https://placehold.co/32x32.png"
                  alt="AI"
                  data-ai-hint="bot avatar"
                />
                <AvatarFallback>
                  <Bot className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
              <div className="max-w-[70%] rounded-xl bg-card px-4 py-3 shadow">
                <div className="flex space-x-1">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-muted-foreground [animation-delay:-0.3s]"></span>
                  <span className="h-2 w-2 animate-pulse rounded-full bg-muted-foreground [animation-delay:-0.15s]"></span>
                  <span className="h-2 w-2 animate-pulse rounded-full bg-muted-foreground"></span>
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
      <form
        onSubmit={handleSendMessage}
        className="border-t p-4 space-y-3 bg-background"
      >
        <div>
          <Label
            htmlFor="course-select"
            className="text-xs text-muted-foreground mb-1 block"
          >
            Select Course Context:
          </Label>
          <Select
            value={selectedCourse?.id.toString() || "general"}
            onValueChange={handleCourseSelectionChange}
          >
            <SelectTrigger id="course-select" className="w-full text-sm">
              <SelectValue placeholder="Select a course context" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="general">
                General / No Specific Course
              </SelectItem>
              {allCourses.map((course) => (
                <SelectItem key={course.id} value={course.id.toString()}>
                  {course.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label
            htmlFor="chatbot-context-display"
            className="text-xs text-muted-foreground mb-1 block"
          >
            Current Chat Context (auto-updated from selection):
          </Label>
          <Textarea
            id="chatbot-context-display"
            value={context}
            readOnly
            rows={selectedCourse?.description ? 4 : 2}
            className="text-xs p-2 h-auto resize-none mb-2 bg-muted/50"
          />
        </div>
        <div className="relative">
          <Input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={
              currentSessionId
                ? "Type your question..."
                : "Initializing chat..."
            }
            className="pr-20 text-base"
            disabled={isLoading || !currentSessionId || isLoadingHistory}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
          />
          <div className="absolute right-1 top-1/2 -translate-y-1/2 flex space-x-1">
            <Button
              type="submit"
              size="icon"
              disabled={
                isLoading ||
                !inputValue.trim() ||
                !currentSessionId ||
                isLoadingHistory
              }
              className="h-8 w-8"
            >
              {isLoading ? (
                <CornerDownLeft className="h-4 w-4 animate-ping" />
              ) : (
                <SendHorizonal className="h-4 w-4" />
              )}
              <span className="sr-only">Send</span>
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
