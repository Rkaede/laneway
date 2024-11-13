import typography from '@tailwindcss/typography';

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        border: 'hsl(var(--border))',
        foreground: 'hsl(var(--foreground))',
        'muted-foreground': 'hsl(var(--muted-foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        background: {
          DEFAULT: 'hsl(var(--background))',
          main: 'hsl(var(--background-main))',
          2: 'hsl(var(--background-2))',
          3: 'hsl(var(--background-3))',
          4: 'hsl(var(--background-4))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        assistant: {
          DEFAULT: 'hsl(var(--chat-assistant))',
          foreground: 'hsl(var(--chat-assistant-foreground))',
        },
        user: {
          DEFAULT: 'hsl(var(--chat-user))',
          foreground: 'hsl(var(--chat-user-foreground))',
        },
      },
      backgroundImage: {
        // used for the fade-out effect in the scroll panel
        'fade-out': 'linear-gradient(rgba(19, 19, 20, 0), rgb(19, 19, 20, 0.8))',
      },
    },
  },
  plugins: [typography],
};
