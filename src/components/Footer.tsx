export default function Footer() {
  return (
    <footer className="mt-10 text-xs text-zinc-500">
      <a className="underline" href="mailto:hello@divemix.io">
        Feedback
      </a>{' '}
      ·
      <a className="underline ml-2" href="/legal/privacy">
        Privacy
      </a>{' '}
      · ·
      <a className="underline ml-2" href="/docs">
        Docs
      </a>
      <a className="underline ml-2" href="/legal/terms">
        Terms
      </a>
    </footer>
  );
}
