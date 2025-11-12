export default function Docs() {
  return (
    <main className="prose prose-invert max-w-none">
      <h1>How to use DiveMix</h1>

      <h2>Planner</h2>
      <ul>
        <li>
          Choose <b>Units</b> (m/ft), set <b>Depth</b>, <b>Time</b>, <b>FO₂</b>,{' '}
          <b>Max PPO₂</b>, and <b>SAC</b>.
        </li>
        <li>
          Results show <b>PPO₂</b>, <b>MOD</b>, <b>Gas Used</b>, <b>CNS%</b>, and{' '}
          <b>OTU</b>.
        </li>
        <li>
          <b>Save</b> stores locally; <b>Save to Cloud</b> requires login (Supabase).
        </li>
        <li>
          <b>Share Link</b> → editable link; <b>Copy Public Link</b> → read-only viewer
          (/v/&lt;code&gt;).
        </li>
      </ul>

      <h2>Nitrox</h2>
      <ul>
        <li>
          <b>Best Mix</b> = PPO₂ / (depth pressure). MOD based on FO₂ and PPO₂.
        </li>
        <li>
          <b>Top-up helper</b> gives rough O₂/air split for partial-pressure blending
          (analyze after filling).
        </li>
      </ul>

      <h2>Trimix (MVP)</h2>
      <ul>
        <li>
          Pick <b>Depth</b>, <b>Max PPO₂</b>, and target <b>END</b>.
        </li>
        <li>We compute O₂ % for PPO₂, derive N₂ % from END, then He % = 1 - O₂ - N₂.</li>
        <li>Bounds enforced (0–100%). If infeasible, you’ll see a warning.</li>
      </ul>

      <h2>Disclaimers</h2>
      <p>
        <b>Educational tool only.</b> Always verify with agency tables/procedures and a
        dive computer. For gas blending, follow certified procedures, analyze every
        cylinder, and label accordingly. Tech dives require formal training.
      </p>
    </main>
  );
}
