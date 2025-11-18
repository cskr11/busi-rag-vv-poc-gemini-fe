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
} from '@mui/material';

import SendIcon from '@mui/icons-material/Send';

const API_URL = 'http://localhost:8080';

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

type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
  context?: RiskContextItem[];
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
            ? `Here are the high priority risks for: "${initialResponse.query}"`
            : 'Loaded initial risk data.',
          context: initialResponse.context,
        },
      ];
    }
    return [
      { role: 'assistant', content: 'Ask a query to retrieve risk findings.' },
    ];
  });

  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage: ChatMessage = { role: 'user', content: input };
    setMessages((prev) => [...prev, userMessage]);

    try {
      const backendResponse = await axios.post(`${API_URL}/retrieve`, {
        query: input,
        k: 5,
      });

      const resp = backendResponse?.data;

      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: resp?.response || 'Here are the results:',
        context: resp?.context || [],
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Error: Could not connect to backend.',
        },
      ]);
    }

    setInput('');
  };

  return (
    <Box
      sx={{
        height: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        bgcolor: '#f3f4f6',
        p: 2,
      }}
    >
      <Paper
        elevation={4}
        sx={{
          width: '90%',
          maxWidth: 900,
          height: '90vh',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: 4,
          overflow: 'hidden',
        }}
      >
        {/* Chat Messages */}
        <Box
          sx={{
            flex: 1,
            overflowY: 'auto',
            p: 3,
            bgcolor: 'white',
          }}
        >
          {messages.map((msg, index) => (
            <Box
              key={index}
              sx={{
                display: 'flex',
                justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                mb: 2,
              }}
            >
              <Box
                sx={{
                  maxWidth: '80%',
                  bgcolor: msg.role === 'user' ? '#DCF8C6' : '#E8EAF6',
                  p: 2,
                  borderRadius: 3,
                }}
              >
                <Typography variant='body1' sx={{ fontWeight: 500 }}>
                  {msg.role === 'user' ? 'You' : 'AI Assistant'}
                </Typography>

                <Typography
                  variant='body2'
                  sx={{ mt: 1, whiteSpace: 'pre-wrap' }}
                >
                  {msg.content}
                </Typography>

                {msg.role === 'assistant' &&
                  msg.context &&
                  msg.context.map((ctx, i) => (
                    <Card
                      key={i}
                      sx={{ mt: 2, bgcolor: '#fafafa', borderRadius: 3 }}
                    >
                      <CardContent>
                        <Typography
                          variant='h6'
                          sx={{ fontWeight: 600, mb: 1 }}
                        >
                          {ctx.metadata.company_name}
                        </Typography>

                        <Typography variant='body2'>
                          <strong>Category:</strong>{' '}
                          {ctx.metadata.risk_category}
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
              </Box>
            </Box>
          ))}

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
          />

          <IconButton color='primary' onClick={sendMessage} sx={{ ml: 1 }}>
            <SendIcon />
          </IconButton>
        </Box>
      </Paper>
    </Box>
  );
}
