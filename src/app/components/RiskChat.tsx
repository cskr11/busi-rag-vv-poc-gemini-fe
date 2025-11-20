'use client';

import { useState, useRef, useEffect } from 'react';
import axios from 'axios';

import {
  Box,
  Paper,
  Typography,
  TextField,
  IconButton,
  Card,
  CardContent,
  Divider,
  CircularProgress, // Added for loading state
} from '@mui/material';

import SendIcon from '@mui/icons-material/Send';

// API URL should point to your FastAPI service
const API_URL = 'http://localhost:8000';

// --- Frontend Data Structures ---

// Matches the backend's Context Pydantic model
type RiskMetadata = {
  company_name: string;
  risk_category: string;
  risk_subcategory: string;
  priority: number;
  doc_type?: string;
  source_name?: string;
  duns_id?: string;
  file_source_tag?: string;
  business_id?: string;
};

type RiskContextItem = {
  content: string;
  metadata: RiskMetadata;
};

// The main message type stored in the component's state
type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
  context?: RiskContextItem[];
};

// Matches the required history structure for the backend API
type BackendChatMessage = {
  role: 'user' | 'model'; // NOTE: Backend expects 'model' for assistant
  text: string;
};

type RiskChatProps = {
  initialResponse?: {
    query?: string;
    status?: string;
    count?: number;
    context?: RiskContextItem[];
  };
};

export default function RiskChat({ initialResponse }: RiskChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    if (initialResponse?.context?.length) {
      return [
        {
          role: 'assistant',
          content: initialResponse.query
            ? `Here are the initial risk findings for: "${initialResponse.query}"`
            : 'Loaded initial risk data.',
          context: initialResponse.context,
        },
      ];
    }
    return [];
  });
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Scroll to the bottom on new message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const newUserMessage: ChatMessage = { role: 'user', content: input };
    const currentInput = input;

    // 1. Optimistically add the user message to the UI
    setMessages((prev) => [...prev, newUserMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // 2. Compile the conversation history for the backend
      // We map the *current* state (which contains all previous turns)
      const history: BackendChatMessage[] = messages.map((msg) => ({
        // Map frontend 'assistant' role to backend 'model' role
        role: msg.role === 'assistant' ? 'model' : 'user',
        text: msg.content,
      }));

      // 3. Construct the full request body
      const requestBody = {
        query: currentInput, // The new user message
        history: history, // All previous messages
        k: 5, // Example k value
        // filters: { ... }  // Add filters here if needed
      };

      const response = await axios.post(API_URL + '/chat', requestBody);
      const data = response.data;

      // 4. Create the new assistant message from the API response
      const newAssistantMessage: ChatMessage = {
        role: 'assistant',
        content: data.response,
        context: data.context || [],
      };

      // 5. Update state: replace the temporary user message with the full conversation
      setMessages((prev) => {
        // Find and replace the temporary user message, then add the assistant response
        const newMessages = prev.slice(0, prev.length - 1);
        return [...newMessages, newUserMessage, newAssistantMessage];
      });
    } catch (error) {
      console.error('API Error:', error);
      // Rollback the optimistic update and show an error message
      setMessages((prev) => [
        ...prev.slice(0, prev.length - 1),
        {
          role: 'assistant',
          content: `Sorry, an error occurred while processing your query. (Error: ${
            error ?? 'Unknown'
          })`,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const getMessageColor = (role: 'user' | 'assistant') =>
    role === 'user' ? '#bbdefb' : '#e0e0e0';

  const getContextMetadata = (metadata: RiskMetadata) => {
    return (
      <Box
        sx={{
          mt: 1,
          p: 1,
          border: '1px solid #ccc',
          borderRadius: 1,
          bgcolor: '#fafafa',
        }}
      >
        <Typography variant='caption'>
          **{metadata.company_name}** ({metadata.file_source_tag?.toUpperCase()}
          )
        </Typography>
        <Typography variant='caption' display='block'>
          Category: {metadata.risk_category} | Priority: {metadata.priority}
        </Typography>
      </Box>
    );
  };

  return (
    <Box
      sx={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        p: 2,
        bgcolor: '#f5f5f5',
      }}
    >
      <Paper
        elevation={3}
        sx={{
          width: '100%',
          maxWidth: 900,
          height: '90vh',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: 2,
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <Box
          sx={{
            p: 2,
            bgcolor: '#1976d2',
            color: 'white',
            textAlign: 'center',
          }}
        >
          <Typography variant='h6'>Risk Intelligence Chatbot</Typography>
        </Box>

        {/* Message Area */}
        <Box
          sx={{
            flexGrow: 1,
            overflowY: 'auto',
            p: 2,
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
          }}
        >
          {messages.map((message, index) => (
            <Box
              key={index}
              sx={{
                display: 'flex',
                justifyContent:
                  message.role === 'user' ? 'flex-end' : 'flex-start',
              }}
            >
              <Paper
                elevation={1}
                sx={{
                  maxWidth: '80%',
                  p: 1.5,
                  borderRadius: 2,
                  bgcolor: getMessageColor(message.role),
                }}
              >
                {/* --- START OF FIX: Use dangerouslySetInnerHTML for Markdown rendering --- */}
                <Box
                  // We need to use dangerouslySetInnerHTML to render the raw markdown/HTML content
                  // which is generated by the LLM (e.g., using **bolding** and * lists)
                  dangerouslySetInnerHTML={{
                    __html: message.content.replace(/\n/g, '<br />'), // Optional: Convert \n to <br> for better newline display
                  }}
                  sx={{
                    // Apply styles equivalent to Typography variant='body1' for proper display
                    typography: 'body1',
                    '& strong': {
                      fontWeight: 600, // Ensure bold text is prominent
                    },
                    // Optional: Style the list items if the markdown is parsed into an unordered list
                    '& ul': {
                      paddingLeft: '20px',
                      marginTop: '8px',
                      marginBottom: '8px',
                    },
                  }}
                />
                {/* --- END OF FIX --- */}

                {/* Display Context for Assistant Messages 
                {message.context && message.context.length > 0 && (
                    <Box sx={{ mt: 1, pt: 1, borderTop: '1px solid #ccc' }}>
                        <Typography variant='caption' sx={{ fontWeight: 'bold' }}>
                            Retrieved Context:
                        </Typography>
                        {message.context.slice(0, 3).map((ctx, ctxIndex) => (
                            <Card key={ctxIndex} variant="outlined" sx={{ mt: 1 }}>
                                <CardContent sx={{ p: 1, '&:last-child': { pb: 1 } }}>
                                    {getContextMetadata(ctx.metadata)}
                                    <Typography variant='body2' sx={{ whiteSpace: 'pre-wrap', mt: 0.5 }}>
                                        {ctx.content.substring(0, 150)}...
                                    </Typography>
                                </CardContent>
                            </Card>
                        ))}
                         {message.context.length > 3 && (
                            <Typography variant='caption' sx={{ display: 'block', mt: 0.5 }}>
                                + {message.context.length - 3} more context item(s) retrieved.
                            </Typography>
                        )}
                    </Box>
                )}*/}

                {message.context?.map((ctx, i) => (
                  <Card
                    key={i}
                    sx={{ mt: 2, bgcolor: '#fafafa', borderRadius: 3 }}
                  >
                    <CardContent>
                      <Typography variant='h6' sx={{ fontWeight: 600, mb: 1 }}>
                        {ctx.metadata.company_name}
                      </Typography>

                      <Typography variant='body2'>
                        <strong>Category:</strong> {ctx.metadata.risk_category}
                        <br />
                        <strong>Subcategory:</strong>{' '}
                        {ctx.metadata.risk_subcategory}
                        <br />
                        <strong>Priority:</strong> {ctx.metadata.priority}
                      </Typography>

                      <Divider sx={{ my: 1 }} />

                      <Typography
                        variant='body2'
                        sx={{ whiteSpace: 'pre-wrap' }}
                      >
                        {ctx.content}
                      </Typography>
                    </CardContent>
                  </Card>
                ))}
              </Paper>
            </Box>
          ))}

          {/* Loading Indicator */}
          {isLoading && (
            <Box sx={{ display: 'flex', justifyContent: 'flex-start' }}>
              <CircularProgress size={24} sx={{ m: 1 }} />
            </Box>
          )}

          <div ref={bottomRef} />
        </Box>

        {/* Input Bar */}
        <Box
          sx={{
            display: 'flex',
            p: 2,
            bgcolor: '#f5f5f5',
            borderTop: '1px solid #ddd',
          }}
        >
          <TextField
            fullWidth
            placeholder='Ask something...'
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            disabled={isLoading}
          />

          <IconButton
            color='primary'
            onClick={sendMessage}
            sx={{ ml: 1 }}
            disabled={isLoading}
          >
            <SendIcon />
          </IconButton>
        </Box>
      </Paper>
    </Box>
  );
}
