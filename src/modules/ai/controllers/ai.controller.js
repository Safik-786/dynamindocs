import { NextResponse } from "next/server";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { PromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser, StructuredOutputParser } from "@langchain/core/output_parsers";
import { createUIMessageStreamResponse } from "ai";
import { toUIMessageStream } from "@ai-sdk/langchain";
import { z } from "zod";

const getModel = (temperature = 0.2) => {
  return new ChatGoogleGenerativeAI({
    model: "gemini-2.5-flash",
    temperature,
    apiKey: process.env.GEMINI_API_KEY,
  });
};

export const summarize = async (ctx) => {
  const { documentText } = await ctx.req.json();

  if (!documentText) {
    return NextResponse.json({ error: "Missing document text" }, { status: 400 });
  }

  const model = getModel(0.2);
  const prompt = PromptTemplate.fromTemplate(`
    You are a helpful AI assistant. Please provide a concise summary of the following document.
    Focus on the main points and key takeaways.
    
    Document:
    {documentText}
    
    Summary:
  `);

  const chain = prompt.pipe(model).pipe(new StringOutputParser());
  const summary = await chain.invoke({ documentText });

  return NextResponse.json({ summary });
};

export const rewrite = async (ctx) => {
  const { text, tone = "professional" } = await ctx.req.json();

  if (!text) {
    return NextResponse.json({ error: "Missing text to rewrite" }, { status: 400 });
  }

  const model = getModel(0.4);
  const prompt = PromptTemplate.fromTemplate(`
    You are a helpful AI assistant. Please rewrite the following text to sound more {tone}.
    Only return the rewritten text, without any additional explanations or quotes.
    
    Original Text:
    {text}
    
    Rewritten Text:
  `);

  const chain = prompt.pipe(model).pipe(new StringOutputParser());
  const rewrittenText = await chain.invoke({ text, tone });

  return NextResponse.json({ rewrittenText: rewrittenText.trim() });
};

export const actionItems = async (ctx) => {
  const { documentText } = await ctx.req.json();

  if (!documentText) {
    return NextResponse.json({ error: "Missing document text" }, { status: 400 });
  }

  const model = getModel(0.1);
  const schema = z.object({
    actionItems: z.array(z.string()).describe("An array of specific tasks or action items extracted from the text"),
  });
  
  const parser = StructuredOutputParser.fromZodSchema(schema);
  const prompt = PromptTemplate.fromTemplate(`
    You are a helpful AI assistant. Extract all action items, tasks, and to-dos from the following document.
    
    {format_instructions}
    
    Document:
    {documentText}
  `);

  const chain = prompt.pipe(model).pipe(parser);
  const result = await chain.invoke({
    documentText,
    format_instructions: parser.getFormatInstructions(),
  });

  return NextResponse.json({ actionItems: result.actionItems });
};

export const chat = async (ctx) => {
  const { messages, documentText } = await ctx.req.json();

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json({ error: "Missing or invalid messages" }, { status: 400 });
  }

  const model = getModel(0.3);
  const prompt = PromptTemplate.fromTemplate(`
    You are a helpful AI assistant integrated into a document editor.
    Use the following document text as context to answer the user's questions.
    If the user asks something completely unrelated to the document, answer politely but gently remind them you are here to help with the document.
    
    Document Context:
    ---
    {documentText}
    ---
    
    Current Chat History:
    {chatHistory}
    
    User: {input}
    AI Assistant:
  `);

  const chatHistory = messages
    .slice(0, -1)
    .map((m) => `${m.role === "user" ? "User" : "AI Assistant"}: ${m.content}`)
    .join("\n");
    
  const latestMessage = messages[messages.length - 1].content;

  const chain = prompt.pipe(model).pipe(new StringOutputParser());

  try {
    const reply = await chain.invoke({
      documentText: documentText || "The document is currently empty.",
      chatHistory: chatHistory || "No previous history.",
      input: latestMessage,
    });

    return NextResponse.json({ reply });
  } catch (error) {
    console.error("AI CHAT ERROR:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
};
