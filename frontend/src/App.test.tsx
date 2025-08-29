import React from 'react';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import store from './store';
import '@testing-library/jest-dom';

test('renders tech radar app', () => {
  render(
    <Provider store={store}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </Provider>
  );
  const navElement = screen.getByText(/Tech Radar/i);
  expect(navElement).toBeInTheDocument();
});