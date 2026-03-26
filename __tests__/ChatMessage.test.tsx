import React from 'react';
import { render } from '@testing-library/react-native';
import { ChatMessage } from '@/driver/components/ChatMessage';

describe('ChatMessage', () => {
  it('renders user message', () => {
    const { getByText } = render(<ChatMessage role="user" content="Hello" timestamp="" />);
    expect(getByText('Hello')).toBeTruthy();
  });

  it('renders assistant message', () => {
    const { getByText } = render(
      <ChatMessage role="assistant" content="How can I help?" timestamp="" />,
    );
    expect(getByText('How can I help?')).toBeTruthy();
  });

  it('renders AI avatar for assistant messages', () => {
    const { getByText } = render(
      <ChatMessage role="assistant" content="Hello from AI" timestamp="" />,
    );
    expect(getByText('AI')).toBeTruthy();
  });

  it('does not render AI avatar for user messages', () => {
    const { queryByText } = render(
      <ChatMessage role="user" content="User message" timestamp="" />,
    );
    expect(queryByText('AI')).toBeNull();
  });
});
