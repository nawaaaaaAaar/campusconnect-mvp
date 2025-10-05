import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Header } from '../Header';

// Mock the useAuth hook
jest.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { email: 'test@example.com' },
    profile: { name: 'Test User', account_type: 'student' }
  })
}));

const MockedHeader = () => (
  <BrowserRouter>
    <Header 
      onCreatePost={() => {}}
      onNotificationClick={() => {}}
      onSignOut={() => {}}
      unreadCount={0}
    />
  </BrowserRouter>
);

describe('Header Component', () => {
  test('renders CampusConnect logo', () => {
    render(<MockedHeader />);
    expect(screen.getByText('CampusConnect')).toBeInTheDocument();
  });

  test('renders search bar', () => {
    render(<MockedHeader />);
    expect(screen.getByPlaceholderText('Search societies, posts, or topics...')).toBeInTheDocument();
  });

  test('renders user menu', () => {
    render(<MockedHeader />);
    expect(screen.getByText('Test User')).toBeInTheDocument();
  });
});
