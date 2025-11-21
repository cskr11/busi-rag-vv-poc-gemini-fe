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
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails, // Added for loading state
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

import SendIcon from '@mui/icons-material/Send';

// API URL should point to your FastAPI service
const API_URL = 'http://localhost:8080';

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
          content: `Sorry, an error occurred while processing your query. (Error: ${error ?? 'Unknown'
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
                    // 1. General Typography and Text Flow
                    typography: 'body1',
                    '& strong': {
                      fontWeight: 600, // Ensure bold text is prominent
                    },

                    // 2. STYLING FOR MARKDOWN HEADINGS (###)
                    // Since the LLM output is "### 1. Section Title", we target the h3 tag
                    '& h3': {
                      // Apply distinct heading styling, similar to MUI's Typography h5/h6
                      typography: 'h6',
                      fontWeight: 700,
                      marginTop: '1.5rem', // Add space above the section title
                      marginBottom: '0.5rem',
                      color: '#1976d2', // Use a primary color for clear separation (Blue)
                      borderBottom: '2px solid #e0e0e0', // Add a separator line
                      paddingBottom: '4px'
                    },

                    // 3. STYLING FOR MARKDOWN LISTS (*)
                    '& ul': {
                      paddingLeft: '20px',
                      marginTop: '8px',
                      marginBottom: '8px',
                      // Optional: Narrow the list item typography slightly for the structured list (Section 2)
                      '& li': {
                        typography: 'body2',
                        marginBottom: '4px',
                      }
                    },

                    // 4. STYLING FOR THE CUSTOM BOLDED HEADERS (like in Section 3)
                    // This targets bolded text that the LLM uses as a sub-header
                    '& p strong:first-child': {
                      display: 'block',
                      marginTop: '1rem',
                      color: '#388e3c' // Green color for source/content clarity
                    }
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

                {message.context && message.context.length > 0 && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="h6" sx={{ color: '#1976d2', fontWeight: 600, mb: 1 }}>
                      {message.context.length} Retrieved Source Document{message.context.length > 1 ? 's' : ''}
                    </Typography>

                    {/* 1. SCENARIO: Multiple Context Items -> Use Accordions */}
                    {message.context.length > 1 ? (
                      <Box>
                        {message.context.map((ctx, i) => (
                          <Accordion
                            key={i}
                            defaultExpanded={i === 0} // Expand the first item by default
                            sx={{ mt: 1, bgcolor: '#fafafa', borderRadius: 1 }}
                          >
                            <AccordionSummary
                              expandIcon={<ExpandMoreIcon />}
                              aria-controls={`panel-${i}-content`}
                              id={`panel-${i}-header`}
                            >
                              <Typography variant='subtitle1' sx={{ fontWeight: 600 }}>
                                Document {i + 1}: {ctx.metadata.company_name} - {ctx.metadata.risk_subcategory}
                              </Typography>
                            </AccordionSummary>
                            <AccordionDetails sx={{ p: 2, pt: 0 }}>
                              <Box sx={{ mb: 1 }}>
                                <Typography variant='body2'>
                                  <strong>Entity:</strong> {ctx.metadata.company_name}<br />
                                  <strong>Category:</strong> {ctx.metadata.risk_category}<br />
                                  <strong>Subcategory:</strong> {ctx.metadata.risk_subcategory}<br />
                                  <strong>Priority:</strong> {ctx.metadata.priority}
                                </Typography>
                              </Box>

                              <Divider sx={{ my: 1 }} />

                              <Typography
                                variant='body2'
                                sx={{ whiteSpace: 'pre-wrap' }}
                              >
                                {ctx.content}
                              </Typography>
                            </AccordionDetails>
                          </Accordion>
                        ))}
                      </Box>
                    ) : (
                      /* 2. SCENARIO: Single Context Item -> Use simple Card */
                      <Card sx={{ mt: 1, bgcolor: '#fafafa', borderRadius: 3 }}>
                        <CardContent>
                          <Typography variant='h6' sx={{ fontWeight: 600, mb: 1 }}>
                            {message.context[0].metadata.company_name}
                          </Typography>

                          <Typography variant='body2'>
                            <strong>Category:</strong> {message.context[0].metadata.risk_category}<br />
                            <strong>Subcategory:</strong> {message.context[0].metadata.risk_subcategory}<br />
                            <strong>Priority:</strong> {message.context[0].metadata.priority}
                          </Typography>

                          <Divider sx={{ my: 1 }} />

                          <Typography
                            variant='body2'
                            sx={{ whiteSpace: 'pre-wrap' }}
                          >
                            {message.context[0].content}
                          </Typography>
                        </CardContent>
                      </Card>
                    )}
                  </Box>
                )}
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
