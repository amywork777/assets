# 3D Homegoods Configurator

A web-based 3D configurator for customizing and ordering home goods. Built with Next.js, Three.js, and React Three Fiber.

## Features

- Interactive 3D model customization
- Real-time model updates
- Multiple product categories (lampshades, vases, bowls, etc.)
- Pattern and material customization
- STL file export
- Stripe integration for payments
- Custom order requests

## Tech Stack

- Next.js 14
- React Three Fiber
- Three.js
- TypeScript
- Tailwind CSS
- Stripe API

## Getting Started

1. Clone the repository:
```bash
git clone https://github.com/yourusername/3d-configurator.git
cd 3d-configurator
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Set up environment variables:
   - Copy `.env.example` to `.env.local`
   - Fill in your Stripe API keys and other required variables

4. Run the development server:
```bash
npm run dev
# or
yarn dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Environment Variables

The following environment variables are required:

- `STRIPE_SECRET_KEY`: Your Stripe secret key
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`: Your Stripe publishable key
- `NEXT_PUBLIC_APP_URL`: The URL where your app is running

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details. 