# Contributing to TerraGuardians

Thanks for your interest in improving TerraGuardians! 🌍

## Getting started

```bash
git clone https://github.com/<your-fork>/terra-pulse-watch.git
cd terra-pulse-watch
npm install
cp .env.example .env   # fill in your Supabase keys
npm run dev
```

The app runs at http://localhost:8080.

## Project structure

See the [Project Structure](README.md#-project-structure) section in the README.

## Development workflow

1. Create a branch: `git checkout -b feat/my-change`
2. Make your changes
3. Run checks locally:
   ```bash
   npm run lint
   npm run build
   ```
4. Commit using [Conventional Commits](https://www.conventionalcommits.org/):
   - `feat: add satellite filter`
   - `fix: blank screen on refresh`
   - `docs: update README`
5. Push and open a Pull Request against `main`

## Code style

- **TypeScript strict** — no `any` unless justified
- **Tailwind semantic tokens only** — never hardcode colors (`text-white`, `bg-black`). Use design tokens from `src/index.css` and `tailwind.config.ts`
- **Small, focused components** — split files >300 lines
- **No client-side role checks** — use Supabase RLS

## Reporting bugs

Open an issue using the **Bug report** template. Include console logs and reproduction steps.

## Security

Found a security issue? Please **don't open a public issue**. Email the maintainers instead.

## License

By contributing, you agree your contributions will be licensed under the MIT License.
